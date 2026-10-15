import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { TrackEvents } from '../../types';
import CollapsiblePanel from '../CollapsiblePanel';
import { LANE_GAP, computeLaneLayout } from './canvasRenderer';
import {
  playbackScopes,
  viewModes,
  redstoneTickDurationMs,
  buildVisualizationTracks,
  getMaxTrackTick,
} from './visualizationData';
import { useViewportMetrics } from './useViewportMetrics';
import { useTimelineCanvas } from './useTimelineCanvas';
import { usePlayback, type PlaybackNote } from './usePlayback';
import { usePlayheadControls } from './usePlayheadControls';

function formatDuration(seconds: number): string {
  const total = Math.max(0, seconds);
  const minutes = Math.floor(total / 60);
  const rest = total - minutes * 60;
  return `${minutes}:${rest.toFixed(1).padStart(4, '0')}`;
}

export default function VisualizationPanel({ trackEvents }: { trackEvents: TrackEvents[] }) {
  const [tracksOpen, setTracksOpen] = useState(false);
  const [showColor, setShowColor] = useState(true);
  const [showNumber, setShowNumber] = useState(true);
  const [showSupport, setShowSupport] = useState(true);
  const [viewMode, setViewMode] = useState(viewModes.instrument);
  const [playbackScope, setPlaybackScope] = useState(playbackScopes.all);
  const [selectedPlaybackTrackId, setSelectedPlaybackTrackId] = useState('');
  const [mutedTracks, setMutedTracks] = useState<Set<string>>(new Set());
  const { trackUnitSize, windowHeight } = useViewportMetrics();

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

  const playbackNotes = useMemo<PlaybackNote[]>(
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

  const canvas = useTimelineCanvas({
    layout,
    lanes: canvasLanes,
    timelineUnitCount,
    maxVisibleTick,
    trackUnitSize,
    tracksOpen,
    showColor,
    showNumber,
    showSupport,
  });
  const { playheadTick, setPlayheadPosition } = canvas;

  const { isPlaying, startPlayback, stopPlayback } = usePlayback({
    notes: playbackNotes,
    endTick: playbackEndTick,
    mutedTracks,
    playheadTickRef: canvas.playheadTickRef,
    setPlayheadPosition,
    setPlayheadTick: canvas.setPlayheadTick,
    drawNow: canvas.drawNow,
  });

  const playhead = usePlayheadControls({
    hasTracks: visibleTracks.length > 0,
    maxVisibleTick,
    playheadTickRef: canvas.playheadTickRef,
    setPlayheadPosition,
    pointerToTick: canvas.pointerToTick,
    stopPlayback,
  });

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
  }, [selectedPlaybackTrackId, visibleTracks, stopPlayback]);

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
          <div className="playback-meta">
            Position: {playheadTick.toFixed(1)} ticks ({formatDuration(playheadTick * redstoneTickDurationMs / 1000)})
          </div>
          <div className="playback-meta">
            Track length: {Math.ceil(maxVisibleTick)} ticks ({formatDuration(maxVisibleTick * redstoneTickDurationMs / 1000)})
          </div>
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
                ref={canvas.canvasWrapRef}
                style={{ height: `${layout.height}px` }}
              >
                <canvas
                  ref={canvas.canvasRef}
                  className="track-canvas"
                  role="img"
                  tabIndex={0}
                  {...canvas.canvasHandlers}
                  aria-label={`Track visualization with ${visibleTracks.length} lane(s). ${visibleTracks.map((t) => `${t.title}: ${t.subtitle}`).join('; ')}. Use left and right arrow keys to pan, and the play position slider to seek.`}
                />
                <button
                  ref={canvas.playheadRef}
                  type="button"
                  className={playhead.dragging ? 'playhead playhead-dragging' : 'playhead'}
                  style={{ left: '0px' }}
                  {...playhead.handlers}
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
                {canvas.tooltip ? (
                  <div
                    className={canvas.tooltip.below ? 'canvas-tooltip canvas-tooltip-below' : 'canvas-tooltip'}
                    style={{ left: `${canvas.tooltip.left}px`, top: `${canvas.tooltip.top}px` }}
                    role="tooltip"
                  >
                    {canvas.tooltip.lines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                ) : null}
              </div>
          </div>
    </CollapsiblePanel>
  );
}
