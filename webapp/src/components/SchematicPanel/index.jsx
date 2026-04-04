import { useRef, useMemo, useState, useEffect } from 'react';
import DragScrollArea from '../DragScrollArea';
import SchematicGrid from './SchematicGrid';
import { blockColor, blockColorFor, blockLabel, buildTickGrid, computeTickGridBlockCounts, computeRawResources } from './schematicData';
import { MiniNoteBlock, MiniRepeater, MiniDust, MiniBlock } from './SchematicCells';

function stackLabel(n) {
  const s = Math.floor(n / 64);
  const r = n % 64;
  if (s === 0) return '< 1 stack';
  if (r === 0) return `${s} stack${s !== 1 ? 's' : ''}`;
  return `${s}×64 + ${r}`;
}

function TotalsChip({ icon, count, label }) {
  return (
    <div className="totals-chip">
      {icon}
      <div className="totals-chip-info">
        <span className="totals-chip-count">{count.toLocaleString()}</span>
        {' '}<span className="totals-chip-label">{label}</span>
        <span className="totals-chip-stacks">{stackLabel(count)}</span>
      </div>
    </div>
  );
}

export default function SchematicPanel({ trackEvents }) {
  const [open, setOpen] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const [indicatorX, setIndicatorX] = useState(15);

  const contentRef = useRef(null);
  const indicatorDragRef = useRef({ active: false, startClientX: 0, startX: 0 });

  const grid = useMemo(
    () => buildTickGrid(trackEvents),
    [trackEvents],
  );
  const totalNotes = useMemo(
    () => grid.instruments.reduce((s, inst) => s + inst.rows.reduce((rs, row) => rs + row.anchorCells.filter((c) => c.kind === 'note' && c.note).length, 0), 0),
    [grid],
  );
  const totalRows = useMemo(() => grid.instruments.reduce((s, inst) => s + inst.rows.length, 0), [grid]);

  const totalBlockCounts = useMemo(() => {
    const c = computeTickGridBlockCounts(grid);
    const raw = computeRawResources(c);
    return { ...c, raw };
  }, [grid]);
  const hasData = trackEvents.length > 0;

  useEffect(() => {
    if (hasData) setOpen(true);
  }, [hasData]);

  function onIndicatorPointerDown(e) {
    e.preventDefault();
    e.stopPropagation();
    indicatorDragRef.current = { active: true, startClientX: e.clientX, startX: indicatorX };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onIndicatorPointerMove(e) {
    if (!indicatorDragRef.current.active) return;
    const delta = e.clientX - indicatorDragRef.current.startClientX;
    const maxX = contentRef.current ? contentRef.current.scrollWidth : 999999;
    setIndicatorX(Math.max(0, Math.min(indicatorDragRef.current.startX + delta, maxX)));
  }

  function onIndicatorPointerUp() {
    indicatorDragRef.current.active = false;
  }

  return (
    <section className="panel schematic-panel">
      <button
        type="button"
        className="panel-header panel-header-toggle"
        onClick={() => { if (hasData) setOpen((o) => !o); }}
        aria-expanded={open}
        disabled={!hasData}
      >
        <h2>4) Build Schematic (Top-Down)</h2>
        <span className="panel-header-meta">
          {!hasData
            ? 'No tracks yet'
            : open
              ? 'Hide'
              : `Show ${totalRows} lane(s), ${totalNotes} note(s)`}
        </span>
      </button>

      {open ? (
        <div className="panel-body">
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
            Harmonics are connected by a vertical redstone rail on the left.
            An orange T-junction cell marks where a lane branches off another lane to save repeaters.
            Drag the gold marker to track your build progress.
          </p>

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
          {grid.instruments.length > 0 && (() => {
            const { noteblocks, repeaters, dust, raw, supportMap } = totalBlockCounts;
            const supportEntries = [...supportMap.entries()];
            return (
              <div className="schematic-totals">
                <div className="schematic-totals-section">
                  <h3 className="schematic-totals-heading">Blocks needed</h3>
                  <div className="schematic-totals-chips">
                    <TotalsChip icon={<MiniNoteBlock size={18} />} count={noteblocks} label="note blocks" />
                    <TotalsChip icon={<MiniRepeater size={18} />} count={repeaters} label="repeaters" />
                    <TotalsChip icon={<MiniDust size={18} />} count={dust} label="redstone dust" />
                    {supportEntries.map(([bid, n]) => (
                      <TotalsChip key={bid} icon={<MiniBlock color={blockColorFor(bid)} size={18} />} count={n} label={blockLabel(bid)} />
                    ))}
                  </div>
                </div>
                <div className="schematic-totals-section">
                  <h3 className="schematic-totals-heading">Raw resources</h3>
                  <div className="schematic-totals-chips">
                    <TotalsChip icon={<MiniBlock color="#6b4a1e" size={18} />} count={raw.logs} label={`logs (${raw.planks.toLocaleString()} planks)`} />
                    <TotalsChip icon={<MiniDust size={18} />} count={raw.redstoneDust} label={raw.redstoneBlocks > 0
                      ? `redstone dust = ${raw.redstoneBlocks} block${raw.redstoneBlocks !== 1 ? 's' : ''}${raw.redstoneRemainder > 0 ? ` + ${raw.redstoneRemainder}` : ''}`
                      : 'redstone dust'} />
                    <TotalsChip icon={<MiniBlock color="#8f9497" size={18} />} count={raw.stone} label="stone" />
                    {supportEntries.map(([bid, n]) => (
                      <TotalsChip key={bid} icon={<MiniBlock color={blockColorFor(bid)} size={18} />} count={n} label={`${blockLabel(bid)} (support)`} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <DragScrollArea className="schematic-scroll">
            <div ref={contentRef} className="schematic-content">
              {grid.instruments.length > 0 && (
                <button
                  type="button"
                  className="schematic-indicator"
                  style={{ left: `${indicatorX}px` }}
                  onPointerDown={onIndicatorPointerDown}
                  onPointerMove={onIndicatorPointerMove}
                  onPointerUp={onIndicatorPointerUp}
                  onPointerCancel={onIndicatorPointerUp}
                  aria-label="Drag to mark build progress"
                >
                  <span className="schematic-indicator-line" aria-hidden="true" />
                  <span className="schematic-indicator-head" aria-hidden="true" />
                </button>
              )}
              {grid.instruments.length === 0 ? (
                <p className="hint">No notes to display.</p>
              ) : (
                <SchematicGrid
                  grid={grid}
                  cellSize={cellSize}
                />
              )}
            </div>
          </DragScrollArea>
        </div>
      ) : null}
    </section>
  );
}
