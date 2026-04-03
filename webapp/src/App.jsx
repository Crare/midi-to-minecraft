import { Midi } from '@tonejs/midi';
import { useEffect, useMemo, useRef, useState } from 'react';
import { playPlacementSound, prepareAudioPlayback } from './audio/noteblockAudio';
import DragScrollArea from './components/DragScrollArea';
import DownloadRow from './components/DownloadRow';
import TrackRow from './components/TrackRow';

const repeaterVisualizationModes = {
  single: 'single',
  accurate: 'accurate',
  synchronous: 'synchronous',
};

const playbackScopes = {
  all: 'all',
  single: 'single',
};

const redstoneTickDurationMs = 100;

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

function formatInstrumentName(instrument) {
  return instrument
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getRepeaterCount(redstoneTickDelay, repeaterVisualizationMode) {
  if (redstoneTickDelay <= 0) return 0;

  if (repeaterVisualizationMode === repeaterVisualizationModes.single) return 1;
  if (repeaterVisualizationMode === repeaterVisualizationModes.synchronous) {
    return redstoneTickDelay;
  }

  return Math.max(1, Math.ceil(redstoneTickDelay / 4));
}

function getTrackVisualUnitCount(notes, repeaterVisualizationMode) {
  return notes.reduce(
    (totalUnits, note) => totalUnits + getRepeaterCount(note.redstoneTickDelay, repeaterVisualizationMode) + 1,
    0
  );
}

function getMaxTrackTick(tracks) {
  return tracks.reduce(
    (maxTick, track) =>
      Math.max(maxTick, ...track.notes.map((note) => note.startTick ?? 0), 0),
    0
  );
}

function findFirstNoteIndexAtOrAfter(notes, startTick) {
  let low = 0;
  let high = notes.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (notes[mid].startTick < startTick) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
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

function buildVisualizationTracks(trackEvents, groupTracksByInstrument) {
  if (!groupTracksByInstrument) {
    return trackEvents.map((track) => ({
      id: track.id,
      title: track.title,
      subtitle: `${track.events.length} notes`,
      notes: eventsToPlacements(track.events),
    }));
  }

  const instrumentTracks = new Map();

  trackEvents.forEach((track) => {
    track.events.forEach((event) => {
      if (!instrumentTracks.has(event.instrument)) {
        instrumentTracks.set(event.instrument, []);
      }

      instrumentTracks.get(event.instrument).push(event);
    });
  });

  const groupedTracks = [];
  const epsilon = 0.000001;

  instrumentTracks.forEach((events, instrument) => {
    const sortedEvents = [...events].sort(
      (left, right) => left.time - right.time || left.endTime - right.endTime || left.note - right.note
    );
    const lanes = [];

    sortedEvents.forEach((event) => {
      let lane = lanes.find((candidate) => event.time + epsilon >= candidate.lastEndTime);

      if (!lane) {
        lane = { lastEndTime: -Infinity, events: [] };
        lanes.push(lane);
      }

      lane.events.push(event);
      lane.lastEndTime = Math.max(lane.lastEndTime, event.endTime);
    });

    const title = formatInstrumentName(instrument);

    lanes.forEach((lane, laneIndex) => {
      groupedTracks.push({
        id: `instrument-${instrument}-${laneIndex}`,
        title,
        subtitle:
          lanes.length > 1
            ? `Lane ${laneIndex + 1} · ${lane.events.length} notes`
            : `${lane.events.length} notes`,
        notes: eventsToPlacements(lane.events),
      });
    });
  });

  return groupedTracks;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [outputName, setOutputName] = useState('output.json');
  const [status, setStatus] = useState('Choose a MIDI file to begin.');
  const [busy, setBusy] = useState(false);
  const [trackEvents, setTrackEvents] = useState([]);
  const [downloadFiles, setDownloadFiles] = useState([]);
  const [outputsOpen, setOutputsOpen] = useState(false);
  const [tracksOpen, setTracksOpen] = useState(false);
  const [trimLeadingSilence, setTrimLeadingSilence] = useState(true);
  const [groupTracksByInstrument, setGroupTracksByInstrument] = useState(false);
  const [repeaterVisualizationMode, setRepeaterVisualizationMode] = useState(
    repeaterVisualizationModes.accurate
  );
  const [playbackScope, setPlaybackScope] = useState(playbackScopes.all);
  const [selectedPlaybackTrackId, setSelectedPlaybackTrackId] = useState('');
  const [playheadTick, setPlayheadTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadDragging, setPlayheadDragging] = useState(false);
  const [trackUnitSize, setTrackUnitSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 700 ? 30 : 34
  );
  const trackScrollRef = useRef(null);
  const playheadRef = useRef(null);
  const playheadDragRef = useRef({ active: false, pointerId: null });
  const playheadTickRef = useRef(0);
  const playbackNotesRef = useRef([]);
  const playbackEndTickRef = useRef(0);
  const playbackCursorRef = useRef(0);
  const playbackLastStateSyncMsRef = useRef(0);
  const playbackAnimationFrameRef = useRef(0);
  const playbackStartMsRef = useRef(0);
  const playbackStartTickRef = useRef(0);
  const zipFilename = useMemo(
    () => getZipFilename(outputName, file?.name || 'song.mid'),
    [file?.name, outputName]
  );
  const visibleTracks = useMemo(
    () =>
      buildVisualizationTracks(trackEvents, groupTracksByInstrument).filter(
        (track) => track.notes.length > 0
      ),
    [trackEvents, groupTracksByInstrument]
  );
  const playbackTracks = useMemo(() => {
    if (playbackScope === playbackScopes.single && selectedPlaybackTrackId) {
      return visibleTracks.filter((track) => track.id === selectedPlaybackTrackId);
    }

    return visibleTracks;
  }, [playbackScope, selectedPlaybackTrackId, visibleTracks]);
  const playbackNotes = useMemo(
    () =>
      playbackTracks
        .flatMap((track) => track.notes)
        .sort((left, right) => left.startTick - right.startTick || left.note - right.note),
    [playbackTracks]
  );
  const maxVisibleTick = useMemo(() => getMaxTrackTick(visibleTracks), [visibleTracks]);
  const playbackEndTick = useMemo(() => getMaxTrackTick(playbackTracks), [playbackTracks]);
  const timelineUnitCount = useMemo(() => {
    const visualUnits = visibleTracks.reduce(
      (maxUnits, track) =>
        Math.max(maxUnits, getTrackVisualUnitCount(track.notes, repeaterVisualizationMode)),
      0
    );

    return Math.max(visualUnits, Math.ceil(maxVisibleTick) + 2, 1);
  }, [maxVisibleTick, repeaterVisualizationMode, visibleTracks]);

  useEffect(() => {
    playbackNotesRef.current = playbackNotes;
    playbackEndTickRef.current = playbackEndTick;
  }, [playbackEndTick, playbackNotes]);

  function clearPlaybackTimers() {
    if (playbackAnimationFrameRef.current) {
      window.cancelAnimationFrame(playbackAnimationFrameRef.current);
      playbackAnimationFrameRef.current = 0;
    }
  }

  function ensurePlayheadVisible(nextTick) {
    const container = trackScrollRef.current;
    if (!container) return;

    const playheadX = nextTick * trackUnitSize;
    const padding = trackUnitSize * 2;
    const minVisible = container.scrollLeft + padding;
    const maxVisible = container.scrollLeft + container.clientWidth - padding;

    if (playheadX < minVisible) {
      container.scrollLeft = Math.max(0, playheadX - padding);
    } else if (playheadX > maxVisible) {
      container.scrollLeft = Math.max(0, playheadX - container.clientWidth + padding);
    }
  }

  function setPlayheadPosition(nextTick, { syncState = false, keepVisible = false } = {}) {
    const clampedTick = Math.max(0, nextTick);
    playheadTickRef.current = clampedTick;

    if (playheadRef.current) {
      playheadRef.current.style.left = `${clampedTick * trackUnitSize}px`;
    }

    if (syncState) {
      setPlayheadTick(clampedTick);
    }

    if (keepVisible) {
      ensurePlayheadVisible(clampedTick);
    }
  }

  function stopPlayback(nextTick) {
    clearPlaybackTimers();
    setIsPlaying(false);

    if (typeof nextTick === 'number') {
      setPlayheadPosition(nextTick, { syncState: true, keepVisible: true });
      return;
    }

    setPlayheadTick(playheadTickRef.current);
  }

  async function startPlayback(startTick = playheadTickRef.current) {
    if (playbackNotesRef.current.length === 0) return;

    const clampedStartTick = Math.min(
      Math.max(0, startTick),
      playbackEndTickRef.current + 1
    );

    stopPlayback(clampedStartTick);
    await prepareAudioPlayback();

    playbackStartMsRef.current = performance.now();
    playbackStartTickRef.current = clampedStartTick;
    playbackCursorRef.current = findFirstNoteIndexAtOrAfter(
      playbackNotesRef.current,
      clampedStartTick
    );
    playbackLastStateSyncMsRef.current = 0;
    setIsPlaying(true);

    const animationStep = () => {
      const elapsedTicks =
        (performance.now() - playbackStartMsRef.current) / redstoneTickDurationMs;
      const nextTick = Math.min(
        playbackEndTickRef.current + 1,
        playbackStartTickRef.current + elapsedTicks
      );

      while (
        playbackCursorRef.current < playbackNotesRef.current.length &&
        playbackNotesRef.current[playbackCursorRef.current].startTick <= nextTick + 0.0001
      ) {
        void playPlacementSound(playbackNotesRef.current[playbackCursorRef.current]);
        playbackCursorRef.current += 1;
      }

      const now = performance.now();
      const shouldSyncState =
        now - playbackLastStateSyncMsRef.current > 120 ||
        nextTick >= playbackEndTickRef.current + 1;

      setPlayheadPosition(nextTick, {
        syncState: shouldSyncState,
        keepVisible: true,
      });

      if (shouldSyncState) {
        playbackLastStateSyncMsRef.current = now;
      }

      if (nextTick >= playbackEndTickRef.current + 1) {
        stopPlayback(playbackEndTickRef.current + 1);
        return;
      }

      playbackAnimationFrameRef.current = window.requestAnimationFrame(animationStep);
    };

    playbackAnimationFrameRef.current = window.requestAnimationFrame(animationStep);
  }

  function updatePlayheadFromClientX(clientX) {
    const container = trackScrollRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const localX = clientX - rect.left + container.scrollLeft;
    const maxX = timelineUnitCount * trackUnitSize;
    const clampedX = Math.max(0, Math.min(localX, maxX));
    const nextTick = clampedX / trackUnitSize;

    setPlayheadPosition(nextTick, { syncState: true, keepVisible: true });
  }

  function finishPlayheadDrag() {
    playheadDragRef.current = { active: false, pointerId: null };
    setPlayheadDragging(false);
  }

  const onPlayheadPointerDown = (event) => {
    if (visibleTracks.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    stopPlayback();
    playheadDragRef.current = { active: true, pointerId: event.pointerId };
    setPlayheadDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePlayheadFromClientX(event.clientX);
  };

  const onPlayheadPointerMove = (event) => {
    if (
      !playheadDragRef.current.active ||
      playheadDragRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    event.preventDefault();
    updatePlayheadFromClientX(event.clientX);
  };

  const onPlayheadPointerUp = (event) => {
    if (playheadDragRef.current.pointerId !== event.pointerId) return;
    finishPlayheadDrag();
  };

  const onConvert = async () => {
    if (!file || busy) return;

    try {
      setBusy(true);
      setStatus('Reading MIDI file...');
      const buffer = await file.arrayBuffer();
      const midi = new Midi(buffer);
      const nextTrackEvents = buildTrackEvents(midi, { trimLeadingSilence });
      const sequences = nextTrackEvents.map((track) => eventsToPlacements(track.events));
      setTrackEvents(nextTrackEvents);
      setTracksOpen(nextTrackEvents.some((track) => track.events.length > 0));

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
      setOutputsOpen(files.length > 0);
      const totalNotes = sequences.reduce((sum, track) => sum + track.length, 0);
      setStatus(`Converted ${sequences.length} track(s), ${totalNotes} notes total.`);
    } catch (error) {
      console.error(error);
      setStatus(`Conversion failed: ${error.message || String(error)}`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const syncTrackUnitSize = () => {
      setTrackUnitSize(window.innerWidth <= 700 ? 30 : 34);
    };

    syncTrackUnitSize();
    window.addEventListener('resize', syncTrackUnitSize);

    return () => {
      window.removeEventListener('resize', syncTrackUnitSize);
      clearPlaybackTimers();
    };
  }, []);

  useEffect(() => {
    if (visibleTracks.length === 0) {
      setSelectedPlaybackTrackId('');
      stopPlayback(0);
      return;
    }

    if (!visibleTracks.some((track) => track.id === selectedPlaybackTrackId)) {
      setSelectedPlaybackTrackId(visibleTracks[0].id);
    }
  }, [selectedPlaybackTrackId, visibleTracks]);

  useEffect(() => {
    setPlayheadPosition(Math.min(playheadTickRef.current, maxVisibleTick + 1), {
      syncState: true,
      keepVisible: false,
    });
  }, [maxVisibleTick]);

  useEffect(() => {
    setPlayheadPosition(playheadTickRef.current, { syncState: false, keepVisible: false });
  }, [timelineUnitCount, trackUnitSize]);

  useEffect(() => {
    if (isPlaying) {
      stopPlayback();
    }
  }, [playbackNotes]);

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
              {busy ? (
                <>
                  <span className="spinner spinner-inline" aria-hidden="true" />
                  Converting...
                </>
              ) : (
                'Convert'
              )}
            </button>
          </div>
          <label className="option-row">
            <input
              type="checkbox"
              checked={trimLeadingSilence}
              onChange={(e) => setTrimLeadingSilence(e.target.checked)}
            />
            <span>Remove empty space at the start of the song</span>
          </label>
          <p id="status" className={busy ? 'status-busy' : undefined}>
            {busy ? <span className="spinner" aria-hidden="true" /> : null}
            <span>{status}</span>
          </p>
        </section>

        <section className="panel outputs">
          <button
            type="button"
            className="panel-header panel-header-toggle"
            onClick={() => {
              if (downloadFiles.length > 0) {
                setOutputsOpen((open) => !open);
              }
            }}
            aria-expanded={outputsOpen}
            disabled={downloadFiles.length === 0}
          >
            <h2>2) JSON Output</h2>
            <span className="panel-header-meta">
              {downloadFiles.length === 0
                ? 'No output yet'
                : outputsOpen
                  ? 'Hide'
                  : 'Show ZIP'}
            </span>
          </button>
          <div className="panel-body">
            <p className="hint output-summary">
              {downloadFiles.length === 0
                ? 'No output yet.'
                : `${downloadFiles.length} file(s) packaged into ${zipFilename}.`}
            </p>
            {outputsOpen ? (
              <div className="downloads">
                <DownloadRow filename={zipFilename} files={downloadFiles} />
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel visualization">
          <button
            type="button"
            className="panel-header panel-header-toggle"
            onClick={() => {
              if (visibleTracks.length > 0) {
                setTracksOpen((open) => !open);
              }
            }}
            aria-expanded={tracksOpen}
            disabled={visibleTracks.length === 0}
          >
            <h2>3) Track Visualization</h2>
            <span className="panel-header-meta">
              {visibleTracks.length === 0
                ? 'No tracks yet'
                : tracksOpen
                  ? 'Hide'
                  : groupTracksByInstrument
                    ? `Show ${visibleTracks.length} lane(s)`
                    : `Show ${visibleTracks.length} track(s)`}
            </span>
          </button>
          <div className="panel-body">
            <div className="playback-controls">
              <label className="option-row option-row-stacked">
                <span>Playback</span>
                <select
                  value={playbackScope}
                  onChange={(e) => setPlaybackScope(e.target.value)}
                  disabled={visibleTracks.length === 0}
                >
                  <option value={playbackScopes.all}>All tracks</option>
                  <option value={playbackScopes.single}>Single track</option>
                </select>
              </label>
              {playbackScope === playbackScopes.single ? (
                <label className="option-row option-row-stacked">
                  <span>Track</span>
                  <select
                    value={selectedPlaybackTrackId}
                    onChange={(e) => setSelectedPlaybackTrackId(e.target.value)}
                    disabled={visibleTracks.length === 0}
                  >
                    {visibleTracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.title} ({track.subtitle})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="playback-actions">
                <button
                  type="button"
                  onClick={() => {
                    void startPlayback();
                  }}
                  disabled={visibleTracks.length === 0 || isPlaying}
                >
                  Play
                </button>
                <button
                  type="button"
                  onClick={() => stopPlayback()}
                  disabled={!isPlaying && playheadTick === 0}
                >
                  Stop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void startPlayback(0);
                  }}
                  disabled={visibleTracks.length === 0}
                >
                  From Start
                </button>
              </div>
              <div className="playback-meta">
                Position: {playheadTick.toFixed(1)} ticks
              </div>
            </div>
            <label className="option-row">
              <input
                type="checkbox"
                checked={groupTracksByInstrument}
                onChange={(e) => setGroupTracksByInstrument(e.target.checked)}
                disabled={trackEvents.length === 0}
              />
              <span>Organize visualization by instrument</span>
            </label>
            <label className="option-row option-row-stacked">
              <span>Repeater visualization</span>
              <select
                value={repeaterVisualizationMode}
                onChange={(e) => setRepeaterVisualizationMode(e.target.value)}
                disabled={visibleTracks.length === 0}
              >
                <option value={repeaterVisualizationModes.single}>Single repeater</option>
                <option value={repeaterVisualizationModes.accurate}>Accurate amount needed</option>
                <option value={repeaterVisualizationModes.synchronous}>
                  Synchronous alignment
                </option>
              </select>
            </label>
            <p className="hint output-summary">
              Repeaters are inserted before each note based on redstoneTickDelay.
              {visibleTracks.length === 0
                ? ' No tracks to visualize.'
                : groupTracksByInstrument
                  ? ` ${visibleTracks.length} instrument lane(s) ready. Scroll horizontally for long tracks.`
                  : ` ${visibleTracks.length} track(s) ready. Scroll horizontally for long tracks.`}
            </p>
            {tracksOpen ? (
              <DragScrollArea className="track-scroll-wrap" containerRef={trackScrollRef}>
                <div
                  className="track-stage"
                  style={{ '--timeline-unit-count': timelineUnitCount }}
                >
                  <button
                    ref={playheadRef}
                    type="button"
                    className={playheadDragging ? 'playhead playhead-dragging' : 'playhead'}
                    style={{ left: `${playheadTick * trackUnitSize}px` }}
                    onPointerDown={onPlayheadPointerDown}
                    onPointerMove={onPlayheadPointerMove}
                    onPointerUp={onPlayheadPointerUp}
                    onPointerCancel={finishPlayheadDrag}
                    aria-label="Drag play position"
                  >
                    <span className="playhead-line" aria-hidden="true" />
                    <span className="playhead-head" aria-hidden="true" />
                  </button>
                  <div className="track-wrap">
                    {visibleTracks.map((track) => (
                      <TrackRow
                        key={track.id}
                        title={track.title}
                        subtitle={track.subtitle}
                        notes={track.notes}
                        repeaterVisualizationMode={repeaterVisualizationMode}
                        isPlaybackDimmed={
                          playbackScope === playbackScopes.single &&
                          selectedPlaybackTrackId &&
                          track.id !== selectedPlaybackTrackId
                        }
                      />
                    ))}
                  </div>
                </div>
              </DragScrollArea>
            ) : null}
          </div>
        </section>
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
