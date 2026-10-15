import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type {
  CanvasLane,
  CanvasOpts,
  CanvasView,
  SpriteStore,
  TrackEvents,
  VisualizationPlacement,
} from '../../types';
import {
  getAudioClock,
  playPlacementSound,
  playPlacementSoundSync,
  prepareAudioPlayback,
} from '../../audio/noteblockAudio';
import CollapsiblePanel from '../CollapsiblePanel';
import {
  LANE_GAP,
  computeLaneLayout,
  createSpriteStore,
  getNoteTooltipLines,
  hitTest,
  renderTracks,
  tickToX,
} from './canvasRenderer';
import {
  playbackScopes,
  viewModes,
  redstoneTickDurationMs,
  buildVisualizationTracks,
  getMaxTrackTick,
  findFirstNoteIndexAtOrAfter,
} from './visualizationData';

const START_DELAY_S = 0.06;
const SCHEDULE_AHEAD_S = 0.15;
const SCHEDULER_INTERVAL_MS = 25;

interface RenderParams extends CanvasOpts {
  layout: ReturnType<typeof computeLaneLayout>;
  width: number;
  lanes: CanvasLane[];
}

interface TooltipState {
  lines: string[];
  left: number;
  top: number;
  below: boolean;
}

type PlaybackNote = VisualizationPlacement & { startTick: number; trackId: string };

