import {
  blockByPatchId,
  blockByPercussiveNote,
  defaultInstrumentBlock,
  defaultPercussiveBlock,
  instrumentByBlock,
} from '@constants';
import { Midi } from '@tonejs/midi';
import type { Note } from '@tonejs/midi/dist/Note';
import type { Track } from '@tonejs/midi/dist/Track';
import { NoteEvent } from './types';

export function midiToPitchClass(noteNumber: number): string {
  const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return scale[noteNumber % 12];
}

export function midiToMinecraftNote(noteNumber: number): number {
  return (((noteNumber - 6) % 24) + 24) % 24;
}

export function getSongStartTime(midi: Midi): number {
  let earliestTime = Infinity;
  midi.tracks.forEach((track: Track) => {
    track.notes.forEach((note: Note) => {
      if (note.time < earliestTime) earliestTime = note.time;
    });
  });
  return Number.isFinite(earliestTime) ? earliestTime : 0;
}

export function buildNoteList(
  midi: Midi,
  { trimLeadingSilence = false }: { trimLeadingSilence?: boolean } = {},
): NoteEvent[] {
  const songStartTime = trimLeadingSilence ? getSongStartTime(midi) : 0;
  // Find the earliest tick if trimming leading silence
  let songStartTick = 0;
  if (trimLeadingSilence) {
    let minTick = Infinity;
    midi.tracks.forEach((track: Track) => {
      track.notes.forEach((note: Note) => {
        if (typeof note.ticks === 'number' && note.ticks < minTick) minTick = note.ticks;
      });
    });
    songStartTick = Number.isFinite(minTick) ? minTick : 0;
  }
  const notes: NoteEvent[] = [];
  midi.tracks.forEach((track: Track, trackIndex: number) => {
    const channel = typeof track.channel === 'number' ? track.channel : 0;
    const patch = track.instrument?.number ?? 0;
    const defaultTrackBlock = blockByPatchId[patch] || defaultInstrumentBlock;
    const trackName = track.name || `Track ${trackIndex + 1}`;
    track.notes.forEach((note: Note) => {
      const startTime = Math.max(0, note.time - songStartTime);
      const duration = Math.max(note.duration ?? 0.05, 0.05);
      const endTime = startTime + duration;
      const isDrum = channel === 9;
      const block = isDrum
        ? blockByPercussiveNote[note.midi] || defaultPercussiveBlock
        : defaultTrackBlock;
      const pitch = isDrum ? undefined : midiToPitchClass(note.midi);
      const mcNote = isDrum ? 0 : midiToMinecraftNote(note.midi);
      // Store tick, adjusted for trimLeadingSilence
      const tick = Math.max(
        0,
        (typeof note.ticks === 'number' ? note.ticks : 0) -
          (trimLeadingSilence ? songStartTick : 0),
      );
      notes.push({
        time: startTime,
        endTime,
        block,
        pitch,
        note: mcNote,
        instrument: instrumentByBlock[block] || 'harp',
        trackIndex,
        trackName,
        tick,
      });
    });
  });
  return notes.sort((a, b) => a.time - b.time);
}

export type TrackEvent = {
  id: string;
  title: string;
  events: NoteEvent[];
  notes?: NoteEvent[];
  cells?: any[];
};

// Helper to flatten each instrument's schematic events into a cell array for canvas rendering
function buildInstrumentCells(events: any[]): any[] {
  const cells: any[] = [];
  events.forEach((event: any, idx: number) => {
    // Add repeaters for delay before this note
    for (let i = 0; i < Math.floor(event.repeaterTicks / 4); ++i) {
      cells.push({ type: 'repeater', ticks: 4, key: `rep4-${idx}-${i}` });
    }
    if (event.repeaterTicks % 4 > 0) {
      cells.push({ type: 'repeater', ticks: event.repeaterTicks % 4, key: `repX-${idx}` });
    }
    if (event.split) {
      cells.push({ type: 'split', key: `split-${idx}` });
    }
    cells.push({ type: 'note', event, key: `note-${idx}` });
  });
  return cells;
}

function midiToMinecraftSupportBlock(track: Track, note: Note): number {
  const isDrum = track.channel === 9;
  const mcNote = isDrum ? 0 : midiToMinecraftNote(note.midi);
  return mcNote;
}

