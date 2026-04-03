import { Midi } from '@tonejs/midi';
import { useState } from 'react';
import JsonOutputPanel from './components/JsonOutputPanel';
import UploadPanel from './components/UploadPanel';
import VisualizationPanel from './components/VisualizationPanel';

const defaultInstrumentBlock = 'minecraft:dirt';
const defaultPercussiveBlock = 'minecraft:sand';

const instrumentByBlock = {
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

const blockByPatchId = {
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

const blockByPercussiveNote = {
  35: 'minecraft:stone',
  36: 'minecraft:stone',
  38: 'minecraft:sand',
  40: 'minecraft:sand',
  42: 'minecraft:glass',
  44: 'minecraft:glass',
  46: 'minecraft:glass',
  56: 'minecraft:soul_sand',
};

function midiToPitchClass(noteNumber) {
  const scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return scale[noteNumber % 12];
}

function midiToMinecraftNote(noteNumber) {
  return ((noteNumber - 6) % 24 + 24) % 24;
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function splitOutputTarget(inputName, outputName) {
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

function getZipFilename(outputName, inputName) {
  const target = splitOutputTarget(inputName, outputName);
  return `${target.stem}.zip`;
}

function getSongStartTime(midi) {
  let earliestTime = Infinity;

  midi.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      if (note.time < earliestTime) earliestTime = note.time;
    });
  });

  return Number.isFinite(earliestTime) ? earliestTime : 0;
}

function buildTrackEvents(midi, { trimLeadingSilence = false } = {}) {
  const songStartTime = trimLeadingSilence ? getSongStartTime(midi) : 0;

  return midi.tracks.map((track, index) => {
    const notes = [...track.notes].sort((a, b) => a.time - b.time);
    const channel = typeof track.channel === 'number' ? track.channel : 0;
    const patch = track.instrument?.number ?? 0;
    const defaultTrackBlock = blockByPatchId[patch] || defaultInstrumentBlock;

    return {
      id: `track-${index}`,
      title: `Track ${index + 1}`,
      events: notes.map((note) => {
        const startTime = Math.max(0, note.time - songStartTime);
        const duration = Math.max(note.duration ?? 0.05, 0.05);
        const endTime = startTime + duration;
        const isDrum = channel === 9;
        const block = isDrum
          ? (blockByPercussiveNote[note.midi] || defaultPercussiveBlock)
          : defaultTrackBlock;
        const pitch = isDrum ? undefined : midiToPitchClass(note.midi);
        const mcNote = isDrum ? 0 : midiToMinecraftNote(note.midi);

        return {
          time: startTime,
          endTime,
          block,
          pitch,
          note: mcNote,
          instrument: instrumentByBlock[block] || 'harp',
        };
      }),
    };
  });
}

function eventsToPlacements(events) {
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
    };
  });
}

export default function App() {
  const [status, setStatus] = useState('Choose a MIDI file to begin.');
  const [busy, setBusy] = useState(false);
  const [trackEvents, setTrackEvents] = useState([]);
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [zipFilename, setZipFilename] = useState('output.zip');

  const onConvertRequest = async ({ file, outputName, trimLeadingSilence }) => {
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
    } catch (error) {
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
          Upload a MIDI file, convert it to note block JSON, and visualize each
          track as a horizontal build line.
        </p>
      </header>

      <main>
        <UploadPanel
          busy={busy}
          status={status}
          onFileSelected={(filename) => setStatus(`Selected: ${filename}`)}
          onConvertRequest={onConvertRequest}
        />

        <JsonOutputPanel downloadFiles={downloadFiles} zipFilename={zipFilename} />

        <VisualizationPanel trackEvents={trackEvents} />
      </main>

      <footer className="site-footer">
        <p>
          Inspired by the <a href="https://github.com/colinthesealion" target="_blank" rel="noreferrer">MIDI to Minecraft project by colinthesealion</a>. Website created by{' '}
          <a href="https://crare.github.io" target="_blank" rel="noreferrer">
            Crare
          </a>
          .
        </p>
      </footer>
    </>
  );
}
