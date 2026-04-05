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
      // No note at this tick for this instrument — show wire passing through.
      return <div className="schematic-cell schematic-cell--passthrough" aria-hidden="true"><DustCell size={cs} /></div>;
    }
    return <NoteBlockCell cell={cell} cs={cs} instrument={instrument} block={block} isLastPressed={isLastPressed} onPress={onPress} />;
  }
  return null;
}

// ── Main grid component ───────────────────────────────────────────────────────
// All instruments share ONE <table> so every tick column aligns across instruments.
// The <thead> shows absolute tick numbers. Instrument groups are separated by
// label rows that span all columns. Segments are padded with dust so all note
// columns land at the same x position.
export default function SchematicGrid({ grid, cellSize, onColumnClick, onRowClick }) {
  const cs = cellSize ?? CELL;
  const [lastPressed, setLastPressed] = useState(null);
  if (!grid || grid.instruments.length === 0) return null;

  const { instruments, anchors } = grid;
  const totalCols = 1 + anchors.length * 2; // connector + (seg + anchor) × N

  return (
    <table className="schematic-table">
      <thead>
        <tr>
          <th className="schematic-th-corner" style={{ width: cs, minWidth: cs }} />
          {anchors.map((anchor, ai) => (
            <Fragment key={ai}>
              <th className="schematic-th-seg" />
              <th className="schematic-th-anchor" style={{ width: cs, minWidth: cs }}>
                {anchor.kind === 'note' && (
                  <button
                    type="button"
                    className="schematic-tick-btn"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onColumnClick?.(e.currentTarget); }}
                    aria-label={`Tick ${anchor.tick} — click to move column marker`}
                  >
                    {anchor.tick}
                  </button>
                )}
              </th>
            </Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {instruments.map((inst) => (
          <Fragment key={inst.id}>
            {/* Instrument label row — spans all columns */}
            <tr className="schematic-instrument-label-row">
              <td colSpan={totalCols} className="schematic-instrument-label-cell">
                {inst.label} — {blockLabel(inst.block)}
              </td>
            </tr>

            {/* Data rows */}
            {inst.rows.map((row) => (
              <tr key={row.id}>
                {/* Connector dust — sticky first column */}
                <td className="schematic-td-connector" style={{ width: cs }}>
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
                </td>

                {anchors.map((anchor, ai) => {
                  const seg = row.segments[ai] ?? [];
                  return (
                    <Fragment key={ai}>
                      {/* Segment cell — repeaters + dust padding */}
                      <td className="schematic-td-seg">
                        <div className="schematic-segment">
                          {seg.map((cell, ri) => (
                            cell.kind === 'dust'
                              ? <DustCell key={ri} size={cs} />
                              : <SegRepCell key={ri} cell={cell} cs={cs} />
                          ))}
                        </div>
                      </td>
                      {/* Anchor cell — note block or pass-through */}
                      <td className="schematic-td-anchor" style={{ width: cs }}>
                        <AnchorCell
                          anchor={anchor}
                          cell={row.anchorCells[ai]}
                          cs={cs}
                          instrument={inst.label}
                          block={inst.block}
                          isLastPressed={lastPressed === `${row.id}:${ai}`}
                          onPress={() => setLastPressed(`${row.id}:${ai}`)}
                        />
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
