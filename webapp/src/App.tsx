import { Midi } from '@tonejs/midi';
import type { Note } from '@tonejs/midi/dist/Note';
import type { Track } from '@tonejs/midi/dist/Track';
import { useState } from 'react';
import { playSuccessJingle } from './audio/noteblockAudio';
import ExamplePanel from './components/ExamplePanel';
import JsonOutputPanel from './components/JsonOutputPanel';
import SchematicPanel from './components/SchematicPanel';
import UploadPanel from './components/UploadPanel';
import VisualizationPanel from './components/VisualizationPanel';

const defaultInstrumentBlock = 'minecraft:dirt';
const defaultPercussiveBlock = 'minecraft:sand';

const instrumentByBlock: Record<string, string> = {
  'minecraft:acacia_log': 'bass',
  'minecraft:sand': 'snare',
  'minecraft:glass': 'hat',
  'minecraft:stone': 'basedrum',
  'minecraft:gold_block': 'bell',
  'minecraft:clay': 'flute',
  'minecraft:packed_ice': 'chime',
  'minecraft:white_wool': 'guitar',
  'minecraft:bone_block': 'xylophone',
  'minecraft:iron_block': 'iron_xylophone',
  'minecraft:soul_sand': 'cow_bell',
  'minecraft:pumpkin': 'didgeridoo',
  'minecraft:emerald_block': 'bit',
  'minecraft:hay_block': 'banjo',
  'minecraft:glowstone': 'pling',
  'minecraft:dirt': 'harp',
};

const blockByPatchId: Record<number, string> = {
  2: 'minecraft:glowstone',
  4: 'minecraft:glowstone',
  5: 'minecraft:glowstone',
  8: 'minecraft:iron_block',
  9: 'minecraft:gold_block',
  10: 'minecraft:iron_block',
  11: 'minecraft:iron_block',
  12: 'minecraft:iron_block',
  13: 'minecraft:bone_block',
  14: 'minecraft:gold_block',
  24: 'minecraft:white_wool',
  25: 'minecraft:white_wool',
  26: 'minecraft:white_wool',
  27: 'minecraft:white_wool',
  28: 'minecraft:white_wool',
  29: 'minecraft:white_wool',
  30: 'minecraft:white_wool',
  31: 'minecraft:white_wool',
  32: 'minecraft:acacia_log',
  33: 'minecraft:acacia_log',
  34: 'minecraft:acacia_log',
  35: 'minecraft:acacia_log',
  36: 'minecraft:acacia_log',
  37: 'minecraft:acacia_log',
  38: 'minecraft:acacia_log',
  39: 'minecraft:acacia_log',
  72: 'minecraft:clay',
  73: 'minecraft:clay',
  74: 'minecraft:clay',
  75: 'minecraft:clay',
  76: 'minecraft:clay',
  77: 'minecraft:clay',
  78: 'minecraft:clay',
  79: 'minecraft:clay',
  80: 'minecraft:emerald_block',
  105: 'minecraft:hay_block',
  112: 'minecraft:packed_ice',
};

const blockByPercussiveNote: Record<number, string> = {
  35: 'minecraft:stone',
  36: 'minecraft:stone',
  38: 'minecraft:sand',
  40: 'minecraft:sand',
  42: 'minecraft:glass',
  44: 'minecraft:glass',
  46: 'minecraft:glass',
  56: 'minecraft:soul_sand',
};

function midiToPitchClass(noteNumber: number): string {
  const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return scale[noteNumber % 12];
}

function midiToMinecraftNote(noteNumber: number): number {
  return (((noteNumber - 6) % 24) + 24) % 24;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function splitOutputTarget(inputName: string, outputName?: string) {
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

function getZipFilename(outputName: string | undefined, inputName: string): string {
  const target = splitOutputTarget(inputName, outputName);
  return `${target.stem}.zip`;
}

function getSongStartTime(midi: Midi): number {
  let earliestTime = Infinity;
  midi.tracks.forEach((track: Track) => {
    track.notes.forEach((note: Note) => {
      if (note.time < earliestTime) earliestTime = note.time;
    });
  });
  return Number.isFinite(earliestTime) ? earliestTime : 0;
}

type NoteEvent = {
  time: number;
  endTime: number;
  block: string;
  pitch?: string;
  note: number;
  instrument: string;
  trackIndex: number;
  trackName: string;
};

function buildNoteList(
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

type TrackEvent = {
  id: string;
  title: string;
  events: NoteEvent[];
};

function buildTrackEvents(
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
        notes: Array.isArray(lane.events) ? lane.events : [], // Always provide notes array
      } as TrackEvent & { notes: NoteEvent[] });
    });
  });
  return tracks;
}

