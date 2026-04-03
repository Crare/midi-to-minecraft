import { Midi } from '@tonejs/midi';
import { useMemo, useState } from 'react';

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

const supportColorByBlock = {
  acacia_log: '#8b5a2b',
  sand: '#d4be7d',
  glass: '#8cd9e9',
  stone: '#8f9497',
  gold_block: '#f3cf3f',
  clay: '#b9a6a2',
  packed_ice: '#bce8ff',
  white_wool: '#f4f2e9',
  bone_block: '#e3dcc2',
  iron_block: '#c4cbd0',
  soul_sand: '#6f5b45',
  pumpkin: '#d27720',
  emerald_block: '#3cc76f',
  hay_block: '#d6c66a',
  glowstone: '#f2cb6c',
  dirt: '#7f5a34',
};

const supportSpriteCache = new Map();

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

function toPlacementsByTrack(midi) {
  return midi.tracks.map((track) => {
    const notes = [...track.notes].sort((a, b) => a.time - b.time);
    const channel = typeof track.channel === 'number' ? track.channel : 0;
    const patch = track.instrument?.number ?? 0;
    const defaultTrackBlock = blockByPatchId[patch] || defaultInstrumentBlock;

    let lastTime = 0;
    return notes.map((note) => {
      const deltaSeconds = Math.max(0, note.time - lastTime);
      lastTime = note.time;
      const redstoneTickDelay = Math.round(deltaSeconds * 10);
      const isDrum = channel === 9;
      const block = isDrum
        ? (blockByPercussiveNote[note.midi] || defaultPercussiveBlock)
        : defaultTrackBlock;
      const pitch = isDrum ? undefined : midiToPitchClass(note.midi);
      const mcNote = isDrum ? 0 : midiToMinecraftNote(note.midi);

      return {
        redstoneTickDelay,
        block,
        pitch,
        note: mcNote,
        instrument: instrumentByBlock[block] || 'harp',
      };
    });
  });
}

function supportSpriteForBlock(blockId) {
  if (supportSpriteCache.has(blockId)) return supportSpriteCache.get(blockId);

  const blockName = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  const color = supportColorByBlock[blockName] || '#8a8a8a';
  const dark = '#4c4c4c';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' shape-rendering='crispEdges'>
    <rect width='64' height='64' fill='${color}'/>
    <rect x='2' y='2' width='60' height='10' fill='rgba(255,255,255,0.25)'/>
    <rect x='2' y='54' width='60' height='8' fill='rgba(0,0,0,0.2)'/>
    <rect x='0' y='0' width='64' height='64' fill='none' stroke='${dark}' stroke-width='2'/>
  </svg>`;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  supportSpriteCache.set(blockId, uri);
  return uri;
}

function DownloadRow({ filename, data }) {
  const href = useMemo(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    return URL.createObjectURL(blob);
  }, [data]);

  return (
    <div className="download-row">
      <div>
        <div>{filename}</div>
        <div className="meta">{data.length} notes</div>
      </div>
      <a className="button-link" href={href} download={filename}>
        Download
      </a>
    </div>
  );
}

function TrackRow({ index, notes }) {
  const repeaterImg = `${import.meta.env.BASE_URL}assets/repeater.svg`;
  const noteblockImg = `${import.meta.env.BASE_URL}assets/noteblock.svg`;

  return (
    <div className="track-row">
      <div className="track-title">
        Track {index + 1} ({notes.length} notes)
      </div>
      <div className="track-scroll">
        <div className="track-line">
          {notes.map((placement, noteIndex) => {
            const repeaterCount =
              placement.redstoneTickDelay > 0
                ? Math.max(1, Math.ceil(placement.redstoneTickDelay / 4))
                : 0;
            const units = [];

            for (let i = 0; i < repeaterCount; i += 1) {
              units.push(
                <div className="repeater" key={`rep-${noteIndex}-${i}`}>
                  <img src={repeaterImg} alt="repeater" />
                  {i === 0 ? (
                    <div className="delay-label">{placement.redstoneTickDelay}</div>
                  ) : null}
                </div>
              );
            }

            units.push(
              <div className="note-unit" key={`note-${noteIndex}`}>
                <img className="note-img" src={noteblockImg} alt="noteblock" />
                <img
                  className="support-img"
                  src={supportSpriteForBlock(placement.block)}
                  alt={placement.block}
                />
                <div className="note-meta">
                  {placement.instrument}
                  <br />
                  {placement.pitch || 'drum'} {placement.note}
                </div>
              </div>
            );

            return <React.Fragment key={`frag-${noteIndex}`}>{units}</React.Fragment>;
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [outputName, setOutputName] = useState('output.json');
  const [status, setStatus] = useState('Choose a MIDI file to begin.');
  const [busy, setBusy] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [downloadFiles, setDownloadFiles] = useState([]);

  const onConvert = async () => {
    if (!file || busy) return;

    try {
      setBusy(true);
      setStatus('Reading MIDI file...');
      const buffer = await file.arrayBuffer();
      const midi = new Midi(buffer);
      const sequences = toPlacementsByTrack(midi);
      setTracks(sequences);

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
        <section className="panel controls">
          <h2>1) Upload MIDI</h2>
          <div className="control-row">
            <input
              type="file"
              accept=".mid,.midi,audio/midi,audio/x-midi"
              onChange={(e) => {
                const next = e.target.files?.[0] || null;
                setFile(next);
                if (next) setStatus(`Selected: ${next.name}`);
              }}
            />
            <input
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="output.json"
              aria-label="output filename"
            />
            <button onClick={onConvert} disabled={!file || busy}>
              {busy ? 'Converting...' : 'Convert'}
            </button>
          </div>
          <p id="status">{status}</p>
        </section>

        <section className="panel outputs">
          <h2>2) JSON Output</h2>
          <div className="downloads">
            {downloadFiles.length === 0 ? (
              <div className="meta">No output yet.</div>
            ) : null}
            {downloadFiles.map((entry) => (
              <DownloadRow
                key={entry.name}
                filename={entry.name.replace(/^.*\//, '')}
                data={entry.data}
              />
            ))}
          </div>
        </section>

        <section className="panel visualization">
          <h2>3) Track Visualization</h2>
          <p className="hint">
            Repeaters are inserted before each note based on redstoneTickDelay.
            Scroll horizontally for long tracks.
          </p>
          <div className="track-wrap">
            {tracks.length === 0 ? (
              <div className="meta">No tracks to visualize.</div>
            ) : null}
            {tracks.map((track, idx) => (
              <TrackRow key={`track-${idx}`} index={idx} notes={track} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
