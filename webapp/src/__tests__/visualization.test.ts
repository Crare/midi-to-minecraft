import { describe, expect, it } from "vitest";
import { buildTrackEvents } from "../utils";
import {
  buildVisualizationTracks,
  findFirstNoteIndexAtOrAfter,
  formatInstrumentName,
  getMaxTrackTick,
} from "../components/VisualizationPanel/visualizationData";
import {
  computeLaneLayout,
  getMinecraftTuningInfo,
  getNoteTooltipLines,
  hitTest,
  LANE_GAP,
  LANE_PAD,
  NOTE_STACK_STEP,
  TIMELINE_ORIGIN,
  tickToX,
} from "../components/VisualizationPanel/canvasRenderer";
import { midiFixtures } from "./helpers";

describe.each(midiFixtures)("%s visualization data", (_name, getMidi) => {
  const trackEvents = buildTrackEvents(getMidi());

  it.each(["instrument", "track"])("tracks grouped by %s", (mode) => {
    expect(buildVisualizationTracks(trackEvents, mode)).toMatchSnapshot();
  });

  it("max tick equals the last note's tick", () => {
    const tracks = buildVisualizationTracks(trackEvents);
    const last = Math.max(...tracks.map((t) => t.notes.at(-1)!.startTick));
    expect(getMaxTrackTick(tracks)).toBe(last);
  });
});

describe("visualization helpers", () => {
  it("formats instrument names", () => {
    expect(formatInstrumentName("iron_xylophone")).toBe("Iron Xylophone");
    expect(formatInstrumentName("harp")).toBe("Harp");
  });

  it("finds the first note at or after a tick", () => {
    const notes = [{ startTick: 0 }, { startTick: 5 }, { startTick: 9 }];
    expect(findFirstNoteIndexAtOrAfter(notes, 0)).toBe(0);
    expect(findFirstNoteIndexAtOrAfter(notes, 1)).toBe(1);
    expect(findFirstNoteIndexAtOrAfter(notes, 9)).toBe(2);
    expect(findFirstNoteIndexAtOrAfter(notes, 10)).toBe(3);
  });

  it("computes tuning info and tooltip lines", () => {
    expect(getMinecraftTuningInfo(0).playsoundPitch).toBeCloseTo(0.5);
    expect(getMinecraftTuningInfo(12).playsoundPitch).toBeCloseTo(1);
    expect(getMinecraftTuningInfo(24).useCount).toBe(0);
    const lines = getNoteTooltipLines({ instrument: "harp", pitch: "C", note: 6, block: "minecraft:dirt" });
    expect(lines[0]).toBe("Instrument: harp");
    expect(lines).toContain("Block: minecraft:dirt");
    expect(getNoteTooltipLines({ instrument: "snare", pitch: undefined, note: 0, block: "minecraft:sand" })).toContain("Pitch: drum");
  });
});

describe("lane layout", () => {
  it("fits lanes into the available height", () => {
    expect(computeLaneLayout({ laneCount: 5, availableHeight: 400 })).toMatchSnapshot();
    expect(computeLaneLayout({ laneCount: 1, availableHeight: 1000 })).toMatchSnapshot();
    expect(computeLaneLayout({ laneCount: 30, availableHeight: 200 })).toMatchSnapshot();
  });

  it("converts ticks to x using the pitch", () => {
    expect(tickToX(0, 36)).toBe(TIMELINE_ORIGIN);
    expect(tickToX(3, 36)).toBe(TIMELINE_ORIGIN + 108);
  });
});

describe("hit testing stacked notes", () => {
  it("stacks notes 10px apart", () => {
    expect(NOTE_STACK_STEP).toBe(10);
  });

  const mk = (n: number) => ({ block: "minecraft:dirt", pitch: "C", note: n, instrument: "harp" });
  const lanes = [
    { notes: [{ startTick: 2, redstoneTickDelay: 2, placements: [mk(1), mk(2), mk(3)] }] },
    { notes: [{ startTick: 0, redstoneTickDelay: 0, placements: [mk(9)] }] },
  ];
  const view = { ...computeLaneLayout({ laneCount: 2, availableHeight: 200 }), scrollLeft: 0, width: 800, height: 200 };
  const opts = { showSupport: true };
  const noteX = tickToX(2, view.pitch) + 2;

  it("returns each stacked placement at its 10px offset", () => {
    [0, 1, 2].forEach((i) => {
      const hit = hitTest({ lanes, view, opts, x: noteX, y: LANE_PAD + i * NOTE_STACK_STEP + 1 });
      expect(hit!.placement.note).toBe(i + 1);
      expect(hit!.key).toBe(`0:0:${i}`);
    });
  });

  it("prefers the topmost drawn note where they overlap", () => {
    const hit = hitTest({ lanes, view, opts, x: noteX, y: LANE_PAD + NOTE_STACK_STEP + 2 });
    expect(hit!.placement.note).toBe(2);
  });

  it("hits notes in the second lane", () => {
    const y = view.laneHeight + LANE_GAP + LANE_PAD + 1;
    expect(hitTest({ lanes, view, opts, x: tickToX(0, view.pitch) + 2, y })!.placement.note).toBe(9);
  });

  it("returns null on empty space and respects horizontal scroll", () => {
    expect(hitTest({ lanes, view, opts, x: 0, y: 10 })).toBeNull();
    expect(hitTest({ lanes, view, opts, x: noteX, y: view.laneHeight + 1 })).toBeNull();
    const scrolled = { ...view, scrollLeft: 100 };
    expect(hitTest({ lanes, view: scrolled, opts, x: noteX - 100, y: LANE_PAD + 1 })!.key).toBe("0:0:0");
  });
});
