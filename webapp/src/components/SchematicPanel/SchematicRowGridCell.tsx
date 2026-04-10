import { RedstoneDustCell } from '@components/common/cells/RedstoneDustCell';
import { AnchorCell, SegmentRepeaterCell } from './SchematicCells';

// Cell renderer for react-window Grid
export function SchematicRowGridCell({ columnIndex, rowIndex, style, cellProps }: any) {
  const {
    virtualRows,
    anchors,
    cs,
    onColumnClick,
    onRowClick,
    lastPressed,
    setLastPressed,
    currentTick,
  } = cellProps;
  const item = virtualRows[rowIndex];
  // Render header row as the first row
  if (item.type === 'header') {
    // Connector column
    if (columnIndex === 0) {
      return (
        <div
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            background: '#f5f5f5',
            border: '1px solid #c0c4c8',
            boxSizing: 'border-box',
          }}
          className="schematic-header-cell schematic-header-connector"
        >
          Tick
        </div>
      );
    }
    // Tick columns: show anchor tick value for anchor columns, blank for segment columns
    const anchorIdx = Math.floor((columnIndex - 1) / 2);
    const isAnchor = (columnIndex - 1) % 2 === 1;
    const tickValue = isAnchor && anchors[anchorIdx] !== undefined ? anchors[anchorIdx] : '';
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: isAnchor && tickValue === currentTick ? 900 : 400,
          background: isAnchor && tickValue === currentTick ? '#ffe066' : '#f5f5f5',
          border: '1px solid #c0c4c8',
          color: isAnchor && tickValue === currentTick ? '#222' : undefined,
          borderBottom: isAnchor && tickValue === currentTick ? '2px solid #e09f3e' : undefined,
          boxSizing: 'border-box',
        }}
        className={
          'schematic-header-cell' +
          (isAnchor && tickValue === currentTick ? ' schematic-header-current-tick' : '')
        }
      >
        {isAnchor ? tickValue : ''}
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
