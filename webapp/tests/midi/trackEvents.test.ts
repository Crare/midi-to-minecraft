import { Midi } from '@tonejs/midi';
import { describe, expect, it } from 'vitest';
import { buildTrackEvents } from '../../src/midi/trackEvents';

function makeSimpleMidi() {
  // Create a simple MIDI with two notes on two tracks at different ticks
  const midi = new Midi();
  const track1 = midi.addTrack();
  track1.addNote({ midi: 60, time: 0 }); // C4 at tick 0
  const track2 = midi.addTrack();
  track2.addNote({ midi: 64, time: 0.2 }); // E4 at tick 2
  return midi;
}

describe('buildTrackEvents', () => {
  it('produces tick-major, column-by-column schematic data', () => {
    const midi = makeSimpleMidi();
    const tracks = buildTrackEvents(midi);
    // There should be two lanes (one per track)
    expect(tracks.length).toBe(2);
    // Each lane should have a cell for each tick up to the last
    const maxLen = Math.max(...tracks.map((t) => t.events.length));
    tracks.forEach((t) => {
      expect(t.events.length).toBe(maxLen);
    });
    // The first lane should have a note at tick 0
    expect(tracks[0].events[0].type).toBe('note');
    // The second lane should have a note at tick 2
    expect(tracks[1].events[2].type).toBe('note');
    // All other cells should be repeaters or empty
    for (let i = 0; i < maxLen; ++i) {
      if (i !== 0) expect(tracks[0].events[i].type).not.toBe('note');
      if (i !== 2) expect(tracks[1].events[i].type).not.toBe('note');
    }
  });
});
