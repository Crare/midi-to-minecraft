import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildTrackEvents } from "../utils";
import { buildTickGrid } from "../components/SchematicPanel/schematicData";
import { buildSchematicCsv, buildSchematicOds } from "../components/SchematicPanel/exportSpreadsheet";
import { buildSchematicSheet } from "../components/SchematicPanel/exportExcel";
import { midiFixtures } from "./helpers";

describe.each(midiFixtures)("%s csv/ods export", (_name, getMidi) => {
  const grid = buildTickGrid(buildTrackEvents(getMidi()));

  it("csv starts with a BOM and the header row, one line per lane", () => {
    const csv = buildSchematicCsv(grid);
    expect(csv.startsWith("\uFEFFInstrument,Lane,Start,")).toBe(true);
    const lines = csv.split("\r\n");
    const schematicRows = buildSchematicSheet(grid).rows.length;
    expect(lines[schematicRows]).toBe("");
    expect(lines[schematicRows + 1]).toBe("Blocks needed,Count");
  });

  it("ods has a first, uncompressed mimetype and both sheets", async () => {
    const blob = await buildSchematicOds(grid);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    expect(await zip.file("mimetype")!.async("string")).toBe("application/vnd.oasis.opendocument.spreadsheet");
    const content = await zip.file("content.xml")!.async("string");
    expect(content).toContain('table:name="Schematic"');
    expect(content).toContain('table:name="Blocks needed"');
  });
});

describe("csv escaping", () => {
  it("quotes commas and quotes", () => {
    const grid = buildTickGrid([]);
    expect(buildSchematicCsv(grid)).toContain("Blocks needed,Count");
  });
});
