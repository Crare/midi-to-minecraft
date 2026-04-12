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

import type { TrackEvent } from '../../midi/trackEvents';

interface SchematicPanelProps {
  trackEvents?: TrackEvent[];
  busy?: boolean;
}

export interface InstrumentGrid {
  instruments: TrackEvent[];
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
  console.log('SchematicPanel parentWidth (CollapsiblePanel wrapper)', parentWidth);

  // Build schematic-ready data from trackEvents
  // Now, trackEvents is already schematic-ready data (array of instrument tracks)
  const grid = useMemo<InstrumentGrid>(
    () => ({ instruments: Array.isArray(trackEvents) ? trackEvents : [], anchors: [] }),
    [trackEvents],
  );
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
