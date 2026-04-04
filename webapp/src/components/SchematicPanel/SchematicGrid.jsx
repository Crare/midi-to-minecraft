import { playPlacementSound } from '../../audio/noteblockAudio';
import { buildCells, blockLabel, decomposeDelay } from './schematicData';
import { NoteCell, RepeaterCell, DustCell, BranchStartCell, CELL } from './SchematicCells';
import HarmonicRail from './HarmonicRail';

export default function SchematicGrid({ groups, cellSize }) {
  const cs = cellSize ?? CELL;
  if (groups.length === 0) return null;

  const multipleGroups = groups.length > 1;

  return (
    <div className="schematic-grid">
      {groups.map((group, groupIndex) => {
        const isHarmonic = group.sublanes.length > 1;
        const isFirstGroup = groupIndex === 0;

        return (
          <div key={group.id} className="schematic-group">
            {!isFirstGroup && <div className="schematic-group-separator" />}
            {multipleGroups && (
              <div className="schematic-group-label">{group.label}</div>
            )}
            {/* Sublanes wrapper — relative so the HarmonicRail SVG can be absolutely positioned */}
            <div
              className={isHarmonic ? 'schematic-sublanes' : undefined}
              style={isHarmonic ? { position: 'relative' } : undefined}
            >
              {isHarmonic && <HarmonicRail count={group.sublanes.length} cs={cs} />}
              {group.sublanes.map((sublane, sublaneIndex) => {
                const isFirstRow = isFirstGroup && sublaneIndex === 0;
                const branchInfo = sublane.branchFrom
                  ? { sourceId: sublane.branchFrom.sourceId, savedTicks: sublane.branchFrom.savedTicks }
                  : null;
                const cells = buildCells(sublane.notes, { branchInfo });

                return (
                  <div key={sublane.id} className="schematic-row">
                    {/* Connector column — empty for harmonic rows (HarmonicRail draws here) */}
                    <div className="schematic-connector" style={{ width: cs, height: cs, flexShrink: 0 }}>
                      {!isHarmonic && <DustCell size={cs} />}
                    </div>
                    {cells.map((cell) => {
                      if (cell.type === 'note') {
                        return (
                          <div
                            key={cell.key}
                            className="schematic-cell schematic-cell-tip"
                            tabIndex={0}
                            role="button"
                            aria-label={`${cell.instrument} - ${cell.pitch || 'drum'}`}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => void playPlacementSound({ instrument: cell.instrument, note: cell.note, pitch: cell.pitch })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                void playPlacementSound({ instrument: cell.instrument, note: cell.note, pitch: cell.pitch });
                              }
                            }}
                          >
                            <NoteCell block={cell.block} instrument={cell.instrument} size={cs} />
                            <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
                              {cell.instrument}<br />
                              {cell.pitch || 'drum'}<br />
                              Use count: {cell.useCount}<br />
                              {blockLabel(cell.block)}
                            </span>
                          </div>
                        );
                      }
                      if (cell.type === 'repeater') {
                        return (
                          <div key={cell.key} className="schematic-cell schematic-cell-tip" tabIndex={0}>
                            <RepeaterCell ticks={cell.ticks} size={cs} />
                            <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
                              Repeater: {cell.ticks} tick{cell.ticks !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      }
                      if (cell.type === 'dust') {
                        return (
                          <div key={cell.key} className="schematic-cell">
                            <DustCell size={cs} />
                          </div>
                        );
                      }
                      if (cell.type === 'branch-start') {
                        return (
                          <div key={cell.key} className="schematic-cell schematic-cell-tip" tabIndex={0}>
                            <BranchStartCell sourceId={cell.sourceId} savedTicks={cell.savedTicks} size={cs} />
                            <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
                              T-junction: branch from {cell.sourceId}<br />
                              Saves {cell.savedTicks} ticks<br />
                              (~{decomposeDelay(cell.savedTicks).length} fewer repeater{decomposeDelay(cell.savedTicks).length !== 1 ? 's' : ''})
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
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