interface NoteEvent2 {
  tick: number;
  note: number;
  pitch: string | undefined;
  instrument: string;
  track: number;
  // trackName: string;
  block: number;
}

interface InstrumentsLanes {
  instumentLanes: Map<string, NoteEvent2[]>;
}

/**
 * Produces a flat list of NoteEvent2 with tick, note, instrument, and track.
 */
function buildInstrumentLanes(midi: Midi, trimLeadingSilence?: boolean): InstrumentsLanes[] {
  var notes2: NoteEvent2[] = [];
  // Flatten all notes across all tracks into a single list with tick, note, instrument, and track info
  midi.tracks.forEach((track: Track, trackIndex: number) => {
    notes2.push(
      ...track.notes.map((note: Note) => ({
        tick: typeof note.ticks === 'number' ? note.ticks : 0,
        note: midiToMinecraftNote(note.midi),
        instrument: instrumentByBlock[midiToMinecraftSupportBlock(track, note)] || 'harp',
        pitch: midiToPitchClass(note.midi),
        track: trackIndex,
        // trackName: track.name || `Track ${trackIndex + 1}`,
        block: midiToMinecraftSupportBlock(track, note),
      })),
    );
  });
  // Sort by tick, then by note for determinism
  notes2.sort((a, b) => a.tick - b.tick || a.note - b.note);

  // If trimLeadingSilence, shift all ticks so the earliest note starts at tick 0
  if (trimLeadingSilence) {
    const firstTick = notes2.length > 0 ? notes2[0].tick : 0;
    notes2 = notes2.map((n) => ({ ...n, tick: Math.max(0, n.tick - firstTick) }));
  }
  console.log('notes2', notes2);

  /// Group notes by instrument for potential future use (e.g. separate lanes)
  const perInstrument: NoteEvent2[] = [];
  const instrumentMap = new Map<string, NoteEvent2[]>();
  notes2.forEach((note) => {
    if (!instrumentMap.has(note.instrument!)) instrumentMap.set(note.instrument!, []);
    instrumentMap.get(note.instrument!)!.push(note);
  });
  console.log('instrumentMap', instrumentMap);

  // For each instrument, we could further separate into lanes if multiple notes occur at the same tick
  const perInstrumentNoteLane: InstrumentsLanes[] = [];
  instrumentMap.forEach((events, instrument) => {
    const instrumentLanes = new Map<string, NoteEvent2[]>();

    instrumentLanes.set(`${instrument}-0`, []); // at least one lane per instrument

    events.forEach((note) => {
      // if instrumentLane contains note on same tick, push to next lane
      const laneKey = `${instrument}-${note.tick}`;
      if (!instrumentLanes.has(laneKey)) {
        instrumentLanes.set(laneKey, []);
      }
      instrumentLanes.get(laneKey)!.push(note);
    });

    // convert instrumentLanes to maps of instrument-index and notes for that lane.
    const instrumentLanes2 = new Map<string, NoteEvent2[]>();
    let laneIndex = 0;
    instrumentLanes.forEach((notes, key) => {
      instrumentLanes2.set(`${instrument}-${laneIndex}`, notes);
      laneIndex++;
    });

    perInstrumentNoteLane.push({ instumentLanes: instrumentLanes2 });
  });

  return perInstrumentNoteLane;
}

interface InstrumentLaneEvent {
  note?: NoteEvent2; // if its not note, then its a repeater or split event or redstone to fill the gap.
  repeaterTicks?: number; // ticks of repeaters to next note
  split?: boolean; // whether this event is a split point
  redstone?: boolean; // whether to place redstone before this event for timing
}

export interface TracksByInstrumentLane {
  instrument: string;
  lane: number;
  events: InstrumentLaneEvent[];
}

