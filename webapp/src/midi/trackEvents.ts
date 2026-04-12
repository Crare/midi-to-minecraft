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

export function buildTrackEvents(
  midi: Midi,
  { trimLeadingSilence = false }: { trimLeadingSilence?: boolean } = {},
): TrackEvent[] {
  // 1. Build flat note list
  const noteList = buildNoteList(midi, { trimLeadingSilence });
  // 2. Combine all events for the same instrument
  const instrumentMap = new Map<string, NoteEvent[]>();
  noteList.forEach((note) => {
    if (!instrumentMap.has(note.instrument)) instrumentMap.set(note.instrument, []);
    instrumentMap.get(note.instrument)!.push(note);
  });

  // 3. For each instrument, sort by tick and build tick-indexed map
  const tracks: TrackEvent[] = [];
  instrumentMap.forEach((events, instrument) => {
    // Sort by tick, then by note for determinism
    const sorted = [...events].sort((a, b) => a.tick - b.tick || a.note - b.note);
    // Map: tick -> notes[]
    const tickMap = new Map<number, NoteEvent[]>();
    sorted.forEach((ev) => {
      if (!tickMap.has(ev.tick)) tickMap.set(ev.tick, []);
      tickMap.get(ev.tick)!.push(ev);
    });
    // 4. Build schematic-ready event list
    let lastTick: number | null = null;
    const schematicEvents: Array<NoteEvent & { repeaterTicks: number; split: boolean }> = [];
    for (const [tick, notesAtTick] of Array.from(tickMap.entries()).sort((a, b) => a[0] - b[0])) {
      const isSplit = notesAtTick.length > 1;
      // For each note at this tick, compute repeaters needed from lastTick
      notesAtTick.forEach((note, idx) => {
        const repeaterTicks = lastTick === null ? note.tick : note.tick - lastTick;
        schematicEvents.push({
          ...note,
          repeaterTicks,
          split: isSplit,
        });
      });
      lastTick = tick;
    }
    // Attach .cells for canvas rendering
    const cells = buildInstrumentCells(schematicEvents);
    tracks.push({
      id: `instrument-${instrument}`,
      title: instrument,
      events: schematicEvents,
      notes: schematicEvents,
      cells,
    });
  });
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
