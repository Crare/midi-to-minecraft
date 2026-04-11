import { RedstoneDustCell } from '@components/common/cells/RedstoneDustCell';
import { AnchorCell, SegmentRepeaterCell } from './SchematicCells';

// Cell renderer for react-window Grid
export function SchematicRowGridCell({ columnIndex, rowIndex, style, cellProps }: any) {
  // console.log('SchematicRowGridCell, cellProps', cellProps);
  if (!cellProps) return null;
  const {
    getRowByIndex,
    anchors,
    cs,
    onColumnClick,
    onRowClick,
    lastPressed,
    setLastPressed,
    currentTick,
  } = cellProps;
  const item = getRowByIndex(rowIndex);
  if (!item) return null;
  const { inst, row } = item;
  if (columnIndex === 0) {
    return (
      <div style={style} className="schematic-td-connector">
        <button
          type="button"
          className="schematic-connector schematic-connector--sticky"
          style={{ width: cs, height: cs }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRowClick?.(e.currentTarget);
          }}
          aria-label="Move row marker here"
        >
          <RedstoneDustCell size={cs} />
        </button>
      </div>
    );
  }
  // Each anchor has two columns: segment and anchor
  const anchorIdx = Math.floor((columnIndex - 1) / 2);
  if ((columnIndex - 1) % 2 === 0) {
    // Segment column
    const seg = row.segments[anchorIdx] ?? [];
    return (
      <div style={style} className="schematic-td-seg">
        <div className="schematic-segment">
          {seg.map((cell: any, ri: number) =>
            cell.kind === 'dust' ? (
              <RedstoneDustCell key={ri} size={cs} />
            ) : (
              <SegmentRepeaterCell key={ri} cell={cell} cs={cs} />
            ),
          )}
        </div>
      </div>
    );
  } else {
    // Anchor cell
    return (
      <div style={style} className="schematic-td-anchor">
        <AnchorCell
          anchor={anchors[anchorIdx]}
          cell={row.anchorCells[anchorIdx]}
          cs={cs}
          instrument={inst.label}
          block={inst.block}
          isLastPressed={lastPressed === `${row.id}:${anchorIdx}`}
          onPress={() => setLastPressed(`${row.id}:${anchorIdx}`)}
        />
      </div>
    );
  }
}
