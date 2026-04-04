import { playPlacementSound } from '../../audio/noteblockAudio';
import { blockLabel, getUseCount } from './schematicData';
import { NoteCell, RepeaterCell, DustCell, SplitPassCell, SplitBranchCell, CELL } from './SchematicCells';

// Render one cell for a row, given the column kind and the row's cell data.
function RowCell({ col, cell, cs, isFirstRow, instrument, block }) {
  if (cell.kind === 'spacer' || cell.kind === 'inactive') {
    return <div style={{ width: cs, height: cs, flexShrink: 0 }} aria-hidden="true" />;
  }
  if (cell.kind === 'repeater') {
    return (
      <div className="schematic-cell schematic-cell-tip" tabIndex={0}>
        <RepeaterCell ticks={cell.ticks} size={cs} />
        <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
          Repeater: {cell.ticks} tick{cell.ticks !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }
  if (cell.kind === 'split-pass') {
    return (
      <div className="schematic-cell" aria-hidden="true">
        <SplitPassCell size={cs} />
      </div>
    );
  }
  if (cell.kind === 'split-branch') {
    return (
      <div className="schematic-cell" aria-hidden="true">
        <SplitBranchCell size={cs} />
      </div>
    );
  }
  if (cell.kind === 'note') {
    if (!cell.note) {
      // This instrument/row doesn't play at this tick — empty alignment cell.
      return <div style={{ width: cs, height: cs, flexShrink: 0 }} aria-hidden="true" />;
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

export default function SchematicGrid({ grid, cellSize }) {
  const cs = cellSize ?? CELL;
  if (!grid || grid.instruments.length === 0) return null;

  const { instruments, columns } = grid;

  return (
    <div className="schematic-grid">
      {instruments.map((inst, instIndex) => {
        const isFirstInst = instIndex === 0;
        const hasSubs = inst.rows.length > 1;

        return (
          <div key={inst.id} className="schematic-group">
            {!isFirstInst && <div className="schematic-group-separator" />}
            <div className="schematic-group-label">
              <span className="schematic-group-title">
                {inst.label} — {blockLabel(inst.block)}
              </span>
            </div>

            <div className={hasSubs ? 'schematic-sublanes' : undefined} style={hasSubs ? { position: 'relative' } : undefined}>
              {inst.rows.map((row, rowIndex) => {
                const isFirstRow = isFirstInst && rowIndex === 0;
                return (
                  <div key={row.id} className="schematic-row">
                    {/* Connector dust cell at the start of every row */}
                    <div className="schematic-connector" style={{ width: cs, height: cs, flexShrink: 0 }}>
                      <DustCell size={cs} />
                    </div>
                    {/* Render cells aligned to the global column list */}
                    {columns.map((col, ci) => (
                      <RowCell
                        key={ci}
                        col={col}
                        cell={row.cells[ci]}
                        cs={cs}
                        isFirstRow={isFirstRow}
                        instrument={inst.label}
                        block={inst.block}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
