import CollapsiblePanel from '@components/common/CollapsiblePanel';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { useContainerWidth } from '@hooks/useContainerWidth';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useEffect, useMemo, useRef, useState } from 'react';
import HowToWireTutorial from './HowToWireTutorial';
import SchematicGrid from './SchematicGrid';
import { blockColor, blockLabel } from './schematicData';

import type { TrackEvent, TracksByInstrumentLane } from '../../midi/trackEvents';

interface SchematicPanelProps {
  trackEvents?: TrackEvent[] | TracksByInstrumentLane[];
  busy?: boolean;
}

export interface InstrumentGrid {
  instruments: any[];
  anchors: Anchor[];
}

export interface Anchor {
  tick: number;
  type: 'harmonic' | 'split';
  sourceTrackIndex: number;
  targetTrackIndex: number;
}

export default function SchematicPanel({ trackEvents, busy }: SchematicPanelProps) {
  const [open, setOpen] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const parentWidth = useContainerWidth(panelRef);
  // console.log('SchematicPanel parentWidth (CollapsiblePanel wrapper)', parentWidth);

  // Utility: convert TracksByInstrumentLane[] to schematic instrument objects with .cells
  function convertTracksToSchematicInstruments(tracks: TracksByInstrumentLane[]): any[] {
    // TODO: i think we can get rid of this conversion, because the tracks are already in the right format for schematic rendering (just need to update SchematicGrid to handle both .events and .cells formats). For now, this is a quick way to reuse the existing SchematicGrid without refactoring it.
    if (!Array.isArray(tracks)) return [];
    return tracks.map((track, idx) => {
      // Convert InstrumentLaneEvent[] to .cells array for schematic rendering
      const cells: {
        type: string;
        ticks?: number;
        note?: number;
        pitch?: string;
        instrument?: string;
        block?: string;
        key: string;
      }[] = [];
      track.events.forEach((event, i) => {
        if (event.repeaterTicks) {
          // Add one repeater cell for each event.repeaterTicks.
          let ticks = event.repeaterTicks;
          const t = Math.min(ticks, 4);
          cells.push({ type: 'repeater', ticks: t, key: `rep-${i}-${t}` });
          ticks -= t;
        }
        if (event.emptySpace) {
          cells.push({ type: 'empty', key: `empty-${i}` });
        }
        if (event.redstone) {
          cells.push({ type: 'dust', key: `dust-${i}` });
        }
        if (event.split) {
          cells.push({ type: 'split', key: `split-${i}` });
        }
        if (event.note) {
          cells.push({
            type: 'note',
            note: event.note.note,
            pitch: event.note.pitch,
            instrument: event.note.instrument,
            block: event.note.block,
            key: `note-${i}`,
          });
        }
      });
      return {
        title: `${track.instrument} lane ${track.lane}`,
        instrument: track.instrument,
        lane: track.lane,
        cells,
      };
    });
  }

  // Accept both legacy TrackEvent[] and new TracksByInstrumentLane[]
  const grid = useMemo<InstrumentGrid>(() => {
    // console.log('trackEvents for grid', trackEvents);
    if (!Array.isArray(trackEvents)) return { instruments: [], anchors: [] };
    // Heuristic: if first element has .events (array of InstrumentLaneEvent), treat as new format
    if (trackEvents.length > 0 && (trackEvents[0] as any).events) {
      return {
        instruments: convertTracksToSchematicInstruments(trackEvents as TracksByInstrumentLane[]),
        anchors: [],
      };
    }
    // Otherwise, assume legacy format
    return { instruments: trackEvents as TrackEvent[], anchors: [] };
  }, [trackEvents]);

  const processing = false;

  // Defensive: fallback for new grid shape (canvas/cells)
  const totalNotes = useMemo(() => {
    if (!Array.isArray(grid?.instruments)) return 0;
    // New grid shape: count note cells
    return grid.instruments.reduce(
      (s: number, inst: any) =>
        s +
        (Array.isArray(inst.cells) ? inst.cells.filter((c: any) => c.type === 'note').length : 0),
      0,
    );
  }, [grid]);

  const totalRows = useMemo(() => {
    if (!Array.isArray(grid?.instruments)) return 0;
    // New grid shape: 1 row per instrument
    return grid.instruments.length;
  }, [grid]);

  const hasData = Array.isArray(trackEvents) && trackEvents.length > 0;

  useEffect(() => {
    if (hasData) setOpen(true);
  }, [hasData]);

  return (
    <ErrorBoundary>
      <Box sx={{ position: 'relative' }}>
        <div ref={panelRef} style={{ width: '100%' }}>
          <CollapsiblePanel
            title="4) Build Schematic (Top-Down)"
            meta={
              processing || !grid || busy
                ? 'Processing...'
                : !hasData
                  ? 'No tracks yet'
                  : open
                    ? 'Hide'
                    : `Show ${totalRows} lane(s), ${totalNotes} note(s)`
            }
            open={open}
            onOpenChange={(v) => {
              if (hasData) setOpen(v);
            }}
            disabled={!hasData}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>Cell size</span>
                <Select
                  value={cellSize}
                  onChange={(e) => setCellSize(Number(e.target.value))}
                  size="small"
                  sx={{ minWidth: 120, bgcolor: '#fff', '& .MuiSelect-select': { py: 1 } }}
                >
                  <MenuItem value={20}>Small (20px)</MenuItem>
                  <MenuItem value={28}>Medium (28px)</MenuItem>
                  <MenuItem value={36}>Large (36px)</MenuItem>
                  <MenuItem value={48}>XL (48px)</MenuItem>
                </Select>
              </Box>
            </Box>

            <Box sx={{ mb: 2, color: 'text.secondary', fontSize: '0.95rem' }}>
              Top-down schematic. Background color = instrument block. Each repeater shows its
              individual delay setting (1–4 t). Tracks starting later include leading repeaters.
              Harmonics are connected by a vertical redstone rail on the left. An orange T-junction
              cell marks where a lane branches off another lane to save repeaters. Click any note
              block to highlight it as your last-placed position.
            </Box>

            {/* Tutorial */}
            <HowToWireTutorial />

            {/* Legend */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {Object.entries(blockColor).map(([blockId, color]) => (
                <Box key={blockId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 18,
                      height: 18,
                      borderRadius: 3,
                      background: color,
                      marginRight: 6,
                    }}
                  />
                  <span>{blockLabel(blockId)}</span>
                </Box>
              ))}
            </Box>

            {/* <BlocksNeededSummary grid={grid} /> */}

            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              {grid?.instruments?.length === 0 ? (
                <p className="hint">No notes to display.</p>
              ) : (
                <SchematicGrid grid={grid} cellSize={cellSize} width={parentWidth} />
              )}
            </Box>
          </CollapsiblePanel>
        </div>
      </Box>
    </ErrorBoundary>
  );
}
