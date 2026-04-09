import React from 'react';
import { Grid } from 'react-window';
import { TrackRowGridCell } from './TrackRowGridCell';

interface TrackGridProps {
  visibleTracks: any[];
  mutedTracks: Set<string>;
  showColor: boolean;
  showNumber: boolean;
  showSupport: boolean;
  trackUnitSize: number;
  scrollContainerWidth: number;
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
  scrollContainerWidth,
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
  return (
    <div className="track-area">
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
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  {mutedTracks.has(track.id) ? (
                    <path
                      d="M 3 3 L 13 13 M 13 3 L 3 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  ) : (
                    <>
                      <path d="M 3 5 L 8 2 L 8 14 L 3 11 Z" fill="currentColor" />
                      <path
                        d="M 10 4 Q 12 6 12 8 Q 12 10 10 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </>
                  )}
                </svg>
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
          style={{ '--timeline-unit-count': timelineUnitCount } as React.CSSProperties}
        >
          <div className="track-wrap">
            {Array.isArray(visibleTracks) && visibleTracks.length > 0 && (
              <Grid
                columnCount={Math.max(...visibleTracks.map((t) => t.notes.length))}
                columnWidth={trackUnitSize + 2}
                style={{
                  height: Math.min(visibleTracks.length * 48, 400),
                  width: scrollContainerWidth,
                  overflowX: 'auto',
                }}
                rowCount={visibleTracks.length}
                rowHeight={48}
                cellComponent={TrackRowGridCell}
                cellProps={{
                  tracks: visibleTracks,
                  mutedTracks,
                  showColor,
                  showNumber,
                  showSupport,
                  trackUnitSize,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
