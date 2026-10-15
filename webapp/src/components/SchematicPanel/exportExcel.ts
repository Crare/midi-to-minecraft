import JSZip from 'jszip';
import type { TickGrid } from '../../types';
import {
  blockColorFor,
  blockLabel,
  computeRawResources,
  computeSchematicDimensions,
  computeTickGridBlockCounts,
  getUseCount
} from './schematicData';

// Excel's hard limit on worksheet width.
export const MAX_EXCEL_COLUMNS = 16384;

const DUST_FILL = 'D9D9D9';
const REPEATER_FILL = 'F4B6B6';
const BRANCH_FILL = 'F5B041';
const HEADER_FILL = 'E8E2D0';

export interface SheetCell {
  text: string | number;
  fill?: string;
  bold?: boolean;
}

export type SheetRow = (SheetCell | null)[];

export interface SheetData {
  name: string;
  rows: SheetRow[];
  columnWidths?: number[];
  /** Freeze the header row and the three label columns. */
  frozen?: boolean;
}

function cell(text: string | number, fill?: string, bold?: boolean): SheetCell {
  return { text, fill, bold };
}

/** One spreadsheet row per schematic lane; one column per block along X. */
export function buildSchematicSheet(grid: TickGrid): SheetData {
  const anchorColumns: number[] = [];
  const rows: SheetRow[] = [];
  const bodyRows: SheetRow[] = [];

  grid.instruments.forEach((inst) => {
    const instFill = blockColorFor(inst.block).replace('#', '').toUpperCase();
    inst.rows.forEach((row) => {
      const cells: SheetRow = [
        cell(inst.label, instFill),
        cell(row.isSub ? 'sub-lane' : 'main lane'),
        cell('•', DUST_FILL)
      ];

      for (let ai = 0; ai <= grid.anchors.length; ai++) {
        (row.segments[ai] ?? []).forEach((seg) => {
          cells.push(seg.kind === 'repeater' ? cell(`R${seg.ticks}`, REPEATER_FILL) : cell('•', DUST_FILL));
        });
        if (ai >= grid.anchors.length) continue;

        if (anchorColumns.length <= ai) anchorColumns.push(cells.length);
        const anchor = row.anchorCells[ai];
        if (!anchor || anchor.kind === 'inactive') {
          cells.push(null);
        } else if (anchor.kind === 'note') {
          cells.push(
            anchor.note
              ? cell(
                  `${anchor.note.pitch ?? 'perc'} (${getUseCount(anchor.note.note)})`,
                  blockColorFor(anchor.note.block ?? inst.block).replace('#', '').toUpperCase(),
                  true
                )
              : cell('•', DUST_FILL)
          );
        } else {
          cells.push(anchor.kind === 'split-branch' ? cell('┬', BRANCH_FILL) : cell('│', DUST_FILL));
        }
      }
      bodyRows.push(cells);
    });
  });

  const width = bodyRows.reduce((m, r) => Math.max(m, r.length), 0);
  const header: SheetRow = [cell('Instrument', HEADER_FILL, true), cell('Lane', HEADER_FILL, true), cell('Start', HEADER_FILL, true)];
  while (header.length < width) header.push(null);
  anchorColumns.forEach((col, i) => {
    header[col] = cell(grid.anchors[i].kind === 'split' ? `split t${grid.anchors[i].tick}` : `t${grid.anchors[i].tick}`, HEADER_FILL, true);
  });

  rows.push(header, ...bodyRows);
  return { name: 'Schematic', rows, columnWidths: [16, 11, 7], frozen: true };
}

export function buildBlocksSheet(grid: TickGrid): SheetData {
  const counts = computeTickGridBlockCounts(grid);
  const raw = computeRawResources(counts);
  const dims = computeSchematicDimensions(grid);
  const heading = (t: string): SheetRow => [cell(t, HEADER_FILL, true), cell('Count', HEADER_FILL, true)];

  const rows: SheetRow[] = [
    heading('Blocks needed'),
    [cell('Note blocks'), cell(counts.noteblocks)],
    [cell('Repeaters'), cell(counts.repeaters)],
    [cell('Redstone dust'), cell(counts.dust)],
    ...[...counts.supportMap.entries()].map(
      ([id, n]): SheetRow => [cell(`${blockLabel(id)} (support)`, blockColorFor(id).replace('#', '').toUpperCase()), cell(n)]
    ),
    [],
    heading('Raw resources'),
    [cell('Logs'), cell(raw.logs)],
    [cell('Planks'), cell(raw.planks)],
    [cell('Redstone dust'), cell(raw.redstoneDust)],
    [cell('Redstone blocks'), cell(raw.redstoneBlocks)],
    [cell('Stone'), cell(raw.stone)],
    [],
    heading('Minimum build area (blocks)'),
    [cell('X (long)'), cell(dims.x)],
    [cell('Z (wide)'), cell(dims.z)],
    [cell('Y (tall)'), cell(dims.y)],
    [],
    [cell('Legend', HEADER_FILL, true)],
    [cell('R1-R4', REPEATER_FILL), cell('Repeater, delay in ticks')],
    [cell('•', DUST_FILL), cell('Redstone dust')],
    [cell('┬', BRANCH_FILL), cell('Branch from another lane')],
    [cell('C# (7)'), cell('Note block: pitch (right-clicks to tune)')]
  ];
  return { name: 'Blocks needed', rows, columnWidths: [30, 40] };
}

