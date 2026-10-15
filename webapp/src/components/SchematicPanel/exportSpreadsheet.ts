import JSZip from 'jszip';
import type { TickGrid } from '../../types';
import {
  MAX_EXCEL_COLUMNS,
  buildBlocksSheet,
  buildSchematicSheet,
  escapeXml,
  isDarkFill,
  type SheetCell,
  type SheetData
} from './exportExcel';

function csvField(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV is plain text: the schematic, a blank line, then the block totals. No colours. */
export function buildSchematicCsv(grid: TickGrid): string {
  const lines = [buildSchematicSheet(grid), buildBlocksSheet(grid)].flatMap((sheet, i) => [
    ...(i > 0 ? [''] : []),
    ...sheet.rows.map((row) => row.map((c) => (c ? csvField(c.text) : '')).join(','))
  ]);
  // The BOM makes Excel read the file as UTF-8 so the ┬ and │ symbols survive.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function odsCellStyleName(index: number) {
  return `ce${index}`;
}

function odsContent(sheets: SheetData[]): string {
  const styleKeys: string[] = [];
  const styleXml: string[] = [];
  const styleFor = (c: SheetCell): string | null => {
    if (!c.fill && !c.bold) return null;
    const key = `${c.fill ?? ''}|${c.bold ? 1 : 0}`;
    let i = styleKeys.indexOf(key);
    if (i === -1) {
      styleKeys.push(key);
      const color = c.fill && isDarkFill(c.fill) ? ' fo:color="#ffffff"' : '';
      const weight = c.bold ? ' fo:font-weight="bold"' : '';
      const bg = c.fill ? ` fo:background-color="#${c.fill.toLowerCase()}"` : '';
      styleXml.push(
        `<style:style style:name="${odsCellStyleName(styleKeys.length - 1)}" style:family="table-cell">` +
          `<style:table-cell-properties${bg} fo:border="0.5pt solid #999999"/>` +
          `<style:paragraph-properties fo:text-align="center"/>` +
          `<style:text-properties${color}${weight}/></style:style>`
      );
      i = styleKeys.length - 1;
    }
    return odsCellStyleName(i);
  };

  const tables = sheets
    .map((sheet) => {
      const rows = sheet.rows
        .map((row) => {
          const cells = row
            .map((c) => {
              if (!c) return '<table:table-cell/>';
              const style = styleFor(c);
              const attr = style ? ` table:style-name="${style}"` : '';
              return typeof c.text === 'number'
                ? `<table:table-cell${attr} office:value-type="float" office:value="${c.text}"><text:p>${c.text}</text:p></table:table-cell>`
                : `<table:table-cell${attr} office:value-type="string"><text:p>${escapeXml(c.text)}</text:p></table:table-cell>`;
            })
            .join('');
          return `<table:table-row>${cells || '<table:table-cell/>'}</table:table-row>`;
        })
        .join('');
      return `<table:table table:name="${escapeXml(sheet.name)}">${rows}</table:table>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
    'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" ' +
    'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" ' +
    'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
    'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.2">' +
    `<office:automatic-styles>${styleXml.join('')}</office:automatic-styles>` +
    `<office:body><office:spreadsheet>${tables}</office:spreadsheet></office:body></office:document-content>`
  );
}

/** OpenDocument spreadsheet (LibreOffice, Google Sheets, Excel) with colours and both sheets. */
export async function buildSchematicOds(grid: TickGrid): Promise<Blob> {
  const schematic = buildSchematicSheet(grid);
  const width = schematic.rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (width > MAX_EXCEL_COLUMNS) {
    throw new Error(`The schematic is ${width} blocks long, which is more than the ${MAX_EXCEL_COLUMNS} columns spreadsheets support.`);
  }

  const mime = 'application/vnd.oasis.opendocument.spreadsheet';
  const zip = new JSZip();
  // The mimetype entry must come first and be stored uncompressed.
  zip.file('mimetype', mime, { compression: 'STORE' });
  zip.file(
    'META-INF/manifest.xml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">' +
      `<manifest:file-entry manifest:full-path="/" manifest:media-type="${mime}"/>` +
      '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' +
      '</manifest:manifest>'
  );
  zip.file('content.xml', odsContent([schematic, buildBlocksSheet(grid)]));
  return zip.generateAsync({ type: 'blob', mimeType: mime });
}
