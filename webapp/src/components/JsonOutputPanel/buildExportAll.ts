import JSZip from 'jszip';
import type { DownloadFile, TickGrid } from '../../types';
import { buildMinecraftFunction, type MinecraftEdition } from '../SchematicPanel/exportMinecraft';
import { buildBedrockMcpack } from '../SchematicPanel/exportMcpack';
import { buildSchematicWorkbook } from '../SchematicPanel/exportExcel';
import { buildSchematicCsv, buildSchematicOds } from '../SchematicPanel/exportSpreadsheet';

interface BuildExportAllOptions {
  outputPrefix: string;
  jsonFiles: DownloadFile[];
  spreadsheetGrid: TickGrid;
  fullGrid: TickGrid;
  compactGrid: TickGrid;
}

const editions: MinecraftEdition[] = ['java', 'bedrock'];

/** Build one archive containing every JSON, spreadsheet, function, and Bedrock pack export. */
export async function buildExportAllArchive({
  outputPrefix,
  jsonFiles,
  spreadsheetGrid,
  fullGrid,
  compactGrid
}: BuildExportAllOptions): Promise<Blob> {
  const zip = new JSZip();

  jsonFiles.forEach((file) => {
    zip.file(file.name.replace(/^.*\//, ''), JSON.stringify(file.data, null, 2));
  });

  const [workbook, openDocument] = await Promise.all([
    buildSchematicWorkbook(spreadsheetGrid),
    buildSchematicOds(spreadsheetGrid)
  ]);
  zip.file(`${outputPrefix}-schematic.xlsx`, workbook);
  zip.file(`${outputPrefix}-schematic.ods`, openDocument);
  zip.file(
    `${outputPrefix}-schematic.csv`,
    buildSchematicCsv(spreadsheetGrid)
  );

  const buildViews = [
    { name: 'full', grid: fullGrid },
    { name: 'compact', grid: compactGrid }
  ] as const;
  for (const view of buildViews) {
    for (const edition of editions) {
      zip.file(
        `${outputPrefix}-function-${edition}-${view.name}.mcfunction`,
        buildMinecraftFunction(view.grid, edition)
      );
    }
    zip.file(
      `${outputPrefix}-schematic-bedrock-${view.name}.mcpack`,
      await buildBedrockMcpack(view.grid)
    );
  }

  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}