type Placement = {
  redstoneTickDelay: number;
  startTick: number;
  block: string;
  pitch?: string;
  note: number;
  instrument: string;
  trackIndex: number;
  trackName: string;
};

function eventsToPlacements(events: NoteEvent[]): Placement[] {
  let lastTime = 0;
  let lastTick = 0;

  return events.map((event) => {
    const redstoneTickDelay = Math.round(Math.max(0, event.time - lastTime) * 10);
    const startTick = lastTick + redstoneTickDelay;
    lastTime = event.time;
    lastTick = startTick;

    return {
      redstoneTickDelay,
      startTick,
      block: event.block,
      pitch: event.pitch,
      note: event.note,
      instrument: event.instrument,
      trackIndex: event.trackIndex,
      trackName: event.trackName,
    };
  });
}

interface ConvertRequest {
  file: File;
  outputName?: string;
  trimLeadingSilence?: boolean;
}

export default function App() {
  const [status, setStatus] = useState<string>('Choose a MIDI file to begin.');
  const [busy, setBusy] = useState<boolean>(false);
  const [trackEvents, setTrackEvents] = useState<TrackEvent[]>([]);
  const [downloadFiles, setDownloadFiles] = useState<{ name: string; data: Placement[] }[]>([]);
  const [zipFilename, setZipFilename] = useState<string>('output.zip');

  const onConvertRequest = async ({ file, outputName, trimLeadingSilence }: ConvertRequest) => {
    if (!file || busy) return;

    try {
      setBusy(true);
      setStatus('Reading MIDI file...');
      const buffer = await file.arrayBuffer();
      const midi = new Midi(buffer);
      const nextTrackEvents = buildTrackEvents(midi, { trimLeadingSilence });
      const sequences = nextTrackEvents.map((track) => eventsToPlacements(track.events));
      setTrackEvents(nextTrackEvents);

      const target = splitOutputTarget(file.name, outputName);
      const files =
        sequences.length <= 1
          ? [
              {
                name: `${target.dir}/${target.stem}${target.ext}`,
                data: sequences[0] || [],
              },
            ]
          : sequences.map((track, i) => ({
              name: `${target.dir}/${target.stem}.${i}${target.ext}`,
              data: track,
            }));

      setDownloadFiles(files);
      setZipFilename(getZipFilename(outputName, file.name));
      const totalNotes = sequences.reduce((sum, track) => sum + track.length, 0);
      setStatus(`Converted ${sequences.length} track(s), ${totalNotes} notes total.`);
      setTimeout(() => playSuccessJingle(), 2000);
    } catch (error: any) {
      console.error(error);
      setStatus(`Conversion failed: ${error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="hero">
        <h1>MIDI to Minecraft Noteblocks</h1>
        <p>
          Upload a MIDI file, convert it to note block JSON, and visualize each track as a
          horizontal build line.
        </p>
      </header>

      <main>
        <ExamplePanel />

        <UploadPanel
          busy={busy}
          status={status}
          onFileSelected={(filename: string) => setStatus(`Selected: ${filename}`)}
          onConvertRequest={onConvertRequest}
        />

        <JsonOutputPanel downloadFiles={downloadFiles} zipFilename={zipFilename} />

        <VisualizationPanel trackEvents={trackEvents} />

        <SchematicPanel trackEvents={trackEvents} />
      </main>

      <footer className="site-footer">
        <p>
          Inspired by the{' '}
          <a href="https://github.com/colinthesealion" target="_blank" rel="noreferrer">
            MIDI to Minecraft project by colinthesealion
          </a>
          . Website with visualization and schematic created by{' '}
          <a href="https://crare.github.io" target="_blank" rel="noreferrer">
            Crare
          </a>
          .
        </p>
        <p>
          This site uses{' '}
          <a href="https://www.goatcounter.com" target="_blank" rel="noreferrer">
            GoatCounter
          </a>{' '}
          to count anonymous page visits. No personal data is collected.
        </p>
        <p>
          Licensed under the{' '}
          <a
            href="https://github.com/Crare/midi-to-minecraft/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
          >
            MIT License
          </a>
          .
        </p>
      </footer>
    </>
  );
}