export function columnName(index: number): string {
  let n = index + 1;
  let name = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

export function isDarkFill(hex: string): boolean {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

/** Style table: 0 = plain, then one entry per unique (fill, bold) pair. */
function createStyles() {
  const keys: string[] = [];
  const specs: { fill?: string; bold: boolean }[] = [];
  return {
    indexFor(c: SheetCell): number {
      if (!c.fill && !c.bold) return 0;
      const key = `${c.fill ?? ''}|${c.bold ? 1 : 0}`;
      let i = keys.indexOf(key);
      if (i === -1) {
        keys.push(key);
        specs.push({ fill: c.fill, bold: !!c.bold });
        i = keys.length - 1;
      }
      return i + 1;
    },
    toXml(): string {
      const fillList = [...new Set(specs.map((s) => s.fill).filter((f): f is string => !!f))];
      const fills =
        '<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
        fillList
          .map((f) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${f}"/><bgColor indexed="64"/></patternFill></fill>`)
          .join('');
      const fonts = [
        '<font><sz val="11"/><name val="Calibri"/></font>',
        '<font><b/><sz val="11"/><name val="Calibri"/></font>',
        '<font><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>',
        '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
      ].join('');
      const xfs = [
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
        ...specs.map((s) => {
          const fillId = s.fill ? fillList.indexOf(s.fill) + 2 : 0;
          const light = s.fill && isDarkFill(s.fill);
          const fontId = (light ? 2 : 0) + (s.bold ? 1 : 0);
          return `<xf numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>`;
        })
      ].join('');
      return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        `<fonts count="4">${fonts}</fonts>` +
        `<fills count="${2 + fillList.length}">${fills}</fills>` +
        '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
        '<border><left style="thin"><color rgb="FF999999"/></left><right style="thin"><color rgb="FF999999"/></right>' +
        '<top style="thin"><color rgb="FF999999"/></top><bottom style="thin"><color rgb="FF999999"/></bottom><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        `<cellXfs count="${1 + specs.length}">${xfs}</cellXfs>` +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
        '</styleSheet>'
      );
    }
  };
}

function sheetXml(sheet: SheetData, styleFor: (c: SheetCell) => number): string {
  const widths = sheet.columnWidths ?? [];
  const maxCols = sheet.rows.reduce((m, r) => Math.max(m, r.length), 0);
  const cols = Array.from({ length: maxCols }, (_, i) => {
    const w = widths[i] ?? 7;
    return `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`;
  }).join('');

  const body = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((c, i) => {
          if (!c) return '';
          const ref = `${columnName(i)}${r + 1}`;
          const s = styleFor(c);
          const style = s ? ` s="${s}"` : '';
          return typeof c.text === 'number'
            ? `<c r="${ref}"${style}><v>${c.text}</v></c>`
            : `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(c.text)}</t></is></c>`;
        })
        .join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');

  const view = sheet.frozen
    ? '<sheetViews><sheetView workbookViewId="0"><pane xSplit="3" ySplit="1" topLeftCell="D2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>'
    : '';
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `${view}<cols>${cols}</cols><sheetData>${body}</sheetData></worksheet>`
  );
}

/** Builds a styled .xlsx file (no external spreadsheet library needed). */
export async function buildSchematicWorkbook(grid: TickGrid): Promise<Blob> {
  const schematic = buildSchematicSheet(grid);
  const width = schematic.rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (width > MAX_EXCEL_COLUMNS) {
    throw new Error(
      `The schematic is ${width} blocks long, which is more than Excel's limit of ${MAX_EXCEL_COLUMNS} columns.`
    );
  }

  const sheets = [schematic, buildBlocksSheet(grid)];
  const styles = createStyles();
  const sheetXmls = sheets.map((s) => sheetXml(s, (c) => styles.indexFor(c)));

  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets
        .map(
          (_, i) =>
            `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
        )
        .join('') +
      '</Types>'
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>'
  );
  zip.file(
    'xl/workbook.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<sheets>${sheets.map((s, i) => `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>` +
      '</workbook>'
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
        )
        .join('') +
      `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      '</Relationships>'
  );
  sheetXmls.forEach((xml, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, xml));
  // Styles are only complete once every sheet has been rendered.
  zip.file('xl/styles.xml', styles.toXml());

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
