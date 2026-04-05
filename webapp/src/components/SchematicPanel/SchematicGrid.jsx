import { Fragment, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { playPlacementSound } from '../../audio/noteblockAudio';
import { blockLabel, getUseCount } from './schematicData';
import { NoteCell, RepeaterCell, DustCell, SplitPassCell, SplitBranchCell, CELL } from './SchematicCells';

// ── Portal tooltip hook ───────────────────────────────────────────────────────
// overflow-x:auto on the scroll container coerces overflow-y:visible → auto,
// which clips absolutely-positioned children. Portaling into document.body
// with position:fixed escapes the clip.
function usePortalTooltip() {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const hide = useCallback(() => setPos(null), []);
  const show = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    // Show below if there's less than 80px above (near viewport top).
    const below = r.top < 80;
    setPos({ x: r.left + r.width / 2, y: below ? r.bottom : r.top, below });
  }, []);

  // Dismiss if the viewport scrolls or resizes (keeps fixed pos from going stale).
  useEffect(() => {
    if (!pos) return;
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('resize', hide, { passive: true });
    return () => {
      window.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('resize', hide);
    };
  }, [pos, hide]);

  return { ref, pos, show, hide };
}

function TooltipPortal({ pos, children }) {
  return createPortal(
    <div
      className={`cell-tooltip-portal${pos.below ? ' cell-tooltip-portal-below' : ''}`}
      style={{
        left: `${pos.x}px`,
        top: pos.below ? `${pos.y + 8}px` : `${pos.y - 8}px`,
      }}
      role="tooltip"
    >
      {children}
    </div>,
    document.body,
  );
}

// ── CSS grid column template ──────────────────────────────────────────────────
// Layout: [connector cs] then for each anchor: [segment auto] [anchor cs]
// The shared grid means all rows (across all instruments) align at anchor columns.
function makeGridTemplate(anchorCount, cs) {
  const parts = [`${cs}px`];
  for (let i = 0; i < anchorCount; i++) {
    parts.push('auto');    // segment (fits to widest content in that segment column)
    parts.push(`${cs}px`); // anchor (note / split — fixed width)
  }
  return parts.join(' ');
}

// ── Segment repeater cell with portal tooltip ─────────────────────────────────
function SegRepCell({ cell, cs }) {
  const { ref, pos, show, hide } = usePortalTooltip();
  return (
    <div
      ref={ref}
      className="schematic-cell schematic-cell-tip"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <RepeaterCell ticks={cell.ticks} size={cs} />
      {pos && <TooltipPortal pos={pos}>Repeater: {cell.ticks} tick{cell.ticks !== 1 ? 's' : ''}</TooltipPortal>}
    </div>
  );
}

// ── Note block anchor cell with portal tooltip ────────────────────────────────
function NoteBlockCell({ cell, cs, instrument, block, isLastPressed, onPress }) {
  const { ref, pos, show, hide } = usePortalTooltip();
  const note = cell.note;
  const useCount = getUseCount(note.note);
  const noteBlock = note.block ?? block;
  return (
    <div
      ref={ref}
      className={`schematic-cell schematic-cell-tip${isLastPressed ? ' schematic-cell--last-pressed' : ''}`}
      tabIndex={0}
      role="button"
      aria-label={`${note.instrument ?? instrument} - ${note.pitch || 'drum'}`}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={() => {
        void playPlacementSound({ instrument: note.instrument ?? instrument, note: note.note, pitch: note.pitch });
        onPress?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          void playPlacementSound({ instrument: note.instrument ?? instrument, note: note.note, pitch: note.pitch });
          onPress?.();
        }
      }}
    >
      <NoteCell block={noteBlock} instrument={note.instrument ?? instrument} useCount={useCount} size={cs} />
      {pos && (
        <TooltipPortal pos={pos}>
          {note.instrument ?? instrument}<br />
          {note.pitch || 'drum'}<br />
          Use count: {useCount}<br />
          {blockLabel(noteBlock)}
        </TooltipPortal>
      )}
    </div>
  );
}

