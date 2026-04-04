import { useRef, useMemo, useState, useEffect } from 'react';
import DragScrollArea from '../DragScrollArea';
import SchematicGrid from './SchematicGrid';
import { blockColor, blockLabel, buildLaneGroups } from './schematicData';

export default function SchematicPanel({ trackEvents }) {
  const [open, setOpen] = useState(false);
  const [combineTracks, setCombineTracks] = useState(false);
  const [groupByInstrument, setGroupByInstrument] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const [indicatorX, setIndicatorX] = useState(0);

  const contentRef = useRef(null);
  const indicatorDragRef = useRef({ active: false, startClientX: 0, startX: 0 });

  const groups = useMemo(
    () => buildLaneGroups(trackEvents, combineTracks, groupByInstrument),
    [trackEvents, combineTracks, groupByInstrument],
  );
  const totalNotes = useMemo(
    () => groups.reduce((s, g) => s + g.sublanes.reduce((ss, sl) => ss + sl.notes.length, 0), 0),
    [groups],
  );
  const totalRows = useMemo(() => groups.reduce((s, g) => s + g.sublanes.length, 0), [groups]);
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
            <label className="option-row">
              <input
                type="checkbox"
                checked={combineTracks}
                onChange={(e) => setCombineTracks(e.target.checked)}
              />
              <span>Combine all tracks into minimal lanes</span>
            </label>
            <label className="option-row">
              <input
                type="checkbox"
                checked={groupByInstrument}
                disabled={combineTracks}
                onChange={(e) => setGroupByInstrument(e.target.checked)}
              />
              <span>Group by instrument (show harmonics with vertical redstone)</span>
            </label>
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

          <DragScrollArea className="schematic-scroll">
            <div ref={contentRef} className="schematic-content">
              {groups.length > 0 && (
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
              {groups.length === 0 ? (
                <p className="hint">No notes to display.</p>
              ) : (
                <SchematicGrid
                  groups={groups}
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
