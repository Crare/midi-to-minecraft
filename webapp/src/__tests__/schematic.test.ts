import { describe, expect, it } from "vitest";
import { buildTrackEvents } from "../utils";
import {
  buildCells,
  buildLaneGroups,
  buildTickGrid,
  computeRawResources,
  computeSchematicDimensions,
  computeTickGridBlockCounts,
  decomposeDelay,
  detectBranches,
  getUseCount,
  splitIntoSubLanes,
  toMinecraftBuildGrid,
} from "../components/SchematicPanel/schematicData";
import { computeLayout, hitTest, HEADER_H } from "../components/SchematicPanel/canvasSchematic";
import type { NoteEvent } from "../types";
import type { LanePlacement, SubLane } from "../components/SchematicPanel/schematicData";
import { midiFixtures } from "./helpers";

const countMap = (c: ReturnType<typeof computeTickGridBlockCounts>) => ({ ...c, supportMap: c.supportMap && Object.fromEntries(c.supportMap) });

describe.each(midiFixtures)("%s schematic", (_name, getMidi) => {
  const trackEvents = buildTrackEvents(getMidi());
  const grid = buildTickGrid(trackEvents);

  it("tick grid", () => {
    expect(grid).toMatchSnapshot();
  });

  it("dimensions and block counts", () => {
    expect(computeSchematicDimensions(grid)).toMatchSnapshot();
    expect(countMap(computeTickGridBlockCounts(grid))).toMatchSnapshot();
  });

  it("lane groups", () => {
    expect(buildLaneGroups(trackEvents)).toMatchSnapshot();
  });

  it("canvas layout", () => {
    const layout = computeLayout(grid, 28);
    expect(layout).toMatchSnapshot();
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.rowStarts.length).toBe(layout.rows.length);
  });

  it("sub-rows only carry segments that are empty", () => {
    grid.instruments.forEach((inst) =>
      inst.rows.filter((r) => r.isSub).forEach((r) => r.segments.forEach((s) => expect(s).toEqual([])))
    );
  });

  it("canvas hit testing finds every note block at its drawn position", () => {
    const cs = 28;
    const layout = computeLayout(grid, cs);
    let found = 0;
    layout.rows.forEach((r) => {
      if (r.type !== "row") return;
      r.row.anchorCells.forEach((cell, ai) => {
        if (cell.kind !== "note" || !cell.note) return;
        const hit = hitTest({
          grid, layout, scrollX: 0, scrollY: 0,
          x: layout.anchorX[ai] + cs / 2,
          y: HEADER_H + r.y + cs / 2,
        });
        expect(hit?.type).toBe("note");
        expect(hit && "note" in hit && hit.note).toBe(cell.note);
        found++;
      });
    });
    expect(found).toBeGreaterThan(0);
  });
});

describe("schematic helpers", () => {
  it("decomposes delays into repeaters of at most 4 ticks", () => {
    expect(decomposeDelay(0)).toEqual([]);
    expect(decomposeDelay(3)).toEqual([3]);
    expect(decomposeDelay(10)).toEqual([4, 4, 2]);
    expect(decomposeDelay(8)).toEqual([4, 4]);
  });

  it("normalizes use counts", () => {
    expect(getUseCount(25)).toBe(1);
    expect(getUseCount(-1)).toBe(23);
  });

  it("splits overlapping events into sub-lanes", () => {
    const ev = (time: number, endTime: number): NoteEvent => ({
      time, endTime, note: 0, block: "minecraft:dirt", pitch: "C", instrument: "harp", trackIndex: 0, trackName: "t",
    });
    const lanes = splitIntoSubLanes([ev(0, 1), ev(0, 1), ev(1, 2), ev(0.5, 0.6)]);
    expect(lanes.length).toBe(3);
    lanes.forEach((l) => {
      for (let i = 1; i < l.length; i++) expect(l[i].time).toBeGreaterThanOrEqual(l[i - 1].endTime - 1e-6);
    });
  });

  it("detects branches only for later lanes", () => {
    const lane = (ticks: number[]) =>
      ({ notes: ticks.map((t) => ({ startTick: t })) }) as SubLane;
    const res = detectBranches([lane([0, 4, 8]), lane([6, 10])]);
    expect(res[0]).toBeNull();
    expect(res[1]).toEqual({ sourceIndex: 0, savedTicks: 6 });
  });

  it("builds cells with repeaters and dust", () => {
    const n = (startTick: number, delay: number): LanePlacement => ({
      startTick, delay, block: "minecraft:dirt", instrument: "harp", note: 0, pitch: "C",
    });
    expect(buildCells([n(5, 5), n(5, 0)]).map((c) => c.type)).toMatchSnapshot();
  });

  it("computes raw resources", () => {
    expect(computeRawResources({ noteblocks: 10, repeaters: 4, dust: 20 })).toEqual({
      planks: 44, logs: 11, redstoneDust: 42, redstoneBlocks: 4, redstoneRemainder: 6, stone: 12,
    });
  });

  it("returns an empty grid for no events", () => {
    expect(buildTickGrid([])).toEqual({ instruments: [], anchors: [] });
    expect(computeSchematicDimensions({ instruments: [], anchors: [] })).toEqual({ x: 0, z: 0, y: 3 });
  });

  it("builds a Minecraft-accurate grid with gap rows and extra dust", () => {
    const ev = (instrument: string, note: number): NoteEvent => ({
      time: 0.5, endTime: 1, block: "minecraft:dirt", pitch: "C", note, instrument, trackIndex: 0, trackName: instrument,
    });
    const base = buildTickGrid([
      { title: "harp", events: [ev("harp", 1), ev("harp", 3)] },
      { title: "bass", events: [ev("bass", 2)] },
    ] as never);
    const built = toMinecraftBuildGrid(base);
    expect(built.buildMode).toBe(true);
    expect(built.instruments[0].rows.map((r) => !!r.isGap)).toEqual([false, true, false, true]);
    expect(built.instruments[1].rows).toHaveLength(1);
    const gap = built.instruments[0].rows[1];
    const splitIdx = base.anchors.findIndex((a) => a.kind === "split");
    expect(gap.anchorCells[splitIdx]).toMatchObject({ kind: "split-pass", connects: { up: true, down: true } });
    built.instruments.flatMap((i) => i.rows).filter((r) => !r.isGap && (!r.isSub || r.anchorCells[splitIdx].kind === "split-branch")).forEach((r) => {
      expect(r.segments[splitIdx + 1][0]).toEqual({ kind: "dust" });
    });
    expect(computeSchematicDimensions(built).z).toBe(5);
  });
});