export default function VisualizationPanel({ trackEvents }: { trackEvents: TrackEvents[] }) {
  const [tracksOpen, setTracksOpen] = useState(false);
  const [showColor, setShowColor] = useState(true);
  const [showNumber, setShowNumber] = useState(true);
  const [showSupport, setShowSupport] = useState(true);
  const [viewMode, setViewMode] = useState(viewModes.instrument);
  const [playbackScope, setPlaybackScope] = useState(playbackScopes.all);
  const [selectedPlaybackTrackId, setSelectedPlaybackTrackId] = useState('');
  const [playheadTick, setPlayheadTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadDragging, setPlayheadDragging] = useState(false);
  const [mutedTracks, setMutedTracks] = useState<Set<string>>(new Set());
  const mutedTracksRef = useRef(mutedTracks);
  const [trackUnitSize, setTrackUnitSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 700 ? 30 : 34
  );

  const [canvasWidth, setCanvasWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playheadRef = useRef<HTMLButtonElement>(null);
  const scrollLeftRef = useRef(0);
  const drawFrameRef = useRef(0);
  const renderParamsRef = useRef<RenderParams | null>(null);
  const spritesRef = useRef<SpriteStore | null>(null);
  const canvasPanRef = useRef<{
    pointerId: number | null;
    startX: number;
    startScroll: number;
    moved: boolean;
  }>({ pointerId: null, startX: 0, startScroll: 0, moved: false });
  const hoveredKeyRef = useRef<string | null>(null);
  const playheadDragRef = useRef<{ active: boolean; pointerId: number | null; grabOffsetTicks: number }>({
    active: false,
    pointerId: null,
    grabOffsetTicks: 0,
  });
  const playheadTickRef = useRef(0);
  const playbackNotesRef = useRef<PlaybackNote[]>([]);
  const playbackEndTickRef = useRef(0);
  const playbackCursorRef = useRef(0);
  const playbackLastStateSyncMsRef = useRef(0);
  const playbackAnimationFrameRef = useRef(0);
  const playbackStartMsRef = useRef(0);
  const playbackAudioStartRef = useRef<number | null>(null);
  const playbackSchedulerRef = useRef(0);
  const playbackStartTickRef = useRef(0);

  const visibleTracks = useMemo(
    () => buildVisualizationTracks(trackEvents, viewMode).filter((track) => track.notes.length > 0),
    [trackEvents, viewMode]
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
        .flatMap((track) =>
          track.notes.flatMap((notePos) =>
            notePos.placements.map((p) => ({ ...p, startTick: notePos.startTick, trackId: track.id }))
          )
        )
        .sort((left, right) => left.startTick - right.startTick || left.note - right.note),
    [playbackTracks]
  );

  // Stable per-track toggle callbacks — only recreated when the track list changes,
  // not on every playheadTick update. This keeps TrackRow memo intact during playback.
  const toggleMuteCallbacks = useMemo(() => {
    const map = new Map<string, () => void>();
    visibleTracks.forEach((track) => {
      map.set(track.id, () => {
        setMutedTracks((prev) => {
          const next = new Set(prev);
          if (next.has(track.id)) next.delete(track.id);
          else next.add(track.id);
          return next;
        });
      });
    });
    return map;
  }, [visibleTracks]);

  const maxVisibleTick = useMemo(() => getMaxTrackTick(visibleTracks), [visibleTracks]);
  const playbackEndTick = useMemo(() => getMaxTrackTick(playbackTracks), [playbackTracks]);

  const timelineUnitCount = useMemo(() => Math.max(Math.ceil(maxVisibleTick) + 2, 1), [maxVisibleTick]);

  // Lanes are sized so every lane fits the window height; only the timeline pans.
  const layout = useMemo(
    () =>
      computeLaneLayout({
        laneCount: visibleTracks.length,
        availableHeight: Math.max(300, windowHeight - 340),
        baseUnit: trackUnitSize,
      }),
    [visibleTracks.length, windowHeight, trackUnitSize]
  );

  const dimmedTrackIds = useMemo(() => {
    const ids = new Set(mutedTracks);
    if (playbackScope === playbackScopes.single && selectedPlaybackTrackId) {
      visibleTracks.forEach((track) => {
        if (track.id !== selectedPlaybackTrackId) ids.add(track.id);
      });
    }
    return ids;
  }, [mutedTracks, playbackScope, selectedPlaybackTrackId, visibleTracks]);

  const canvasLanes = useMemo(
    () =>
      visibleTracks.map((track) => ({
        id: track.id,
        notes: track.notes,
        dimmed: dimmedTrackIds.has(track.id),
      })),
    [visibleTracks, dimmedTrackIds]
  );

  function getMaxScrollLeft() {
    const params = renderParamsRef.current!;
    const { pitch } = params.layout;
    return Math.max(0, tickToX(timelineUnitCount, pitch) - params.width);
  }

  function drawFrame() {
    const canvas = canvasRef.current;
    const params = renderParamsRef.current;
    if (!canvas || !params || params.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const { layout: laneLayout, width, lanes, showColor: color, showNumber: number, showSupport: support } = params;
    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(laneLayout.height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    if (!spritesRef.current) spritesRef.current = createSpriteStore(requestDraw);

    const scrollLeft = scrollLeftRef.current;
    renderTracks(canvas.getContext('2d')!, {
      lanes,
      view: { ...laneLayout, width, scrollLeft },
      opts: { showColor: color, showNumber: number, showSupport: support },
      sprites: spritesRef.current!,
      dpr,
    });

    const playhead = playheadRef.current;
    if (playhead) {
      const x = tickToX(playheadTickRef.current, laneLayout.pitch) - scrollLeft;
      const inView = x >= -10 && x <= width + 10;
      playhead.style.visibility = inView ? 'visible' : 'hidden';
      playhead.style.left = `${x}px`;
    }
  }

  function requestDraw() {
    if (drawFrameRef.current) return;
    drawFrameRef.current = window.requestAnimationFrame(() => {
      drawFrameRef.current = 0;
      drawFrameLatestRef.current();
    });
  }

  const drawFrameLatestRef = useRef(drawFrame);
  drawFrameLatestRef.current = drawFrame;
  const getMaxScrollLeftLatestRef = useRef(getMaxScrollLeft);
  getMaxScrollLeftLatestRef.current = getMaxScrollLeft;
  renderParamsRef.current = {
    layout,
    width: canvasWidth,
    lanes: canvasLanes,
    showColor,
    showNumber,
    showSupport,
  };

  useEffect(() => {
    requestDraw();
  }, [layout, canvasWidth, canvasLanes, showColor, showNumber, showSupport, tracksOpen]);

  useEffect(() => {
    playbackNotesRef.current = playbackNotes;
    playbackEndTickRef.current = playbackEndTick;
  }, [playbackEndTick, playbackNotes]);

  useEffect(() => {
    mutedTracksRef.current = mutedTracks;
  }, [mutedTracks]);

  function clearPlaybackTimers() {
    if (playbackAnimationFrameRef.current) {
      window.cancelAnimationFrame(playbackAnimationFrameRef.current);
      playbackAnimationFrameRef.current = 0;
    }
    if (playbackSchedulerRef.current) {
      window.clearInterval(playbackSchedulerRef.current);
      playbackSchedulerRef.current = 0;
    }
  }

  function syncViewportToTick(
    nextTick: number,
    { follow = 'anchor' }: { follow?: 'anchor' | 'visible' } = {}
  ) {
    const params = renderParamsRef.current;
    if (!params || params.width === 0) return;

    const { pitch } = params.layout;
    const contentX = tickToX(nextTick, pitch);
    const maxScrollLeft = getMaxScrollLeft();

    if (follow === 'anchor') {
      const anchorX = Math.max(pitch * 2, params.width * 0.3);
      scrollLeftRef.current = Math.min(maxScrollLeft, Math.max(0, contentX - anchorX));
    } else {
      // Only pan when the playhead leaves the visible area (e.g. while dragging).
      const margin = pitch * 2;
      const left = scrollLeftRef.current;
      if (contentX < left + margin) {
        scrollLeftRef.current = Math.min(maxScrollLeft, Math.max(0, contentX - margin));
      } else if (contentX > left + params.width - margin) {
        scrollLeftRef.current = Math.min(maxScrollLeft, Math.max(0, contentX - params.width + margin));
      }
    }
  }

  function setPlayheadPosition(
    nextTick: number,
    {
      syncState = false,
      syncScroll = false,
      follow,
      draw = true,
    }: { syncState?: boolean; syncScroll?: boolean; follow?: 'anchor' | 'visible'; draw?: boolean } = {}
  ) {
    const clampedTick = Math.max(0, nextTick);
    playheadTickRef.current = clampedTick;

    if (syncState) {
      setPlayheadTick(clampedTick);
    }

    if (syncScroll) {
      syncViewportToTick(clampedTick, { follow });
    }

    if (draw) requestDraw();
  }

  const onPlayheadKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 10 : 1;
    const current = Math.round(playheadTickRef.current);
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
    else if (event.key === 'PageUp') next = current + 50;
    else if (event.key === 'PageDown') next = current - 50;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = maxVisibleTick;
    if (next === null) return;
    event.preventDefault();
    setPlayheadPosition(Math.min(maxVisibleTick, Math.max(0, next)), { syncState: true, syncScroll: true });
  };

  const onCanvasKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const page = Math.max(80, canvasWidth * 0.8);
    const delta =
      event.key === 'ArrowRight' ? 60
      : event.key === 'ArrowLeft' ? -60
      : event.key === 'PageDown' ? page
      : event.key === 'PageUp' ? -page
      : event.key === 'End' ? Infinity
      : event.key === 'Home' ? -Infinity
      : 0;
    if (delta === 0) return;
    event.preventDefault();
    scrollLeftRef.current = Math.min(getMaxScrollLeft(), Math.max(0, scrollLeftRef.current + delta));
    requestDraw();
  };

  function stopPlayback(nextTick?: number) {
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

    // Notes are booked on the audio clock a little ahead of time, so main-thread
    // stalls can't delay or bunch them. The same clock drives the playhead.
    const audioNow = getAudioClock();
    const useAudioClock = audioNow !== null;
    const audioStart: number | null = useAudioClock ? audioNow + START_DELAY_S : null;
    playbackAudioStartRef.current = audioStart;
    playbackStartMsRef.current = performance.now() + START_DELAY_S * 1000;
    playbackStartTickRef.current = clampedStartTick;
    playbackCursorRef.current = findFirstNoteIndexAtOrAfter(
      playbackNotesRef.current,
      clampedStartTick
    );
    playbackLastStateSyncMsRef.current = 0;
    setIsPlaying(true);

    const tickDurationS = redstoneTickDurationMs / 1000;
    const elapsedSeconds = () =>
      useAudioClock
        ? (getAudioClock() ?? audioStart!) - audioStart!
        : (performance.now() - playbackStartMsRef.current) / 1000;

    const scheduleNotes = () => {
      const notes = playbackNotesRef.current;
      const horizonTick =
        playbackStartTickRef.current + (elapsedSeconds() + SCHEDULE_AHEAD_S) / tickDurationS;
      while (
        playbackCursorRef.current < notes.length &&
        notes[playbackCursorRef.current].startTick <= horizonTick + 0.0001
      ) {
        const note = notes[playbackCursorRef.current];
        if (!mutedTracksRef.current.has(note.trackId)) {
          const when = useAudioClock
            ? audioStart! + (note.startTick - playbackStartTickRef.current) * tickDurationS
            : undefined;
          playPlacementSoundSync(note, when);
        }
        playbackCursorRef.current += 1;
      }
    };

    const animationStep = () => {
      const nextTick = Math.min(
        playbackEndTickRef.current + 1,
        playbackStartTickRef.current + Math.max(0, elapsedSeconds()) / tickDurationS
      );

      scheduleNotes();

      const now = performance.now();
      const shouldSyncState =
        now - playbackLastStateSyncMsRef.current > 120 ||
        nextTick >= playbackEndTickRef.current + 1;

      setPlayheadPosition(nextTick, {
        syncState: shouldSyncState,
        syncScroll: true,
        draw: false,
      });
      drawFrameLatestRef.current();

      if (shouldSyncState) {
        playbackLastStateSyncMsRef.current = now;
      }

      if (nextTick >= playbackEndTickRef.current + 1) {
        stopPlayback(playbackEndTickRef.current + 1);
        return;
      }

      playbackAnimationFrameRef.current = window.requestAnimationFrame(animationStep);
    };

    scheduleNotes();
    playbackSchedulerRef.current = window.setInterval(scheduleNotes, SCHEDULER_INTERVAL_MS);
    playbackAnimationFrameRef.current = window.requestAnimationFrame(animationStep);
  }

  function finishPlayheadDrag() {
    playheadDragRef.current = {
      active: false,
      pointerId: null,
      grabOffsetTicks: 0,
    };
    setPlayheadDragging(false);
  }

  function pointerToTick(clientX: number) {
    const rect = canvasWrapRef.current!.getBoundingClientRect();
    const { pitch } = renderParamsRef.current!.layout;
    return (clientX - rect.left + scrollLeftRef.current - tickToX(0, pitch)) / pitch;
  }

  const onPlayheadPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (visibleTracks.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    stopPlayback();
    playheadDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      grabOffsetTicks: playheadTickRef.current - pointerToTick(event.clientX),
    };
    setPlayheadDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPlayheadPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (
      !playheadDragRef.current.active ||
      playheadDragRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    event.preventDefault();
    const nextTick = Math.min(
      maxVisibleTick + 1,
      pointerToTick(event.clientX) + playheadDragRef.current.grabOffsetTicks
    );
    setPlayheadPosition(nextTick, {
      syncState: true,
      syncScroll: true,
      follow: 'visible',
    });
  };

  const onPlayheadPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (playheadDragRef.current.pointerId !== event.pointerId) return;
    finishPlayheadDrag();
  };

  function getCanvasPoint(event: { clientX: number; clientY: number }) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function hitTestAt(event: { clientX: number; clientY: number }) {
    const params = renderParamsRef.current!;
    const { x, y } = getCanvasPoint(event);
    return hitTest({
      lanes: params.lanes,
      view: { ...params.layout, width: params.width, scrollLeft: scrollLeftRef.current },
      opts: { showSupport: params.showSupport },
      x,
      y,
    });
  }

  function hideTooltip() {
    if (hoveredKeyRef.current === null) return;
    hoveredKeyRef.current = null;
    setTooltip(null);
  }

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    canvasPanRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: scrollLeftRef.current,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const pan = canvasPanRef.current;
    if (pan.pointerId === event.pointerId) {
      const deltaX = event.clientX - pan.startX;
      if (!pan.moved && Math.abs(deltaX) < 4) return;
      pan.moved = true;
      hideTooltip();
      scrollLeftRef.current = Math.min(getMaxScrollLeft(), Math.max(0, pan.startScroll - deltaX));
      requestDraw();
      return;
    }

    if (event.pointerType !== 'mouse') return;
    const hit = hitTestAt(event);
    if (!hit) {
      hideTooltip();
      return;
    }
    if (hit.key === hoveredKeyRef.current) return;
    hoveredKeyRef.current = hit.key;
    const wrapWidth = renderParamsRef.current!.width;
    const below = hit.y < 140;
    setTooltip({
      lines: getNoteTooltipLines(hit.placement),
      left: Math.min(wrapWidth - 90, Math.max(90, hit.x + hit.width / 2)),
      top: below ? hit.y + hit.height : hit.y,
      below,
    });
  };

  const onCanvasPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const pan = canvasPanRef.current;
    if (pan.pointerId !== event.pointerId) return;
    canvasPanRef.current = { pointerId: null, startX: 0, startScroll: 0, moved: false };
    if (pan.moved) return;
    const hit = hitTestAt(event);
    if (hit) void playPlacementSound(hit.placement);
  };

  const onCanvasPointerCancel = () => {
    canvasPanRef.current = { pointerId: null, startX: 0, startScroll: 0, moved: false };
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--track-unit-size', `${trackUnitSize}px`);
  }, [trackUnitSize]);

  useEffect(() => {
    const syncTrackUnitSize = () => {
      setTrackUnitSize(window.innerWidth <= 700 ? 30 : 34);
      setWindowHeight(window.innerHeight);
    };

    syncTrackUnitSize();
    window.addEventListener('resize', syncTrackUnitSize);

    return () => {
      window.removeEventListener('resize', syncTrackUnitSize);
      clearPlaybackTimers();
      if (drawFrameRef.current) window.cancelAnimationFrame(drawFrameRef.current);
      drawFrameRef.current = 0;
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
  }, [timelineUnitCount, trackUnitSize, canvasWidth]);

  useEffect(() => {
    if (isPlaying) {
      stopPlayback();
    }
  }, [playbackNotes]);

  useEffect(() => {
    if (!tracksOpen) return;
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    setCanvasWidth(Math.floor(wrap.clientWidth));
    const observer = new ResizeObserver(([entry]) => {
      setCanvasWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(wrap);

    // Horizontal wheel/trackpad gestures pan the timeline; vertical wheel still scrolls the page.
    const onWheel = (event: WheelEvent) => {
      const horizontal = event.shiftKey ? event.deltaY : event.deltaX;
      if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      scrollLeftRef.current = Math.min(getMaxScrollLeftLatestRef.current(), Math.max(0, scrollLeftRef.current + horizontal));
      requestDraw();
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      observer.disconnect();
      wrap.removeEventListener('wheel', onWheel);
    };
  }, [tracksOpen]);


  return (
    <CollapsiblePanel
      title="3) Track Visualization"
      meta={
        visibleTracks.length === 0
          ? 'No tracks yet'
          : tracksOpen
            ? 'Hide'
            : `Show ${visibleTracks.length} lane(s)`
      }
      open={tracksOpen}
      onOpenChange={(v) => { if (visibleTracks.length > 0) setTracksOpen(v); }}
      disabled={visibleTracks.length === 0}
      className="visualization"
    >
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
              stopPlayback(0);
            }} disabled={visibleTracks.length === 0} aria-label="Go to start">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1" ry="1" /></svg>
            </button>
          </div>
          <div className="playback-meta">Position: {playheadTick.toFixed(1)} ticks</div>
        </div>
        <div className="viz-toggles">
          <label className="option-row option-row-stacked">
            <span>Group by</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              disabled={visibleTracks.length === 0 && trackEvents.length === 0}
            >
              <option value={viewModes.instrument}>Instrument</option>
              <option value={viewModes.track}>Original tracks</option>
            </select>
          </label>
          <label className="viz-toggle-label">
            <input type="checkbox" checked={showColor} onChange={(e) => setShowColor(e.target.checked)} />
            Color
          </label>
          <label className="viz-toggle-label">
            <input type="checkbox" checked={showNumber} onChange={(e) => setShowNumber(e.target.checked)} />
            Number
          </label>
          <label className="viz-toggle-label">
            <input type="checkbox" checked={showSupport} onChange={(e) => setShowSupport(e.target.checked)} />
            Support
          </label>
        </div>
        <p className="hint output-summary">
          {visibleTracks.length === 0
            ? 'No tracks to visualize.'
            : `${visibleTracks.length} ${viewMode === viewModes.track ? 'track' : 'instrument'} lane(s) ready. Drag or scroll horizontally for long tracks.`}
        </p>
        <div className="track-area" style={{ '--lane-gap': `${LANE_GAP}px` } as CSSProperties}>
              <div className="track-headers">
                {visibleTracks.map((track) => (
                  <div
                    key={track.id}
                    className={dimmedTrackIds.has(track.id) && !mutedTracks.has(track.id) ? 'track-header track-row-dimmed' : 'track-header'}
                    style={{ height: `${layout.laneHeight}px` }}
                  >
                    <button
                      type="button"
                      className="icon-btn track-mute-btn"
                      title={mutedTracks.has(track.id) ? 'Unmute' : 'Mute'}
                      onClick={(e) => { e.stopPropagation(); toggleMuteCallbacks.get(track.id)?.(); }}
                      onPointerDown={(e) => e.stopPropagation()}
                      aria-label={`${mutedTracks.has(track.id) ? 'Unmute' : 'Mute'} ${track.title}`}
                      aria-pressed={mutedTracks.has(track.id)}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        {mutedTracks.has(track.id) ? (
                          <path d="M 3 3 L 13 13 M 13 3 L 3 13" stroke="currentColor" strokeWidth="2" fill="none" />
                        ) : (
                          <>
                            <path d="M 3 5 L 8 2 L 8 14 L 3 11 Z" fill="currentColor" />
                            <path d="M 10 4 Q 12 6 12 8 Q 12 10 10 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          </>
                        )}
                      </svg>
                    </button>
                    <span className="track-header-text">
                      <span className="track-index">{track.title}</span>
                      <span className="track-count">{track.subtitle}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="track-canvas-wrap"
                ref={canvasWrapRef}
                style={{ height: `${layout.height}px` }}
              >
                <canvas
                  ref={canvasRef}
                  className="track-canvas"
                  role="img"
                  tabIndex={0}
                  onKeyDown={onCanvasKeyDown}
                  aria-label={`Track visualization with ${visibleTracks.length} lane(s). ${visibleTracks.map((t) => `${t.title}: ${t.subtitle}`).join('; ')}. Use left and right arrow keys to pan, and the play position slider to seek.`}
                  onPointerDown={onCanvasPointerDown}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={onCanvasPointerUp}
                  onPointerCancel={onCanvasPointerCancel}
                  onPointerLeave={hideTooltip}
                />
                <button
                  ref={playheadRef}
                  type="button"
                  className={playheadDragging ? 'playhead playhead-dragging' : 'playhead'}
                  style={{ left: '0px' }}
                  onPointerDown={onPlayheadPointerDown}
                  onPointerMove={onPlayheadPointerMove}
                  onPointerUp={onPlayheadPointerUp}
                  onPointerCancel={finishPlayheadDrag}
                  onKeyDown={onPlayheadKeyDown}
                  role="slider"
                  aria-label="Play position"
                  aria-orientation="horizontal"
                  aria-valuemin={0}
                  aria-valuemax={maxVisibleTick}
                  aria-valuenow={Math.round(playheadTick)}
                  aria-valuetext={`Tick ${Math.round(playheadTick)} of ${maxVisibleTick}`}
                >
                  <span className="playhead-line" aria-hidden="true" />
                  <span className="playhead-head" aria-hidden="true" />
                </button>
                {tooltip ? (
                  <div
                    className={tooltip.below ? 'canvas-tooltip canvas-tooltip-below' : 'canvas-tooltip'}
                    style={{ left: `${tooltip.left}px`, top: `${tooltip.top}px` }}
                    role="tooltip"
                  >
                    {tooltip.lines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ) : null}
              </div>
          </div>
    </CollapsiblePanel>
  );
}
