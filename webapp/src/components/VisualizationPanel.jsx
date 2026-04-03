import { useEffect, useMemo, useRef, useState } from 'react';
import { playPlacementSound, prepareAudioPlayback } from '../audio/noteblockAudio';
import DragScrollArea from './DragScrollArea';
import TrackRow from './TrackRow';

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

function formatInstrumentName(instrument) {
  return instrument
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getRepeaterCount(redstoneTickDelay, repeaterVisualizationMode) {
  if (redstoneTickDelay <= 0) return 0;
  if (repeaterVisualizationMode === repeaterVisualizationModes.single) return 1;
  if (repeaterVisualizationMode === repeaterVisualizationModes.synchronous) return redstoneTickDelay;
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
    (maxTick, track) => Math.max(maxTick, ...track.notes.map((note) => note.startTick ?? 0), 0),
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
      if (!instrumentTracks.has(event.instrument)) instrumentTracks.set(event.instrument, []);
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

export default function VisualizationPanel({ trackEvents }) {
  const [tracksOpen, setTracksOpen] = useState(false);
  const [groupTracksByInstrument, setGroupTracksByInstrument] = useState(false);
  const [repeaterVisualizationMode, setRepeaterVisualizationMode] = useState(
    repeaterVisualizationModes.synchronous
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
  const topScrollRef = useRef(null);
  const isSyncingScrollRef = useRef(false);
  const playheadRef = useRef(null);
  const playheadDragRef = useRef({
    active: false,
    pointerId: null,
    startClientX: 0,
    startTick: 0,
  });
  const playheadTickRef = useRef(0);
  const playbackNotesRef = useRef([]);
  const playbackEndTickRef = useRef(0);
  const playbackCursorRef = useRef(0);
  const playbackLastStateSyncMsRef = useRef(0);
  const playbackAnimationFrameRef = useRef(0);
  const playbackStartMsRef = useRef(0);
  const playbackStartTickRef = useRef(0);

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

  function syncViewportToTick(nextTick) {
    const container = trackScrollRef.current;
    const playhead = playheadRef.current;
    if (!container || !playhead) return;

    const contentX = nextTick * trackUnitSize;
    const anchorX = Math.max(trackUnitSize * 2, container.clientWidth * 0.3);
    const targetScrollLeft = contentX - anchorX;
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const clampedScrollLeft = Math.min(maxScrollLeft, Math.max(0, targetScrollLeft));
    container.scrollLeft = clampedScrollLeft;

    playhead.style.left = `${Math.max(0, contentX)}px`;
  }

  function setPlayheadPosition(nextTick, { syncState = false, syncScroll = false } = {}) {
    const clampedTick = Math.max(0, nextTick);
    playheadTickRef.current = clampedTick;

    if (syncState) {
      setPlayheadTick(clampedTick);
    }

    if (syncScroll) {
      syncViewportToTick(clampedTick);
    }
  }

  function stopPlayback(nextTick) {
    clearPlaybackTimers();
    setIsPlaying(false);

    if (typeof nextTick === 'number') {
      setPlayheadPosition(nextTick, { syncState: true, syncScroll: true });
      return;
    }

    setPlayheadTick(playheadTickRef.current);
  }

  async function startPlayback(startTick = playheadTickRef.current) {
    if (playbackNotesRef.current.length === 0) return;

    const clampedStartTick = Math.min(Math.max(0, startTick), playbackEndTickRef.current + 1);

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
      const elapsedTicks = (performance.now() - playbackStartMsRef.current) / redstoneTickDurationMs;
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
        syncScroll: true,
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

  function finishPlayheadDrag() {
    playheadDragRef.current = {
      active: false,
      pointerId: null,
      startClientX: 0,
      startTick: 0,
    };
    setPlayheadDragging(false);
  }

  const onPlayheadPointerDown = (event) => {
    if (visibleTracks.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    stopPlayback();
    playheadDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startTick: playheadTickRef.current,
    };
    setPlayheadDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPlayheadPointerMove = (event) => {
    if (
      !playheadDragRef.current.active ||
      playheadDragRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    event.preventDefault();
    const deltaTicks = (event.clientX - playheadDragRef.current.startClientX) / trackUnitSize;
    setPlayheadPosition(playheadDragRef.current.startTick + deltaTicks, {
      syncState: true,
      syncScroll: true,
    });
  };

  const onPlayheadPointerUp = (event) => {
    if (playheadDragRef.current.pointerId !== event.pointerId) return;
    finishPlayheadDrag();
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
      setTracksOpen(false);
      stopPlayback(0);
      return;
    }

    setTracksOpen(true);

    if (!visibleTracks.some((track) => track.id === selectedPlaybackTrackId)) {
      setSelectedPlaybackTrackId(visibleTracks[0].id);
    }
  }, [selectedPlaybackTrackId, visibleTracks]);

  useEffect(() => {
    setPlayheadPosition(Math.min(playheadTickRef.current, maxVisibleTick + 1), {
      syncState: true,
      syncScroll: true,
    });
  }, [maxVisibleTick]);

  useEffect(() => {
    setPlayheadPosition(playheadTickRef.current, { syncState: false, syncScroll: true });
  }, [timelineUnitCount, trackUnitSize]);

  useEffect(() => {
    if (isPlaying) {
      stopPlayback();
    }
  }, [playbackNotes]);

  useEffect(() => {
    if (!tracksOpen) return;
    const main = trackScrollRef.current;
    const proxy = topScrollRef.current;
    if (!main || !proxy) return;

    const syncToProxy = () => {
      if (isSyncingScrollRef.current) return;
      isSyncingScrollRef.current = true;
      proxy.scrollLeft = main.scrollLeft;
      isSyncingScrollRef.current = false;
    };
    const syncToMain = () => {
      if (isSyncingScrollRef.current) return;
      isSyncingScrollRef.current = true;
      main.scrollLeft = proxy.scrollLeft;
      isSyncingScrollRef.current = false;
    };

    main.addEventListener('scroll', syncToProxy, { passive: true });
    proxy.addEventListener('scroll', syncToMain, { passive: true });
    return () => {
      main.removeEventListener('scroll', syncToProxy);
      proxy.removeEventListener('scroll', syncToMain);
    };
  }, [tracksOpen]);

  return (
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
              onChange={(event) => setPlaybackScope(event.target.value)}
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
                onChange={(event) => setSelectedPlaybackTrackId(event.target.value)}
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
            <button type="button" className="icon-btn" title="Play" onClick={() => void startPlayback()} disabled={visibleTracks.length === 0 || isPlaying} aria-label="Play">
              <svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="3,1 15,8 3,15" /></svg>
            </button>
            <button type="button" className="icon-btn" title="Stop" onClick={() => stopPlayback()} disabled={!isPlaying && playheadTick === 0} aria-label="Stop">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="1" width="4" height="14" /><rect x="10" y="1" width="4" height="14" /></svg>
            </button>
            <button type="button" className="icon-btn" title="Go to start" onClick={() => {
              if (isPlaying) {
                void startPlayback(0);
              } else {
                setPlayheadPosition(0, { syncState: true, syncScroll: true });
              }
            }} disabled={visibleTracks.length === 0} aria-label="Go to start">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1" ry="1" /></svg>
            </button>
          </div>
          <div className="playback-meta">Position: {playheadTick.toFixed(1)} ticks</div>
        </div>
        <label className="option-row">
          <input
            type="checkbox"
            checked={groupTracksByInstrument}
            onChange={(event) => setGroupTracksByInstrument(event.target.checked)}
            disabled={trackEvents.length === 0}
          />
          <span>Organize visualization by instrument</span>
        </label>
        <label className="option-row option-row-stacked">
          <span>Repeater visualization</span>
          <select
            value={repeaterVisualizationMode}
            onChange={(event) => setRepeaterVisualizationMode(event.target.value)}
            disabled={visibleTracks.length === 0}
          >
            <option value={repeaterVisualizationModes.single}>Single repeater</option>
            <option value={repeaterVisualizationModes.accurate}>Accurate amount needed</option>
            <option value={repeaterVisualizationModes.synchronous}>Synchronous alignment</option>
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
          <>
            <div className="track-scroll-proxy-top" ref={topScrollRef}>
              <div className="track-scroll-spacer" style={{ width: `${timelineUnitCount * trackUnitSize}px` }} />
            </div>
            <DragScrollArea className="track-scroll-wrap" containerRef={trackScrollRef}>
            <button
              ref={playheadRef}
              type="button"
              className={playheadDragging ? 'playhead playhead-dragging' : 'playhead'}
              style={{ left: '0px' }}
              onPointerDown={onPlayheadPointerDown}
              onPointerMove={onPlayheadPointerMove}
              onPointerUp={onPlayheadPointerUp}
              onPointerCancel={finishPlayheadDrag}
              aria-label="Drag play position"
            >
              <span className="playhead-line" aria-hidden="true" />
              <span className="playhead-head" aria-hidden="true" />
            </button>
            <div className="track-stage" style={{ '--timeline-unit-count': timelineUnitCount }}>
              <div className="track-wrap">
                {visibleTracks.map((track, trackIndex) => (
                  <TrackRow
                    key={track.id}
                    title={track.title}
                    subtitle={track.subtitle}
                    notes={track.notes}
                    repeaterVisualizationMode={repeaterVisualizationMode}
                    noteTooltipDirection={trackIndex === 0 ? 'bottom' : 'top'}
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
          </>
        ) : null}
      </div>
    </section>
  );
}
