import { describe, expect, it } from "vitest";
import { midiFixtures as fixtures, TICK_S } from "./helpers";
import { buildNoteList, buildTrackEvents } from "../utils.jsx";
import { buildVisualizationTracks } from "../components/VisualizationPanel/visualizationData";
import { buildTickGrid } from "../components/SchematicPanel/schematicData";

// Expected notes straight from the MIDI, independent of the app's conversion.
function expectedNotes(midi) {
  const all = [];
  midi.tracks.forEach((track) =>
    track.notes.forEach((n) => all.push({ time: n.time, midi: n.midi }))
  );
  return all;
}

const key = (tick, note) => `${tick}:${note}`;
const sortedKeys = (arr) => [...arr].sort();

describe.each(fixtures)("%s", (_name, getMidi) => {
  const midi = getMidi();
  const trackEvents = buildTrackEvents(midi);
  const noteList = buildNoteList(midi);
  const expected = expectedNotes(midi);

  it("keeps every MIDI note in the conversion", () => {
    expect(noteList.length).toBe(expected.length);
    const fromEvents = trackEvents.reduce((s, t) => s + t.events.length, 0);
    expect(fromEvents).toBe(expected.length);
  });

  it("keeps note start times and pitches", () => {
    const want = sortedKeys(
      expected.map((n) => n.time.toFixed(6))
    );
    const got = sortedKeys(noteList.map((n) => n.time.toFixed(6)));
    expect(got).toEqual(want);
  });

  it("playback ticks land within half a tick of the MIDI time", () => {
    const tracks = buildVisualizationTracks(trackEvents, "instrument");
    const played = [];
    tracks.forEach((t) =>
      t.notes.forEach((n) =>
        n.placements.forEach(() => played.push(n.startTick * TICK_S))
      )
    );
    expect(played.length).toBe(expected.length);
    const sortedPlayed = [...played].sort((a, b) => a - b);
    const sortedMidi = expected.map((n) => n.time).sort((a, b) => a - b);
    sortedMidi.forEach((t, i) => {
      expect(Math.abs(sortedPlayed[i] - t)).toBeLessThanOrEqual(TICK_S / 2 + 1e-9);
    });
  });

  it("visualization notes are in strictly increasing tick order", () => {
    buildVisualizationTracks(trackEvents, "instrument").forEach((t) => {
      for (let i = 1; i < t.notes.length; i++) {
        expect(t.notes[i].startTick).toBeGreaterThan(t.notes[i - 1].startTick);
        expect(t.notes[i].redstoneTickDelay).toBe(
          t.notes[i].startTick - t.notes[i - 1].startTick
        );
      }
    });
  });

  describe("schematic", () => {
    const grid = buildTickGrid(trackEvents);

    it("contains exactly the MIDI notes (tick, note, instrument)", () => {
      const want = [];
      noteList.forEach((n) =>
        want.push(`${n.instrument}@${key(Math.round(n.time * 10), n.note)}`)
      );
      const got = [];
      grid.instruments.forEach((inst) =>
        inst.rows.forEach((row) =>
          row.anchorCells.forEach((c) => {
            if (c.kind === "note" && c.note)
              got.push(`${inst.label}@${key(c.tick, c.note.note)}`);
          })
        )
      );
      expect(sortedKeys(got)).toEqual(sortedKeys(want));
    });

    it("main-row repeater delays add up to the tick gaps between notes", () => {
      grid.instruments.forEach((inst) => {
        const main = inst.rows[0];
        let acc = 0;
        let lastTick = 0;
        main.anchorCells.forEach((cell, i) => {
          main.segments[i].forEach((s) => {
            if (s.kind === "repeater") acc += s.ticks;
          });
          if (cell.kind === "note" && cell.note) {
            expect(acc, `${inst.label} tick ${cell.tick}`).toBe(
              cell.tick - lastTick
            );
            acc = 0;
            lastTick = cell.tick;
          }
        });
      });
    });

    it("every row has the same number of anchors and segments", () => {
      grid.instruments.forEach((inst) =>
        inst.rows.forEach((row) => {
          expect(row.anchorCells.length).toBe(grid.anchors.length);
          expect(row.segments.length).toBe(grid.anchors.length + 1);
        })
      );
    });
  });
});
