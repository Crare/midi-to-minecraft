import DragScrollArea from './DragScrollArea';
import TrackRow from './TrackRow';

export default function VisualizationPanel({
  visibleTracks,
  tracksOpen,
  groupTracksByInstrument,
  repeaterVisualizationMode,
  playbackScope,
  playbackScopes,
  selectedPlaybackTrackId,
  isPlaying,
  playheadTick,
  trackEvents,
  timelineUnitCount,
  playheadDragging,
  onToggle,
  onPlaybackScopeChange,
  onSelectedPlaybackTrackIdChange,
  onPlay,
  onStop,
  onPlayFromStart,
  onGroupTracksByInstrumentChange,
  onRepeaterVisualizationModeChange,
  onPlayheadPointerDown,
  onPlayheadPointerMove,
  onPlayheadPointerUp,
  onPlayheadPointerCancel,
  trackScrollRef,
  playheadRef,
  repeaterVisualizationModes,
}) {
  return (
    <section className="panel visualization">
      <button
        type="button"
        className="panel-header panel-header-toggle"
        onClick={onToggle}
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
              onChange={(event) => onPlaybackScopeChange(event.target.value)}
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
                onChange={(event) => onSelectedPlaybackTrackIdChange(event.target.value)}
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
            <button type="button" onClick={onPlay} disabled={visibleTracks.length === 0 || isPlaying}>
              Play
            </button>
            <button type="button" onClick={onStop} disabled={!isPlaying && playheadTick === 0}>
              Stop
            </button>
            <button type="button" onClick={onPlayFromStart} disabled={visibleTracks.length === 0}>
              From Start
            </button>
          </div>
          <div className="playback-meta">Position: {playheadTick.toFixed(1)} ticks</div>
        </div>
        <label className="option-row">
          <input
            type="checkbox"
            checked={groupTracksByInstrument}
            onChange={(event) => onGroupTracksByInstrumentChange(event.target.checked)}
            disabled={trackEvents.length === 0}
          />
          <span>Organize visualization by instrument</span>
        </label>
        <label className="option-row option-row-stacked">
          <span>Repeater visualization</span>
          <select
            value={repeaterVisualizationMode}
            onChange={(event) => onRepeaterVisualizationModeChange(event.target.value)}
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
          <DragScrollArea className="track-scroll-wrap" containerRef={trackScrollRef}>
            <button
              ref={playheadRef}
              type="button"
              className={playheadDragging ? 'playhead playhead-dragging' : 'playhead'}
              style={{ left: '0px' }}
              onPointerDown={onPlayheadPointerDown}
              onPointerMove={onPlayheadPointerMove}
              onPointerUp={onPlayheadPointerUp}
              onPointerCancel={onPlayheadPointerCancel}
              aria-label="Drag play position"
            >
              <span className="playhead-line" aria-hidden="true" />
              <span className="playhead-head" aria-hidden="true" />
            </button>
            <div className="track-stage" style={{ '--timeline-unit-count': timelineUnitCount }}>
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
  );
}
