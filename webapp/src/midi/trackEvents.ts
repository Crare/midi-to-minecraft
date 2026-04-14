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

export type TrackEvent = {
  id: string;
  title: string;
  events: NoteEvent[];
  notes?: NoteEvent[];
  cells?: any[];
};

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
  block: string;
}

interface InstrumentsLanes {
  instumentLanes: Map<string, NoteEvent2[]>;
}

// Helper: Convert note.time (seconds) to Minecraft redstone ticks
function timeToRedstoneTick(time: number): number {
  // Find the tempo at this time (in microseconds per beat)
  // and the ticks per beat from the MIDI header
  // We'll use the same formula as in midi-convert: 1 redstone tick = 0.1s (2 game ticks, 50ms each)
  // time is in seconds
  // 1 redstone tick = 0.1s
  return Math.round(time / 0.1);
}

function getBlockForNote(track: Track, note: Note): string {
  const isDrum = track.channel === 9;
  let block: string;
  if (isDrum) {
    block = blockByPercussiveNote[note.midi] || defaultPercussiveBlock;
  } else {
    const patch = track.instrument?.number ?? 0;
    block = blockByPatchId[patch] || defaultInstrumentBlock;
  }
  return block;
}

/**
 * Produces a flat list of NoteEvent2 with tick, note, instrument, and track.
 */
function buildInstrumentLanes(midi: Midi, trimLeadingSilence?: boolean): InstrumentsLanes[] {
  var notes2: NoteEvent2[] = [];
  midi.tracks.forEach((track: Track, trackIndex: number) => {
    notes2.push(
      ...track.notes.map((note: Note) => {
        let block = getBlockForNote(track, note);
        return {
          tick: timeToRedstoneTick(note.time),
          note: midiToMinecraftNote(note.midi),
          instrument: instrumentByBlock[block] || 'harp',
          pitch: midiToPitchClass(note.midi),
          track: trackIndex,
          block,
        };
      }),
    );
  });
  // Sort by tick, then by note for determinism
  notes2.sort((a, b) => a.tick - b.tick || a.note - b.note);

  // If trimLeadingSilence, shift all ticks so the earliest note starts at tick 0
  if (trimLeadingSilence) {
    const firstTick = notes2.length > 0 ? notes2[0].tick : 0;
    notes2 = notes2.map((n) => ({ ...n, tick: Math.max(0, n.tick - firstTick) }));
  }
  // console.log('notes2', notes2);

  // Group notes by both instrument and MIDI track index
  const trackInstrumentMap = new Map<string, NoteEvent2[]>();
  notes2.forEach((note) => {
    const key = `${note.instrument}|${note.track}`;
    if (!trackInstrumentMap.has(key)) trackInstrumentMap.set(key, []);
    trackInstrumentMap.get(key)!.push(note);
  });

  // For each instrument/track, further separate into lanes if multiple notes occur at the same tick
  const perTrackInstrumentNoteLane: InstrumentsLanes[] = [];
  trackInstrumentMap.forEach((events, key) => {
    const [instrument, track] = key.split('|');
    const instrumentLanes = new Map<string, NoteEvent2[]>();

    instrumentLanes.set(`${instrument}-0`, []); // at least one lane per instrument/track
    events.forEach((note) => {
      let laneIndex = 0;
      let laneKey = `${instrument}-${laneIndex}`;

      // find empty lane if note is playing at same tick than existing note.
      while (
        instrumentLanes.has(laneKey) &&
        instrumentLanes.get(laneKey)!.some((n) => n.tick === note.tick)
      ) {
        laneIndex++;
        laneKey = `${instrument}-${laneIndex}`;

        if (!instrumentLanes.has(laneKey)) {
          break;
        }
      }
      if (!instrumentLanes.has(laneKey)) {
        // create the lane if it doesn't exist
        instrumentLanes.set(laneKey, []);
      }
      instrumentLanes.get(laneKey)!.push(note);
    });

    perTrackInstrumentNoteLane.push({ instumentLanes: instrumentLanes });
  });
  console.log('perTrackInstrumentNoteLane', perTrackInstrumentNoteLane);
  return perTrackInstrumentNoteLane;
}

/**
 * Represents a single cell in the schematic grid for a given lane and tick.
 * Each InstrumentLaneEvent corresponds to one tick in a lane.
 */
