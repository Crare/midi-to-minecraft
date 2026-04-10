import { RedstoneDustCell } from '@components/common/cells/RedstoneDustCell';
import { AnchorCell, SegmentRepeaterCell } from './SchematicCells';
import { blockLabel } from './schematicData';

// Cell renderer for react-window Grid
export function SchematicRowGridCell({ columnIndex, rowIndex, style, cellProps }: any) {
  const { virtualRows, anchors, cs, onColumnClick, onRowClick, lastPressed, setLastPressed } =
    cellProps;
  const item = virtualRows[rowIndex];
  if (item.type === 'label') {
    return (
      <div style={style} className="schematic-instrument-label-row">
        <div className="schematic-instrument-label-cell">
          {item.inst.label} — {blockLabel(item.inst.block)}
        </div>
      </div>
    );
  }
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
