import { describe, expect, it } from "vitest";
import { buildTrackEvents } from "../utils";
import {
  anchorsOf,
  buildCompactGrid,
  buildTickGrid,
  computeSchematicDimensions,
  computeTickGridBlockCounts,
} from "../components/SchematicPanel/schematicData";
import { computeLayout, headerHeight, hitTest, HEADER_H } from "../components/SchematicPanel/canvasSchematic";
import { buildSchematicSheet } from "../components/SchematicPanel/exportExcel";
import { midiFixtures } from "./helpers";

describe.each(midiFixtures)("%s compact schematic", (_name, getMidi) => {
  const trackEvents = buildTrackEvents(getMidi());
  const full = buildTickGrid(trackEvents);
  const compact = buildCompactGrid(trackEvents);

  it("keeps every note block and repeater, but not more dust", () => {
    const a = computeTickGridBlockCounts(full);
    const b = computeTickGridBlockCounts(compact);
    expect(b.noteblocks).toBe(a.noteblocks);
    expect(b.repeaters).toBe(a.repeaters);
    expect(b.dust).toBeLessThanOrEqual(a.dust);
    expect(b.supportMap).toEqual(a.supportMap);
  });

  it("has no padding dust: segments hold repeaters only", () => {
    compact.instruments.forEach((inst) =>
      inst.rows.forEach((row) =>
        row.segments.flat().forEach((cell) => expect(cell.kind).toBe("repeater"))
      )
    );
  });

  it("has no pass-through dust; extra dust only at split columns", () => {
    compact.instruments.forEach((inst) => {
      const anchors = anchorsOf(compact, inst);
      inst.rows.forEach((row) =>
        row.anchorCells.forEach((cell, ai) => {
          if (cell.kind === "note") expect(cell.note).not.toBeNull();
          if (cell.kind === "split-branch" || cell.kind === "split-pass") {
            expect(anchors[ai].kind).toBe("split");
          }
        })
      );
    });
  });

  it("is no longer than the aligned schematic", () => {
    expect(computeSchematicDimensions(compact).x).toBeLessThanOrEqual(computeSchematicDimensions(full).x);
    expect(computeSchematicDimensions(compact).z).toBe(computeSchematicDimensions(full).z);
  });

  it("hides the tick header and still hits every note block", () => {
    expect(headerHeight(compact)).toBe(0);
    expect(headerHeight(full)).toBe(HEADER_H);
    const cs = 28;
    const layout = computeLayout(compact, cs);
    let found = 0;
    layout.rows.forEach((r) => {
      if (r.type !== "row" || !r.cols) return;
      r.row.anchorCells.forEach((cell, ai) => {
        if (cell.kind !== "note" || !cell.note) return;
        const hit = hitTest({
          grid: compact, layout, scrollX: 0, scrollY: 0,
          x: r.cols!.anchorX[ai] + cs / 2,
          y: r.y + cs / 2,
        });
        expect(hit?.type).toBe("note");
        found++;
      });
    });
    expect(found).toBe(computeTickGridBlockCounts(compact).noteblocks);
  });

  it("exports without a tick header", () => {
    const header = buildSchematicSheet(compact).rows[0];
    expect(header.filter((c) => c && /^t\d+$|^split/.test(String(c.text)))).toHaveLength(0);
  });
});