export interface InstrumentLaneEvent {
  /** Note event if present at this tick */
  note?: NoteEvent2;
  /** Number of repeater ticks if this cell is a repeater */
  repeaterTicks?: number;
  /** Cell type for rendering and logic */
  type: 'note' | 'repeater' | 'split' | 'dust' | 'empty';
  /** The tick (column) this cell represents */
  tick: number;
}

/**
 * Represents a schematic lane for a specific instrument and lane index.
 * Each lane contains an array of InstrumentLaneEvent, one per tick (column-major).
 */
export interface TracksByInstrumentLane {
  instrument: string;
  lane: number;
  /** Array of cells, one per tick (column-major) */
  events: InstrumentLaneEvent[];
}

// New tick-major, column-by-column schematic data structure
function buildTracks(
  instrumentsLanes: InstrumentsLanes[],
  lastTick: number,
): TracksByInstrumentLane[] {
  // For each instrument lane, create an array of cells, one per tick (column-major)
  const tracks: TracksByInstrumentLane[] = [];
  instrumentsLanes.forEach(({ instumentLanes }) => {
    instumentLanes.forEach((events, laneKey) => {
      const [instrument, laneStr] = laneKey.split('-');
      const lane = parseInt(laneStr, 10);

      // events is sorted by tick
      const laneEvents: InstrumentLaneEvent[] = [];
      let prevTick = -1;
      if (lane === 0) {
        // Only lane 0 gets repeaters and split cells after repeaters if needed
        let absTick = 0; // absolute timeline tick
        for (let i = 0; i < events.length; ++i) {
          const note = events[i];
          const noteTick = note.tick;
          if (i === 0) {
            // Insert repeaters to advance to the first note
            let gap = noteTick;
            while (gap > 0) {
              const advance = Math.min(gap, 4);
              laneEvents.push({ repeaterTicks: advance, tick: absTick, type: 'repeater' });
              // Insert dust for each tick after repeater
              for (let d = 1; d < advance; ++d) {
                laneEvents.push({ tick: absTick + d, type: 'dust' });
              }
              absTick += advance;
              gap -= advance;
            }
            if (noteTick > 0) {
              const isSplit = Array.from(instumentLanes.values()).some(
                (otherLane) => otherLane !== events && otherLane.some((n) => n.tick === noteTick),
              );
              if (isSplit) {
                laneEvents.push({ tick: absTick, type: 'split' });
                absTick++;
              }
            }
          } else {
            // Insert repeaters for the gap before the note
            let gap = noteTick - prevTick - 1;
            if (gap < 0) gap = 0;
            while (gap > 0) {
              const advance = Math.min(gap, 4);
              laneEvents.push({ repeaterTicks: advance, tick: absTick, type: 'repeater' });
              for (let d = 1; d < advance; ++d) {
                laneEvents.push({ tick: absTick + d, type: 'dust' });
              }
              absTick += advance;
              gap -= advance;
            }
            // After advancing, check if the next tick is a split
            const isSplit = Array.from(instumentLanes.values()).some(
              (otherLane) => otherLane !== events && otherLane.some((n) => n.tick === noteTick),
            );
            if (isSplit) {
              laneEvents.push({ tick: absTick, type: 'split' });
            }
          }
          const split = Array.from(instumentLanes.values()).some(
            (otherLane) => otherLane !== events && otherLane.some((n) => n.tick === noteTick),
          );
          laneEvents.push({ note, tick: absTick, type: 'note' });
          prevTick = noteTick;
        }
        // Fill to lastTick with repeaters if needed
        // if (events.length > 0 && prevTick < lastTick) {
        //   let gap = lastTick - prevTick;
        //   while (gap > 0) {
        //     const advance = Math.min(gap, 4);
        //     laneEvents.push({ repeaterTicks: advance, tick: absTick, type: 'repeater' });
        //     for (let d = 1; d < advance; ++d) {
        //       laneEvents.push({ tick: absTick + d, type: 'dust' });
        //     }
        //     // absTick += advance;
        //     gap -= advance;
        //   }
        // }
      } else {
        // Other lanes: only notes and empty
        const noteTicks = new Set(events.map((n) => n.tick));
        for (let t = 0; t <= lastTick; ++t) {
          const note = events.find((n) => n.tick === t);
          if (note) {
            const split = Array.from(instumentLanes.values()).some(
              (otherLane) => otherLane !== events && otherLane.some((n2) => n2.tick === t),
            );
            if (split) {
              laneEvents.push({ tick: t, type: 'split' });
            }
            laneEvents.push({ note, tick: t, type: 'note' });
          } else {
            laneEvents.push({ tick: t, type: 'empty' });
          }
        }
      }
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
