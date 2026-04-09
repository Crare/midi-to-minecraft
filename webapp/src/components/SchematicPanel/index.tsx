import CollapsiblePanel from '@components/common/CollapsiblePanel';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { useContainerWidth } from '@hooks/useContainerWidth';
import { useEffect, useMemo, useRef as useReactRef, useRef, useState } from 'react';
import HowToWireTutorial from './HowToWireTutorial';
import { MiniBlock, MiniDust, MiniNoteBlock, MiniRepeater } from './SchematicCells';
import SchematicGridArea from './SchematicGridArea';
import SchematicOptions from './SchematicOptions';
import TotalsChip from './TotalsChip';
import {
  blockColor,
  blockColorFor,
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
  const [indicatorX, setIndicatorX] = useState(15);
  const [indicatorY, setIndicatorY] = useState(30);
  const [processing, setProcessing] = useState(false);

  const panelContainerRef = useReactRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelWidth = useContainerWidth(panelContainerRef);
  const indicatorDragRef = useRef({ active: false, startClientX: 0, startX: 0 });
  const hIndicatorDragRef = useRef({ active: false, startClientY: 0, startY: 0 });

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

  function onIndicatorPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    indicatorDragRef.current = { active: true, startClientX: e.clientX, startX: indicatorX };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onIndicatorPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!indicatorDragRef.current.active) return;
    const delta = e.clientX - indicatorDragRef.current.startClientX;
    const maxX = contentRef.current ? contentRef.current.scrollWidth : 999999;
    setIndicatorX(Math.max(0, Math.min(indicatorDragRef.current.startX + delta, maxX)));
  }

  function onIndicatorPointerUp() {
    indicatorDragRef.current.active = false;
  }

  function onHIndicatorPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    hIndicatorDragRef.current = { active: true, startClientY: e.clientY, startY: indicatorY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onHIndicatorPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!hIndicatorDragRef.current.active) return;
    const delta = e.clientY - hIndicatorDragRef.current.startClientY;
    const maxY = contentRef.current ? contentRef.current.offsetHeight : 999999;
    setIndicatorY(Math.max(0, Math.min(hIndicatorDragRef.current.startY + delta, maxY)));
  }

  function onHIndicatorPointerUp() {
    hIndicatorDragRef.current.active = false;
  }

  function onColumnClick(el: HTMLElement) {
    const content = contentRef.current;
    if (!content) return;
    const x =
      el.getBoundingClientRect().left - content.getBoundingClientRect().left + el.offsetWidth / 2;
    setIndicatorX(Math.max(0, x));
  }

  function onRowClick(el: HTMLElement) {
    const content = contentRef.current;
    if (!content) return;
    const y =
      el.getBoundingClientRect().top - content.getBoundingClientRect().top + el.offsetHeight / 2;
    setIndicatorY(Math.max(0, y));
  }

  return (
    <ErrorBoundary>
      <div style={{ position: 'relative' }} ref={panelContainerRef}>
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
                          icon={<MiniBlock color={blockColorFor(bid)} size={18} />}
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
                        icon={<MiniBlock color="#6b4a1e" size={18} />}
                        count={raw?.logs}
                        label={`logs (${raw?.planks?.toLocaleString()} planks)`}
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
                        icon={<MiniBlock color="#8f9497" size={18} />}
                        count={raw?.stone}
                        label="stone"
                      />
                      {supportEntries.map(([bid, n]: [string, number]) => (
                        <TotalsChip
                          key={bid}
                          icon={<MiniBlock color={blockColorFor(bid)} size={18} />}
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

          <SchematicGridArea
            grid={grid}
            cellSize={cellSize}
            indicatorX={indicatorX}
            indicatorY={indicatorY}
            onIndicatorPointerDown={onIndicatorPointerDown}
            onIndicatorPointerMove={onIndicatorPointerMove}
            onIndicatorPointerUp={onIndicatorPointerUp}
            onHIndicatorPointerDown={onHIndicatorPointerDown}
            onHIndicatorPointerMove={onHIndicatorPointerMove}
            onHIndicatorPointerUp={onHIndicatorPointerUp}
            onColumnClick={onColumnClick}
            onRowClick={onRowClick}
            contentRef={contentRef}
            maxWidth={panelWidth}
          />
        </CollapsiblePanel>
      </div>
    </ErrorBoundary>
  );
}
