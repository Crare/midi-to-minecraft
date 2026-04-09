import { Midi } from '@tonejs/midi';
import type { Note } from '@tonejs/midi/dist/Note';
import type { Track } from '@tonejs/midi/dist/Track';
import {
  blockByPatchId,
  blockByPercussiveNote,
  defaultInstrumentBlock,
  defaultPercussiveBlock,
  instrumentByBlock,
} from '../constants';
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
      notes.push({
        time: startTime,
        endTime,
        block,
        pitch,
        note: mcNote,
        instrument: instrumentByBlock[block] || 'harp',
        trackIndex,
        trackName,
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
};

export function buildTrackEvents(
  midi: Midi,
  { trimLeadingSilence = false }: { trimLeadingSilence?: boolean } = {},
): TrackEvent[] {
  const noteList = buildNoteList(midi, { trimLeadingSilence });
  const instrumentMap = new Map<string, NoteEvent[]>();
  noteList.forEach((note) => {
    if (!instrumentMap.has(note.instrument)) instrumentMap.set(note.instrument, []);
    instrumentMap.get(note.instrument)!.push(note);
  });
  const tracks: TrackEvent[] = [];
  const epsilon = 1e-6;
  instrumentMap.forEach((events, instrument) => {
    const lanes: { lastEndTime: number; events: NoteEvent[] }[] = [];
    events.forEach((event) => {
      let lane = lanes.find((l) => event.time + epsilon >= l.lastEndTime);
      if (!lane) {
        lane = { lastEndTime: -Infinity, events: [] };
        lanes.push(lane);
      }
      lane.events.push(event);
      lane.lastEndTime = Math.max(lane.lastEndTime, event.endTime);
    });
    lanes.forEach((lane, laneIndex) => {
      tracks.push({
        id: `instrument-${instrument}-${laneIndex}`,
        title: instrument,
        events: lane.events,
        notes: Array.isArray(lane.events) ? lane.events : [],
      });
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
