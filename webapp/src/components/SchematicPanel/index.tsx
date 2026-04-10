import CollapsiblePanel from '@components/common/CollapsiblePanel';
import ErrorBoundary from '@components/common/ErrorBoundary';
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

  console.log('grid', grid);

  if (processing || !grid || busy) {
    return <span className="spinner spinner-large" aria-label="Processing Schematic" />;
  }

  return (
    <ErrorBoundary>
      <div style={{ position: 'relative' }}>
        <CollapsiblePanel
          title="4) Build Schematic (Top-Down)"
          meta={
            !hasData
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
          className="schematic-panel"
        >
          <div className="schematic-controls">
            <label className="option-row option-row-stacked">
              <span>Cell size</span>
              <select value={cellSize} onChange={(e) => setCellSize(Number(e.target.value))}>
                <option value={20}>Small (20px)</option>
                <option value={28}>Medium (28px)</option>
                <option value={36}>Large (36px)</option>
                <option value={48}>XL (48px)</option>
              </select>
            </label>
          </div>

          <p className="hint output-summary">
            Top-down schematic. Background color = instrument block. Each repeater shows its
            individual delay setting (1–4 t). Tracks starting later include leading repeaters.
            Harmonics are connected by a vertical redstone rail on the left. An orange T-junction
            cell marks where a lane branches off another lane to save repeaters. Click any note
            block to highlight it as your last-placed position.
          </p>

          {/* Tutorial */}
          <HowToWireTutorial />

          {/* Legend */}
          <div className="schematic-legend">
            {Object.entries(blockColor).map(([blockId, color]) => (
              <div key={blockId} className="schematic-legend-item">
                <span className="schematic-legend-swatch" style={{ background: color }} />
                <span className="schematic-legend-label">{blockLabel(blockId)}</span>
              </div>
            ))}
          </div>

          <BlocksNeededSummary grid={grid} />

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <div ref={contentRef} className="schematic-content">
              {grid.instruments.length === 0 ? (
                <p className="hint">No notes to display.</p>
              ) : (
                <SchematicGrid grid={grid} cellSize={cellSize} currentTick={0} />
              )}
            </div>
          </div>
        </CollapsiblePanel>
      </div>
    </ErrorBoundary>
  );
}
