import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildTrackEvents } from "../utils";
import { buildTickGrid, computeTickGridBlockCounts } from "../components/SchematicPanel/schematicData";
import {
  buildBlocksSheet,
  buildSchematicSheet,
  buildSchematicWorkbook,
  columnName,
} from "../components/SchematicPanel/exportExcel";
import { midiFixtures } from "./helpers";

describe("columnName", () => {
  it("converts indexes to spreadsheet letters", () => {
    expect([0, 25, 26, 27, 701, 702].map(columnName)).toEqual(["A", "Z", "AA", "AB", "ZZ", "AAA"]);
  });
});

describe.each(midiFixtures)("%s excel export", (_name, getMidi) => {
  const grid = buildTickGrid(buildTrackEvents(getMidi()));

  it("has one row per lane plus a header, with every note block", () => {
    const sheet = buildSchematicSheet(grid);
    const lanes = grid.instruments.reduce((s, i) => s + i.rows.length, 0);
    expect(sheet.rows).toHaveLength(lanes + 1);

    const noteCells = sheet.rows
      .slice(1)
      .flat()
      .filter((c) => c && /^(\w#?|perc) \(\d+\)$/.test(String(c.text)));
    expect(noteCells).toHaveLength(computeTickGridBlockCounts(grid).noteblocks);
  });

  it("lists block totals", () => {
    const counts = computeTickGridBlockCounts(grid);
    const rows = buildBlocksSheet(grid).rows;
    expect(rows[1]?.[1]?.text).toBe(counts.noteblocks);
    expect(rows[2]?.[1]?.text).toBe(counts.repeaters);
  });

  it("writes a valid xlsx package", async () => {
    const blob = await buildSchematicWorkbook(grid);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual([
      "[Content_Types].xml",
      "_rels/",
      "_rels/.rels",
      "xl/",
      "xl/_rels/",
      "xl/_rels/workbook.xml.rels",
      "xl/styles.xml",
      "xl/workbook.xml",
      "xl/worksheets/",
      "xl/worksheets/sheet1.xml",
      "xl/worksheets/sheet2.xml",
    ]);
    const sheet1 = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(sheet1).toContain('<row r="1">');
    expect(sheet1).toContain("<pane ");
  });
});
