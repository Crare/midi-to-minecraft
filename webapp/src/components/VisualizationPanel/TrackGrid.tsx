import { useContainerWidth } from '@hooks/useContainerWidth';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        overflowX: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
        p: 1,
      }}
    >
      <Box>
        <Box ref={topScrollRef} sx={{ width: '100%' }}>
          <Box sx={{ width: timelineUnitCount * trackUnitSize }} aria-hidden="true" />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}>
          {visibleTracks.map((track: any, index: number) => (
            <Box
              key={track.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                opacity:
                  playbackScope === 'single' &&
                  selectedPlaybackTrackId &&
                  track.id !== selectedPlaybackTrackId
                    ? 0.5
                    : 1,
                py: 0.5,
                px: 1,
                borderBottom: '1px solid #eee',
              }}
            >
              <Button
                variant="contained"
                size="small"
                sx={{
                  minWidth: 32,
                  minHeight: 32,
                  bgcolor: '#3d5f22',
                  color: '#fff',
                  p: 1,
                  mr: 1,
                  borderRadius: 1,
                  minInlineSize: 0,
                  '&:hover': { bgcolor: '#49732a' },
                }}
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
                    draggable={false}
                    style={{ filter: 'invert(1) brightness(2)' }}
                  />
                ) : (
                  <img
                    src="assets/icons/unmute.svg"
                    width="16"
                    height="16"
                    alt="Unmuted"
                    aria-hidden="true"
                    draggable={false}
                    style={{ filter: 'invert(1) brightness(2)' }}
                  />
                )}
              </Button>
              <Box sx={{ fontWeight: 600, fontSize: 15 }}>{track.title}</Box>
              <Box sx={{ color: 'text.secondary', fontSize: 13 }}>{track.subtitle}</Box>
            </Box>
          ))}
        </Box>
        <button
          ref={playheadRef}
          type="button"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 10,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
          className={playheadDragging ? 'playhead playhead-dragging' : 'playhead'}
          onPointerDown={onPlayheadPointerDown}
          onPointerMove={onPlayheadPointerMove}
          onPointerUp={onPlayheadPointerUp}
          onPointerCancel={finishPlayheadDrag}
          aria-label="Drag play position"
        >
          <span className="playhead-line" aria-hidden="true" />
          <span className="playhead-head" aria-hidden="true" />
        </button>
        <Box
          sx={{
            width: scrollContainerWidth,
            maxWidth: scrollContainerWidth,
            overflowX: 'auto',
            position: 'relative',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 0,
            mt: 1,
          }}
        >
          <Box>
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
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
