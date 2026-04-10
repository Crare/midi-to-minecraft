import CollapsiblePanel from '@components/common/CollapsiblePanel';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MiniDust, MiniNoteBlock, MiniRepeater, SupportBlock } from './SchematicCells';
import SchematicGrid from './SchematicGrid';
import TotalsChip from './TotalsChip';
import {
  blockColor,
  blockLabel,
  buildTickGrid,
  computeRawResources,
  computeSchematicDimensions,
  computeTickGridBlockCounts,
} from './schematicData';

interface SchematicPanelProps {
  trackEvents: any[];
}

export default function SchematicPanel({ trackEvents }: SchematicPanelProps) {
  const [open, setOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const [processing, setProcessing] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);

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

  console.log('grid', grid);

  return (
    <ErrorBoundary>
      <div style={{ position: 'relative' }}>
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
          <div className="schematic-tutorial">
            <button
              type="button"
              className="schematic-tutorial-toggle"
              onClick={() => setTutorialOpen((o) => !o)}
              aria-expanded={tutorialOpen}
            >
              <span className="schematic-tutorial-toggle-label">How to wire it in Minecraft</span>
              <span className="schematic-tutorial-toggle-arrow">{tutorialOpen ? '▲' : '▼'}</span>
            </button>
            {tutorialOpen && (
              <div className="schematic-tutorial-body">
                <p className="schematic-tutorial-note">
                  <strong>Note:</strong> The schematic is not an exact representation of how the
                  redstone needs to be wired. It shows only the timeline and repeater delays. Wiring
                  multiple note blocks to play at the same time requires more redstone, as shown in
                  the example pictures below.
                </p>
                <div className="schematic-tutorial-images">
                  <figure className="schematic-tutorial-figure">
                    <img
                      src={`${import.meta.env.BASE_URL}assets/example_schematic.png`}
                      alt="Example schematic view"
                    />
                    <figcaption>Schematic view (top-down)</figcaption>
                  </figure>
                  <figure className="schematic-tutorial-figure">
                    <img
                      src={`${import.meta.env.BASE_URL}assets/example_minecraft1.png`}
                      alt="Example Minecraft wiring 1"
                    />
                    <figcaption>In-game wiring example 1</figcaption>
                  </figure>
                  <figure className="schematic-tutorial-figure">
                    <img
                      src={`${import.meta.env.BASE_URL}assets/example_minecraft2.png`}
                      alt="Example Minecraft wiring 2"
                    />
                    <figcaption>In-game wiring example 2</figcaption>
                  </figure>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="schematic-legend">
            {Object.entries(blockColor).map(([blockId, color]) => (
              <div key={blockId} className="schematic-legend-item">
                <span className="schematic-legend-swatch" style={{ background: color }} />
                <span className="schematic-legend-label">{blockLabel(blockId)}</span>
              </div>
            ))}
          </div>

          {/* Block totals and raw resource summary */}
          {grid.instruments.length > 0 &&
            (() => {
              const { noteblocks, repeaters, dust, raw, supportMap } = totalBlockCounts as any;
              const supportEntries = [...(supportMap?.entries?.() ?? [])];
              return (
                <div className="schematic-totals">
                  <div className="schematic-totals-section">
                    <h3 className="schematic-totals-heading">Blocks needed</h3>
                    <div className="schematic-totals-chips">
                      <TotalsChip
                        icon={<MiniNoteBlock block="minecraft:dirt" size={18} />}
                        count={noteblocks}
                        label="note blocks"
                      />
                      <TotalsChip
                        icon={<MiniRepeater size={18} />}
                        count={repeaters}
                        label="repeaters"
                      />
                      <TotalsChip
                        icon={<MiniDust size={18} />}
                        count={dust}
                        label="redstone dust"
                      />
                      {supportEntries.map(([bid, n]: [string, number]) => (
                        <TotalsChip
                          key={bid}
                          icon={<SupportBlock blockId={bid} size={18} />}
                          count={n}
                          label={blockLabel(bid)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="schematic-totals-section">
                    <h3 className="schematic-totals-heading">Raw resources</h3>
                    <div className="schematic-totals-chips">
                      <TotalsChip
                        icon={<SupportBlock blockId="minecraft:wood_log" size={18} />}
                        count={raw?.logs}
                        label={`wood logs (${raw?.planks?.toLocaleString()} planks)`}
                      />
                      <TotalsChip
                        icon={<MiniDust size={18} />}
                        count={raw?.redstoneDust}
                        label={
                          raw?.redstoneBlocks > 0
                            ? `redstone dust = ${raw.redstoneBlocks} block${raw.redstoneBlocks !== 1 ? 's' : ''}${raw.redstoneRemainder > 0 ? ` + ${raw.redstoneRemainder}` : ''}`
                            : 'redstone dust'
                        }
                      />
                      <TotalsChip
                        icon={<SupportBlock blockId="minecraft:stone" size={18} />}
                        count={raw?.stone}
                        label="stone"
                      />
                      {supportEntries.map(([bid, n]: [string, number]) => (
                        <TotalsChip
                          key={bid}
                          icon={<SupportBlock blockId={bid} size={18} />}
                          count={n}
                          label={`${blockLabel(bid)} (support)`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="schematic-totals-section">
                    <h3 className="schematic-totals-heading">Minimum build area</h3>
                    <div className="schematic-dimensions">
                      <span className="schematic-dim-chip">
                        <span className="schematic-dim-axis">X</span>
                        <span className="schematic-dim-value">{dimensions.x}</span>
                        <span className="schematic-dim-unit">blocks long</span>
                      </span>
                      <span className="schematic-dim-sep">×</span>
                      <span className="schematic-dim-chip">
                        <span className="schematic-dim-axis">Z</span>
                        <span className="schematic-dim-value">{dimensions.z}</span>
                        <span className="schematic-dim-unit">blocks wide</span>
                      </span>
                      <span className="schematic-dim-sep">×</span>
                      <span className="schematic-dim-chip">
                        <span className="schematic-dim-axis">Y</span>
                        <span className="schematic-dim-value">{dimensions.y}</span>
                        <span className="schematic-dim-unit">blocks tall</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

          <div ref={contentRef} className="schematic-content">
            {grid.instruments.length === 0 ? (
              <p className="hint">No notes to display.</p>
            ) : (
              <SchematicGrid grid={grid} cellSize={cellSize} />
            )}
          </div>
        </CollapsiblePanel>
      </div>
    </ErrorBoundary>
  );
}
