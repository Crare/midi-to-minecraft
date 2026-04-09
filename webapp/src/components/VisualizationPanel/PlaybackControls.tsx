interface PlaybackControlsProps {
  playbackScope: string;
  setPlaybackScope: (v: string) => void;
  visibleTracks: any[];
  selectedPlaybackTrackId: string;
  setSelectedPlaybackTrackId: (v: string) => void;
  isPlaying: boolean;
  playheadTick: number;
  startPlayback: () => void;
  stopPlayback: (tick?: number) => void;
}

export default function PlaybackControls({
  playbackScope,
  setPlaybackScope,
  visibleTracks,
  selectedPlaybackTrackId,
  setSelectedPlaybackTrackId,
  isPlaying,
  playheadTick,
  startPlayback,
  stopPlayback,
}: PlaybackControlsProps) {
  return (
    <div className="playback-controls">
      <label className="option-row option-row-stacked">
        <span>Playback</span>
        <select
          value={playbackScope}
          onChange={(event) => setPlaybackScope(event.target.value)}
          disabled={visibleTracks.length === 0}
        >
          <option value="all">All tracks</option>
          <option value="single">Single track</option>
        </select>
      </label>
      {playbackScope === 'single' ? (
        <label className="option-row option-row-stacked">
          <span>Track</span>
          <select
            value={selectedPlaybackTrackId}
            onChange={(event) => setSelectedPlaybackTrackId(event.target.value)}
            disabled={visibleTracks.length === 0}
          >
            {visibleTracks.map((track: any) => (
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
          className="icon-btn"
          title="Play"
          onClick={startPlayback}
          disabled={visibleTracks.length === 0 || isPlaying}
          aria-label="Play"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <polygon points="3,1 15,8 3,15" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Stop"
          onClick={() => stopPlayback()}
          disabled={!isPlaying && playheadTick === 0}
          aria-label="Stop"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2" y="1" width="4" height="14" />
            <rect x="10" y="1" width="4" height="14" />
          </svg>
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Go to start"
          onClick={() => stopPlayback(0)}
          disabled={visibleTracks.length === 0}
          aria-label="Go to start"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2" y="2" width="12" height="12" rx="1" ry="1" />
          </svg>
        </button>
      </div>
      <div className="playback-meta">Position: {playheadTick.toFixed(1)} ticks</div>
    </div>
  );
}
