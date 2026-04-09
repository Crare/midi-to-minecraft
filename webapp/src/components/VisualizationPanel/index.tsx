import { playPlacementSoundSync, prepareAudioPlayback } from '@audio/noteblockAudio';
import CollapsiblePanel from '@components/common/CollapsiblePanel';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { useEffect, useMemo, useRef, useState } from 'react';
import PlaybackControls from './PlaybackControls';
import TrackGrid from './TrackGrid';
import {
  buildVisualizationTracks,
  findFirstNoteIndexAtOrAfter,
  getMaxTrackTick,
  playbackScopes,
  redstoneTickDurationMs,
  viewModes,
} from './visualizationData';
import VisualizationOptions from './VisualizationOptions';

interface VisualizationPanelProps {
  trackEvents: any[];
}

export default function VisualizationPanel({ trackEvents }: VisualizationPanelProps) {
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
  const [mutedTracks, setMutedTracks] = useState(new Set<string>());
  const mutedTracksRef = useRef(mutedTracks);
  const [trackUnitSize, setTrackUnitSize] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 700 ? 30 : 34,
  );

  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollContainerWidth, setScrollContainerWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  const scrollRafRef = useRef(0);

  const trackScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = useRef(false);
  const playheadRef = useRef<HTMLButtonElement>(null);
  const playheadDragRef = useRef({
    active: false,
    pointerId: null as null | number,
    startClientX: 0,
    startTick: 0,
  });
  const playheadTickRef = useRef(0);
  const playbackNotesRef = useRef<any[]>([]);
  const playbackEndTickRef = useRef(0);
  const playbackCursorRef = useRef(0);
  const playbackLastStateSyncMsRef = useRef(0);
  const playbackAnimationFrameRef = useRef(0);
  const playbackStartMsRef = useRef(0);
  const playbackStartTickRef = useRef(0);

  const visibleTracks = useMemo(() => {
    const safeEvents = Array.isArray(trackEvents) ? trackEvents : [];
    const tracks = buildVisualizationTracks(safeEvents, viewMode);
    return Array.isArray(tracks)
      ? tracks.filter((track: any) => Array.isArray(track.notes) && track.notes.length > 0)
      : [];
  }, [trackEvents, viewMode]);

  const playbackTracks = useMemo(() => {
    if (playbackScope === playbackScopes.single && selectedPlaybackTrackId) {
      return visibleTracks.filter((track: any) => track.id === selectedPlaybackTrackId);
    }
    return visibleTracks;
  }, [playbackScope, selectedPlaybackTrackId, visibleTracks]);

  const playbackNotes = useMemo(
    () =>
      playbackTracks
        .flatMap((track: any) =>
          track.notes.flatMap((notePos: any) =>
            notePos.placements.map((p: any) => ({
              ...p,
              startTick: notePos.startTick,
              trackId: track.id,
            })),
          ),
        )
        .sort(
          (left: any, right: any) => left.startTick - right.startTick || left.note - right.note,
        ),
    [playbackTracks],
  );

  const toggleMuteCallbacks = useMemo(() => {
    const map = new Map();
    visibleTracks.forEach((track: any) => {
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

  const timelineUnitCount = useMemo(() => {
    const visualUnits = visibleTracks.reduce(
      (maxUnits: number, track: any) =>
        Math.max(
          maxUnits,
          track.notes.reduce((total: number, note: any) => total + note.redstoneTickDelay + 1, 0),
        ),
      0,
    );
    return Math.max(visualUnits, Math.ceil(maxVisibleTick) + 2, 1);
  }, [maxVisibleTick, visibleTracks]);

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
  }

  function syncViewportToTick(nextTick: number) {
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

  function setPlayheadPosition(
    nextTick: number,
    { syncState = false, syncScroll = false }: { syncState?: boolean; syncScroll?: boolean } = {},
  ) {
    const clampedTick = Math.max(0, nextTick);
    playheadTickRef.current = clampedTick;
    if (syncState) {
      setPlayheadTick(clampedTick);
    }
    if (syncScroll) {
      syncViewportToTick(clampedTick);
    }
  }

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
    playbackStartMsRef.current = performance.now();
    playbackStartTickRef.current = clampedStartTick;
    playbackCursorRef.current = findFirstNoteIndexAtOrAfter(
      playbackNotesRef.current,
      clampedStartTick,
    );
    playbackLastStateSyncMsRef.current = 0;
    setIsPlaying(true);
    const animationStep = () => {
      const elapsedTicks =
        (performance.now() - playbackStartMsRef.current) / redstoneTickDurationMs;
      const nextTick = Math.min(
        playbackEndTickRef.current + 1,
        playbackStartTickRef.current + elapsedTicks,
      );
      while (
        playbackCursorRef.current < playbackNotesRef.current.length &&
        playbackNotesRef.current[playbackCursorRef.current].startTick <= nextTick + 0.0001
      ) {
        const note = playbackNotesRef.current[playbackCursorRef.current];
        if (!mutedTracksRef.current.has(note.trackId)) {
          playPlacementSoundSync(note);
        }
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

  const onPlayheadPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
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

  const onPlayheadPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!playheadDragRef.current.active || playheadDragRef.current.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    const deltaTicks = (event.clientX - playheadDragRef.current.startClientX) / trackUnitSize;
    setPlayheadPosition(playheadDragRef.current.startTick + deltaTicks, {
      syncState: true,
      syncScroll: true,
    });
  };

  const onPlayheadPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (playheadDragRef.current.pointerId !== event.pointerId) return;
    finishPlayheadDrag();
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--track-unit-size', `${trackUnitSize}px`);
  }, [trackUnitSize]);

  useEffect(() => {
    const syncTrackUnitSize = () => {
      setTrackUnitSize(window.innerWidth <= 700 ? 30 : 34);
      const container = trackScrollRef.current;
      if (container) setScrollContainerWidth(container.clientWidth);
    };
    syncTrackUnitSize();
    window.addEventListener('resize', syncTrackUnitSize);
    return () => {
      window.removeEventListener('resize', syncTrackUnitSize);
      clearPlaybackTimers();
      if (scrollRafRef.current) window.cancelAnimationFrame(scrollRafRef.current);
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
    if (!visibleTracks.some((track: any) => track.id === selectedPlaybackTrackId)) {
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
    setScrollLeft(main.scrollLeft);
    setScrollContainerWidth(main.clientWidth);
    const syncScrollInfo = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        const c = trackScrollRef.current;
        if (c) {
          setScrollLeft(c.scrollLeft);
          setScrollContainerWidth(c.clientWidth);
        }
      });
    };
    const isSyncingScrollRef = { current: false };
    const syncToProxy = () => {
      if (isSyncingScrollRef.current) return;
      isSyncingScrollRef.current = true;
      proxy.scrollLeft = main.scrollLeft;
      isSyncingScrollRef.current = false;
      syncScrollInfo();
    };
    const syncToMain = () => {
      if (isSyncingScrollRef.current) return;
      isSyncingScrollRef.current = true;
      main.scrollLeft = proxy.scrollLeft;
      isSyncingScrollRef.current = false;
      syncScrollInfo();
    };
    main.addEventListener('scroll', syncToProxy, { passive: true });
    proxy.addEventListener('scroll', syncToMain, { passive: true });
    return () => {
      main.removeEventListener('scroll', syncToProxy);
      proxy.removeEventListener('scroll', syncToMain);
    };
  }, [tracksOpen]);

  return (
    <ErrorBoundary>
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
        onOpenChange={(v) => {
          if (visibleTracks.length > 0) setTracksOpen(v);
        }}
        disabled={visibleTracks.length === 0}
        className="visualization"
      >
        <PlaybackControls
          playbackScope={playbackScope}
          setPlaybackScope={setPlaybackScope}
          visibleTracks={visibleTracks}
          selectedPlaybackTrackId={selectedPlaybackTrackId}
          setSelectedPlaybackTrackId={setSelectedPlaybackTrackId}
          isPlaying={isPlaying}
          playheadTick={playheadTick}
          startPlayback={() => void startPlayback()}
          stopPlayback={stopPlayback}
        />
        <VisualizationOptions
          viewMode={viewMode}
          setViewMode={setViewMode}
          showColor={showColor}
          setShowColor={setShowColor}
          showNumber={showNumber}
          setShowNumber={setShowNumber}
          showSupport={showSupport}
          setShowSupport={setShowSupport}
          visibleTracks={visibleTracks}
          trackEvents={trackEvents}
          viewModes={viewModes}
        />
        <p className="hint output-summary">
          {visibleTracks.length === 0
            ? 'No tracks to visualize.'
            : `${visibleTracks.length} ${viewMode === viewModes.track ? 'track' : 'instrument'} lane(s) ready. Scroll horizontally for long tracks.`}
        </p>
        <TrackGrid
          visibleTracks={visibleTracks}
          mutedTracks={mutedTracks}
          showColor={showColor}
          showNumber={showNumber}
          showSupport={showSupport}
          trackUnitSize={trackUnitSize}
          scrollContainerWidth={scrollContainerWidth}
          timelineUnitCount={timelineUnitCount}
          trackScrollRef={trackScrollRef}
          topScrollRef={topScrollRef}
          playheadRef={playheadRef}
          playheadDragging={playheadDragging}
          onPlayheadPointerDown={onPlayheadPointerDown}
          onPlayheadPointerMove={onPlayheadPointerMove}
          onPlayheadPointerUp={onPlayheadPointerUp}
          finishPlayheadDrag={finishPlayheadDrag}
          playbackScope={playbackScope}
          selectedPlaybackTrackId={selectedPlaybackTrackId}
          toggleMuteCallbacks={toggleMuteCallbacks}
        />
      </CollapsiblePanel>
    </ErrorBoundary>
  );
}