// ── Anchor cell ───────────────────────────────────────────────────────────────
function AnchorCell({ anchor, cell, cs, instrument, block, isLastPressed, onPress }) {
  if (!cell || cell.kind === 'inactive') {
    return <div className="schematic-cell schematic-cell--empty" style={{ width: cs, height: cs }} aria-hidden="true" />;
  }
  if (cell.kind === 'split-pass') {
    return <div className="schematic-cell" aria-hidden="true"><SplitPassCell size={cs} /></div>;
  }
  if (cell.kind === 'split-branch') {
    return <div className="schematic-cell" aria-hidden="true"><SplitBranchCell size={cs} /></div>;
  }
  if (cell.kind === 'note') {
    if (!cell.note) {
      return <div className="schematic-cell schematic-cell--empty" style={{ width: cs, height: cs }} aria-hidden="true" />;
    }
    return <NoteBlockCell cell={cell} cs={cs} instrument={instrument} block={block} isLastPressed={isLastPressed} onPress={onPress} />;
  }
  return null;
}

// ── Main grid component ───────────────────────────────────────────────────────
// Each instrument has its own CSS grid (compact — only ticks it plays appear).
// Instrument sections are separated by a group label and optional divider.
export default function SchematicGrid({ grid, cellSize, onColumnClick, onRowClick }) {
  const cs = cellSize ?? CELL;
  const [lastPressed, setLastPressed] = useState(null);
  if (!grid || grid.instruments.length === 0) return null;

  const { instruments } = grid;

  return (
    <div className="schematic-multi-grid">
      {instruments.map((inst, instIndex) => {
        const anchors = inst.anchors ?? [];
        const gridTemplate = makeGridTemplate(anchors.length, cs);

        return (
          <div key={inst.id} className="schematic-instrument-section">
            {/* Group separator */}
            {instIndex > 0 && <div className="schematic-group-separator schematic-group-separator--full" />}

            {/* Group label */}
            <div className="schematic-group-label schematic-group-label--full">
              <span className="schematic-group-title">
                {inst.label} — {blockLabel(inst.block)}
              </span>
            </div>

            {/* Per-instrument grid */}
            <div
              className="schematic-grid"
              style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center' }}
            >
              {/* Ruler row */}
              <div
                className="schematic-ruler-corner"
                style={{ width: cs, height: 10, position: 'sticky', left: 0, zIndex: 6 }}
              />
              {anchors.map((_anchor, ai) => (
                <Fragment key={ai}>
                  <div className="schematic-ruler-segment" style={{ height: 10 }} />
                  <button
                    type="button"
                    className="schematic-ruler-tick"
                    style={{ width: cs }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onColumnClick?.(e.currentTarget); }}
                    aria-label={`Move column marker to position ${ai + 1}`}
                  />
                </Fragment>
              ))}

              {/* Instrument rows */}
              {inst.rows.map((row) => (
                <div key={row.id} style={{ display: 'contents' }}>
                  {/* Connector dust — sticky column 1 */}
                  <button
                    type="button"
                    className="schematic-connector schematic-connector--sticky"
                    style={{ width: cs, height: cs }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onRowClick?.(e.currentTarget); }}
                    aria-label="Move row marker here"
                  >
                    <DustCell size={cs} />
                  </button>

                  {anchors.map((anchor, ai) => {
                    const seg = row.segments[ai] ?? [];
                    return (
                      <Fragment key={ai}>
                        {/* Segment cell */}
                        <div className="schematic-segment">
                          {seg.map((cell, ri) => (
                            <SegRepCell key={ri} cell={cell} cs={cs} />
                          ))}
                        </div>
                        {/* Anchor cell */}
                        <AnchorCell
                          anchor={anchor}
                          cell={row.anchorCells[ai]}
                          cs={cs}
                          instrument={inst.label}
                          block={inst.block}
                          isLastPressed={lastPressed === `${row.id}:${ai}`}
                          onPress={() => setLastPressed(`${row.id}:${ai}`)}
                        />
                      </Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
