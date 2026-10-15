import { describe, expect, it } from "vitest";
import { buildNoteList, buildTrackEvents, eventsToPlacements } from "../utils";
import { midiFixtures } from "./helpers";

// Golden output: the JSON the user downloads. Any refactor must keep it byte-identical.
describe.each(midiFixtures)("%s conversion output", (_name, getMidi) => {
  const midi = getMidi();

  it.each([false, true])("note list (trimLeadingSilence=%s)", (trim) => {
    expect(buildNoteList(midi, { trimLeadingSilence: trim })).toMatchSnapshot();
  });

  it.each([false, true])("track placements JSON (trimLeadingSilence=%s)", (trim) => {
    const tracks = buildTrackEvents(midi, { trimLeadingSilence: trim });
    expect(
      tracks.map((t) => ({ id: t.id, title: t.title, placements: eventsToPlacements(t.events) }))
    ).toMatchSnapshot();
  });

  it("lanes never contain overlapping notes", () => {
    buildTrackEvents(midi).forEach((track) => {
      for (let i = 1; i < track.events.length; i++) {
        expect(track.events[i].time).toBeGreaterThanOrEqual(track.events[i - 1].endTime - 1e-6);
      }
    });
  });
});

describe("trimLeadingSilence", () => {
  it("shifts the first note to time 0", () => {
    const midi = midiFixtures[0][1]();
    const trimmed = buildNoteList(midi, { trimLeadingSilence: true });
    expect(trimmed[0].time).toBe(0);
  });
});

describe("drums", () => {
  it("map channel 9 notes to percussion instruments with note 0", () => {
    const midi = midiFixtures[1][1]();
    const drums = buildNoteList(midi).filter((n) => n.trackIndex === 2);
    expect(drums.length).toBe(4);
    drums.forEach((d) => {
      expect(d.note).toBe(0);
      expect(d.pitch).toBeUndefined();
    });
    expect(new Set(drums.map((d) => d.instrument))).toEqual(new Set(["basedrum", "snare"]));
  });
});

describe("eventsToPlacements", () => {
  it("accumulates delays into absolute ticks", () => {
    const events = [0, 0.3, 0.3, 1.0].map((time) => ({
      time, block: "minecraft:dirt", pitch: "C", note: 1, instrument: "harp", trackIndex: 0, trackName: "t",
    }));
    const p = eventsToPlacements(events);
    expect(p.map((x) => x.redstoneTickDelay)).toEqual([0, 3, 0, 7]);
    expect(p.map((x) => x.startTick)).toEqual([0, 3, 3, 10]);
  });
});
