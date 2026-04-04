import { Fragment } from 'react';
import { playPlacementSound } from '../../audio/noteblockAudio';
import { blockLabel, getUseCount } from './schematicData';
import { NoteCell, RepeaterCell, DustCell, SplitPassCell, SplitBranchCell, CELL } from './SchematicCells';

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

// ── Anchor cell ───────────────────────────────────────────────────────────────
function AnchorCell({ anchor, cell, cs, isFirstRow, instrument, block }) {
  if (!cell || cell.kind === 'inactive') {
    return <div style={{ width: cs, height: cs }} aria-hidden="true" />;
  }
  if (cell.kind === 'split-pass') {
    return <div className="schematic-cell" aria-hidden="true"><SplitPassCell size={cs} /></div>;
  }
  if (cell.kind === 'split-branch') {
    return <div className="schematic-cell" aria-hidden="true"><SplitBranchCell size={cs} /></div>;
  }
  if (cell.kind === 'note') {
    if (!cell.note) {
      return <div style={{ width: cs, height: cs }} aria-hidden="true" />;
    }
    const note = cell.note;
    const useCount = getUseCount(note.note);
    const noteBlock = note.block ?? block;
    return (
      <div
        className="schematic-cell schematic-cell-tip"
        tabIndex={0}
        role="button"
        aria-label={`${note.instrument ?? instrument} - ${note.pitch || 'drum'}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => void playPlacementSound({ instrument: note.instrument ?? instrument, note: note.note, pitch: note.pitch })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void playPlacementSound({ instrument: note.instrument ?? instrument, note: note.note, pitch: note.pitch });
          }
        }}
      >
        <NoteCell block={noteBlock} instrument={note.instrument ?? instrument} useCount={useCount} size={cs} />
        <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
          {note.instrument ?? instrument}<br />
          {note.pitch || 'drum'}<br />
          Use count: {useCount}<br />
          {blockLabel(noteBlock)}
        </span>
      </div>
    );
  }
  return null;
}

// ── Main grid component ───────────────────────────────────────────────────────
// ALL rows (across all instruments) share one CSS grid so anchor columns align.
// Instrument-label rows span all columns.
export default function SchematicGrid({ grid, cellSize }) {
  const cs = cellSize ?? CELL;
  if (!grid || grid.instruments.length === 0) return null;

  const { instruments, anchors } = grid;
  const totalCols = 1 + anchors.length * 2; // connector + (seg + anchor) × N
  const gridTemplate = makeGridTemplate(anchors.length, cs);

  return (
    <div
      className="schematic-grid"
      style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center' }}
    >
      {instruments.map((inst, instIndex) => {
        const isFirstInst = instIndex === 0;
        return (
          <div key={inst.id} style={{ display: 'contents' }}>
            {/* Group separator — spans all columns */}
            {!isFirstInst && (
              <div
                className="schematic-group-separator"
                style={{ gridColumn: `1 / ${totalCols + 1}` }}
              />
            )}
            {/* Group label — spans all columns */}
            <div
              className="schematic-group-label"
              style={{ gridColumn: `1 / ${totalCols + 1}` }}
            >
              <span className="schematic-group-title">
                {inst.label} — {blockLabel(inst.block)}
              </span>
            </div>

            {/* Instrument rows */}
            {inst.rows.map((row, rowIndex) => {
              const isFirstRow = isFirstInst && rowIndex === 0;
              return (
                <div key={row.id} style={{ display: 'contents' }}>
                  {/* Connector dust — always column 1 */}
                  <div className="schematic-connector" style={{ width: cs, height: cs }}>
                    <DustCell size={cs} />
                  </div>

                  {anchors.map((anchor, ai) => {
                    const seg = row.segments[ai] ?? [];
                    return (
                      <Fragment key={ai}>
                        {/* Segment cell */}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                          {seg.map((cell, ri) => (
                            <div key={ri} className="schematic-cell schematic-cell-tip" tabIndex={0}>
                              <RepeaterCell ticks={cell.ticks} size={cs} />
                              <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
                                Repeater: {cell.ticks} tick{cell.ticks !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Anchor cell */}
                        <AnchorCell
                          anchor={anchor}
                          cell={row.anchorCells[ai]}
                          cs={cs}
                          isFirstRow={isFirstRow}
                          instrument={inst.label}
                          block={inst.block}
                        />
                      </Fragment>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
