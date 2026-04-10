import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Grid } from 'react-window';
import { AnchorCell, DustCell, SegRepCell } from './SchematicCells';
import { blockLabel } from './schematicData';

// Portal tooltip hook

export function TooltipPortal({
  pos,
  children,
}: {
  pos: { x: number; y: number; below: boolean };
  children: React.ReactNode;
}) {
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

interface SchematicGridProps {
  grid: any;
  cellSize?: number;
  onColumnClick?: (el: HTMLElement) => void;
  onRowClick?: (el: HTMLElement) => void;
}

// Cell renderer for react-window Grid
function SchematicRowGridCell({ columnIndex, rowIndex, style, cellProps }: any) {
  // data: { virtualRows, anchors, cs, ... }
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
          <DustCell size={cs} />
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
              <DustCell key={ri} size={cs} />
            ) : (
              <SegRepCell key={ri} cell={cell} cs={cs} />
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

export default function SchematicGrid({
  grid,
  cellSize,
  onColumnClick,
  onRowClick,
}: SchematicGridProps) {
  const cs = cellSize ?? 32;
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  if (!grid || !Array.isArray(grid.instruments) || grid.instruments.length === 0) return null;

  const { instruments, anchors } = grid;
  const totalCols = 1 + anchors.length * 2;

  const virtualRows = useMemo(() => {
    if (!Array.isArray(instruments)) return [];
    const rows: any[] = [];
    instruments.forEach((inst: any) => {
      rows.push({ type: 'label', inst });
      if (Array.isArray(inst.rows)) {
        inst.rows.forEach((row: any) => {
          rows.push({ type: 'data', inst, row });
        });
      }
    });
    return rows;
  }, [instruments]);

  // const rowHeight = cs + 8;
  // const gridRef = useRef(null);

  // Virtualized grid rendering
  return (
    <div style={{ overflow: 'auto' }}>
      <Grid
        // ref={gridRef}
        columnCount={totalCols}
        columnWidth={cs}
        // height={Math.min(virtualRows.length * rowHeight, 600)}
        rowCount={virtualRows.length}
        rowHeight={cs + 8}
        cellComponent={SchematicRowGridCell}
        // width={Math.min(totalCols * cs, 1200)}
        cellProps={{
          cellProps: {
            virtualRows,
            anchors,
            cs,
            onColumnClick,
            onRowClick,
            lastPressed,
            setLastPressed,
          },
        }}
      />
    </div>
  );
}