function buildTracks(
  instrumentsLanes: InstrumentsLanes[],
  lastTick: number,
): TracksByInstrumentLane[] {
  const tracks: TracksByInstrumentLane[] = [];
  // var gridPos = 0;
  // var tickPos = 0;

  // for(var i = 0; i < lastTick; i++) {

  //   // for each instrument lane, we check notes at this tick.
  //   instrumentsLanes.forEach(({ instumentLanes }) => {
  //     instumentLanes.forEach((events, laneKey) => {
  //       const [instrument, laneStr] = laneKey.split('-');
  //       const lane = parseInt(laneStr, 10);
  //       if(events.some(e => e.tick === tickPos)) {
  //         // if this lane has a note at this tick, we add it to the track with its instrument and lane info.
  //         tracks.push({ instrument, lane, events: [{ note: events.find(e => e.tick === i)! }] });
  //       }
  //     });

  //   tickPos = +1;
  // }

  instrumentsLanes.forEach(({ instumentLanes }) => {
    instumentLanes.forEach((events, laneKey) => {
      const [instrument, laneStr] = laneKey.split('-');
      const lane = parseInt(laneStr, 10);

      // add repeaters before the event, the amount after last note played
      const laneEvents: InstrumentLaneEvent[] = [];
      let laneLastTick = 0;
      let laneGridPos = 0;
      events.forEach((note) => {
        const gap = note.tick - laneLastTick;
        if (gap > 0) {
          // add repeater events to fill the gap, we can only add repeaters of 4 ticks,
          // so we add as many as needed and then a final one for the remainder if needed
          if (gap > 4) {
            const repeaterCount = Math.floor(gap / 4);
            for (let i = 0; i < repeaterCount; ++i) {
              laneEvents.push({ repeaterTicks: 4 });
              laneGridPos += 1;
            }
          }
          if (gap % 4 > 0) {
            laneEvents.push({ repeaterTicks: gap % 4 });
            laneGridPos += 1;
          }
        }

        // if any other lane has repeaters or splits, we need to add redstone before this note to sync timing,
        // as repeaters can cause desync if not placed before every note
        const hasOtherTimingEvents = Array.from(instumentLanes.values()).some(
          (otherLane) => otherLane !== events && otherLane.some((n) => n.tick === note.tick),
        );
        if (hasOtherTimingEvents) {
          laneEvents.push({ redstone: true });
          laneGridPos += 1;
        }

        // if another instrument's lanes contains a note at the same tick, mark this note as split
        const split = Array.from(instumentLanes.values()).some(
          (otherLane) =>
            // is not same lane and instrument
            otherLane !== events &&
            otherLane.some((n) => {
              // quick exit if tick is higher as the arrays are in sorted order
              if (n.tick > note.tick) return true;
              // if tick is the same, then its a split
              return n.tick === note.tick && n !== note;
            }),
        );
        laneEvents.push({ note, split });
        if (split) {
          laneGridPos += 1;
        }
        laneGridPos += 1;
        laneLastTick = note.tick;
      });

      tracks.push({ instrument, lane, events: laneEvents });
    });
  });

  return tracks;
}

function getLastTick(instrumentLanes: InstrumentsLanes[]): number {
  let lastTick = 0;
  instrumentLanes.forEach(({ instumentLanes }) => {
    instumentLanes.forEach((events) => {
      // get last index of events tick, as events are in sorted order.
      var lastIndex = events.length - 1;
      var tick = events[lastIndex].tick;
      if (tick > lastTick) {
        lastTick = tick;
      }
    });
  });
  return lastTick;
}

export function buildTrackEvents(
  midi: Midi,
  { trimLeadingSilence = false }: { trimLeadingSilence?: boolean } = {},
): TracksByInstrumentLane[] {
  console.log('midi', midi);
  const instrumentLanes = buildInstrumentLanes(midi, trimLeadingSilence);
  console.log('instrumentLanes', instrumentLanes);
  const lastTick = getLastTick(instrumentLanes);
  const tracks = buildTracks(instrumentLanes, lastTick);
  console.log('tracks', tracks);
  // TODO: make the code use the new tracks format.
  return tracks;
}

export function splitOutputTarget(inputName: string, outputName?: string) {
  const safeInput = sanitizeFilename(inputName.replace(/\.[^.]+$/, '') || 'song');
  const fallback = `${safeInput}.json`;
  const target = (outputName || fallback).trim() || fallback;

  const slash = Math.max(target.lastIndexOf('/'), target.lastIndexOf('\\'));
  const hasDir = slash !== -1;
  const dir = hasDir ? target.slice(0, slash) : 'output';
  const base = hasDir ? target.slice(slash + 1) : target;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '.json';
  return { dir, stem, ext };
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function getZipFilename(outputName: string | undefined, inputName: string): string {
  const target = splitOutputTarget(inputName, outputName);
  return `${target.stem}.zip`;
}
