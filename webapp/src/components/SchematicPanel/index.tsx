import CollapsiblePanel from '@components/common/CollapsiblePanel';
import ErrorBoundary from '@components/common/ErrorBoundary';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildTickGridAsync } from '../../workers/tickGridWorkerClient';
import BlocksNeededSummary from './BlocksNeededSummary';
import HowToWireTutorial from './HowToWireTutorial';
import SchematicGrid from './SchematicGrid';
import { blockColor, blockLabel } from './schematicData';

interface SchematicPanelProps {
  trackEvents: any[];
  busy?: boolean;
}

export default function SchematicPanel({ trackEvents, busy }: SchematicPanelProps) {
  const [open, setOpen] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const [processing, setProcessing] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);

  const [grid, setGrid] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setProcessing(true);
    buildTickGridAsync(trackEvents)
      .then((result) => {
        if (!cancelled) {
          setGrid(result);
          setProcessing(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setGrid({ instruments: [], anchors: [], error: err.message });
          setProcessing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [trackEvents]);

  // console.log('trackEvents', trackEvents);
  // console.log('grid', grid);

  const totalNotes = useMemo(
    () =>
      Array.isArray(grid?.instruments)
        ? grid.instruments.reduce(
            (s: number, inst: any) =>
              s +
              inst.rows.reduce(
                (rs: number, row: any) =>
                  rs + row.anchorCells.filter((c: any) => c.kind === 'note' && c.note).length,
                0,
              ),
            0,
          )
        : 0,
    [grid],
  );
  const totalRows = useMemo(
    () =>
      Array.isArray(grid?.instruments)
        ? grid.instruments.reduce((s: number, inst: any) => s + inst.rows.length, 0)
        : 0,
    [grid],
  );

  const hasData = Array.isArray(trackEvents) && trackEvents.length > 0;

  useEffect(() => {
    if (hasData) setOpen(true);
  }, [hasData]);

  return (
    <ErrorBoundary>
      <Box sx={{ position: 'relative' }}>
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

          <BlocksNeededSummary grid={grid} />

          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <div ref={contentRef} className="schematic-content">
              {grid?.instruments?.length === 0 ? (
                <p className="hint">No notes to display.</p>
              ) : (
                <SchematicGrid grid={grid} cellSize={cellSize} />
              )}
            </div>
          </Box>
        </CollapsiblePanel>
      </Box>
    </ErrorBoundary>
  );
}
