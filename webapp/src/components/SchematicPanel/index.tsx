import CollapsiblePanel from '@components/common/CollapsiblePanel';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { useContainerWidth } from '@hooks/useContainerWidth';
import { useEffect, useMemo, useRef, useState } from 'react';
import BlocksNeededSummary from './BlocksNeededSummary';
import HowToWireTutorial from './HowToWireTutorial';
import {
  blockColor,
  blockLabel,
  buildTickGrid,
  computeRawResources,
  computeSchematicDimensions,
  computeTickGridBlockCounts,
} from './schematicData';
import SchematicGridArea from './SchematicGridArea';
import SchematicOptions from './SchematicOptions';

interface SchematicPanelProps {
  trackEvents: any[];
}

export default function SchematicPanel({ trackEvents }: SchematicPanelProps) {
  const [open, setOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const [processing, setProcessing] = useState(false);

  const panelContainerRef = useRef<HTMLDivElement>(null);
  const panelWidth = useContainerWidth(panelContainerRef);

  const [grid, setGrid] = useState<any>(() => buildTickGrid(trackEvents));

  useEffect(() => {
    let cancelled = false;
    setProcessing(true);
    // Simulate async processing for demonstration; replace with real async if needed
    setTimeout(() => {
      if (!cancelled) {
        setGrid(buildTickGrid(trackEvents));
        setProcessing(false);
      }
    }, 0);
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

  const totalBlockCounts = useMemo(() => {
    if (!grid || !Array.isArray(grid.instruments)) return {};
    const c = computeTickGridBlockCounts(grid);
    const raw = computeRawResources(c);
    return { ...c, raw };
  }, [grid]);

  const dimensions = useMemo(() => computeSchematicDimensions(grid), [grid]);
  const hasData = Array.isArray(trackEvents) && trackEvents.length > 0;

  useEffect(() => {
    if (hasData) setOpen(true);
  }, [hasData]);

  return (
    <ErrorBoundary>
      <div
        style={{
          position: 'relative',
          maxWidth: '100vw',
          width: '100%',
          overflowX: 'hidden',
        }}
        ref={panelContainerRef}
      >
        {processing && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(255,255,255,0.7)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="spinner spinner-large" aria-label="Loading" />
          </div>
        )}
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
          <SchematicOptions cellSize={cellSize} setCellSize={setCellSize} />

          <p className="hint output-summary">
            Top-down schematic. Background color = instrument block. Each repeater shows its
            individual delay setting (1–4 t). Tracks starting later include leading repeaters.
            Harmonics are connected by a vertical redstone rail on the left. An orange T-junction
            cell marks where a lane branches off another lane to save repeaters. Drag the gold
            vertical marker to track column progress; drag the blue horizontal marker to track row
            progress. Click any note block to highlight it as your last-placed position.
          </p>

          {/* Tutorial */}
          <HowToWireTutorial tutorialOpen={tutorialOpen} setTutorialOpen={setTutorialOpen} />

          {/* Legend */}
          <div className="schematic-legend">
            {Object.entries(blockColor).map(([blockId, color]) => (
              <div key={blockId} className="schematic-legend-item">
                <span className="schematic-legend-swatch" style={{ background: color }} />
                <span className="schematic-legend-label">{blockLabel(blockId)}</span>
              </div>
            ))}
          </div>

          <BlocksNeededSummary
            dimensions={dimensions}
            grid={grid}
            totalBlockCounts={totalBlockCounts}
          />

          <SchematicGridArea grid={grid} cellSize={cellSize} maxWidth={panelWidth} />
        </CollapsiblePanel>
      </div>
    </ErrorBoundary>
  );
}
