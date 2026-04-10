import { useContainerWidth } from '@hooks/useContainerWidth';
import React, { useRef } from 'react';
import { Grid } from 'react-window';
import TrackRowGridCell from './TrackRowGridCell';

interface TrackGridProps {
  visibleTracks: any[];
  mutedTracks: Set<string>;
  showColor: boolean;
  showNumber: boolean;
  showSupport: boolean;
  trackUnitSize: number;
  timelineUnitCount: number;
  trackScrollRef: React.RefObject<HTMLDivElement>;
  topScrollRef: React.RefObject<HTMLDivElement>;
  playheadRef: React.RefObject<HTMLButtonElement>;
  playheadDragging: boolean;
  onPlayheadPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPlayheadPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPlayheadPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
  finishPlayheadDrag: () => void;
  playbackScope: string;
  selectedPlaybackTrackId: string;
  toggleMuteCallbacks: Map<string, () => void>;
}

export default function TrackGrid({
  visibleTracks,
  mutedTracks,
  showColor,
  showNumber,
  showSupport,
  trackUnitSize,
  timelineUnitCount,
  trackScrollRef,
  topScrollRef,
  playheadRef,
  playheadDragging,
  onPlayheadPointerDown,
  onPlayheadPointerMove,
  onPlayheadPointerUp,
  finishPlayheadDrag,
  playbackScope,
  selectedPlaybackTrackId,
  toggleMuteCallbacks,
}: TrackGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerWidth = useContainerWidth(containerRef);
  // Max columns we’ll ever render — cap based on screen width and unit size
  const maxColumns = Math.floor(scrollContainerWidth / (trackUnitSize + 2));
  const effectiveColumnCount = Math.min(
    timelineUnitCount,
    maxColumns, // Prevent massive horizontal overflow!
  );

  // console.log('visibleTracks', visibleTracks);

  return (
    <div className="track-area" ref={containerRef}>
      <div className="track-scroll-column">
        <div className="track-scroll-proxy-top" ref={topScrollRef}>
          <div
            className="track-scroll-spacer"
            style={{ width: `${timelineUnitCount * trackUnitSize}px` }}
          />
        </div>
        <div className="track-headers">
          {visibleTracks.map((track: any, index: number) => (
            <div
              key={track.id}
              className={
                playbackScope === 'single' &&
                selectedPlaybackTrackId &&
                track.id !== selectedPlaybackTrackId
                  ? 'track-header track-row-dimmed'
                  : 'track-header'
              }
            >
              <button
                type="button"
                className="icon-btn track-mute-btn"
                title={mutedTracks.has(track.id) ? 'Unmute' : 'Mute'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMuteCallbacks.get(track.id)?.();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label={mutedTracks.has(track.id) ? 'Unmute track' : 'Mute track'}
              >
                {mutedTracks.has(track.id) ? (
                  <img
                    src="assets/icons/mute.svg"
                    width="16"
                    height="16"
                    alt="Muted"
                    aria-hidden="true"
                  />
                ) : (
                  <img
                    src="assets/icons/unmute.svg"
                    width="16"
                    height="16"
                    alt="Unmuted"
                    aria-hidden="true"
                  />
                )}
              </button>
              <span className="track-index">{track.title}</span>
              <span className="track-count">{track.subtitle}</span>
            </div>
          ))}
        </div>
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
        <div
          className="track-stage"
          style={
            {
              '--timeline-unit-count': timelineUnitCount,
              width: scrollContainerWidth, // Keep this from parent
              maxWidth: `${scrollContainerWidth}px`,
              overflowX: 'auto',
              scrollbarWidth: 'none', // Remove scrollbar if needed
            } as React.CSSProperties
          }
        >
          <div className="track-wrap">
            {Array.isArray(visibleTracks) && visibleTracks.length > 0 && (
              <Grid
                columnCount={timelineUnitCount}
                columnWidth={trackUnitSize + 2}
                style={{
                  height: visibleTracks.length * 48 + 16,
                  width: scrollContainerWidth,
                  overflowX: 'auto',
                }}
                rowCount={visibleTracks.length}
                rowHeight={48}
                cellComponent={TrackRowGridCell}
                cellProps={{
                  cellProps: {
                    tracks: visibleTracks,
                    mutedTracks,
                    showColor,
                    showNumber,
                    showSupport,
                    trackUnitSize,
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
