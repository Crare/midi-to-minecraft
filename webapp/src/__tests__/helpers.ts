import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Midi } from "@tonejs/midi";

export const TICK_S = 0.1;

export function loadFixture(name: string) {
  return new Midi(
    readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)))
  );
}

// Synthetic song with chords, drums and gaps so no third-party MIDI is needed.
export function buildSyntheticMidi() {
  const midi = new Midi();
  const lead = midi.addTrack();
  [0, 0.25, 0.5, 1.0, 1.05, 3.7].forEach((time, i) => {
    [60, 64, 67, 71, 74, 79].slice(0, (i % 6) + 1).forEach((m) =>
      lead.addNote({ midi: m, time, duration: 0.2 })
    );
  });
  const bass = midi.addTrack();
  bass.instrument.number = 32;
  [0, 0.5, 1, 2.3].forEach((time) =>
    bass.addNote({ midi: 40, time, duration: 0.4 })
  );
  const drums = midi.addTrack();
  drums.channel = 9;
  [0, 0.5, 1, 1.5].forEach((time, i) =>
    drums.addNote({ midi: i % 2 ? 38 : 36, time, duration: 0.1 })
  );
  return new Midi(midi.toArray());
}

// Named MIDI inputs shared by all characterization tests.
export const midiFixtures: [string, () => Midi][] = [
  ["example.mid", () => loadFixture("example.mid")],
  ["synthetic chords", buildSyntheticMidi],
];
