import { useMemo, useState } from 'react';
import { Grid } from 'react-window';
import { SchematicRowGridCell } from './SchematicRowGridCell';

interface SchematicGridProps {
  grid: any;
  cellSize?: number;
  onColumnClick?: (el: HTMLElement) => void;
  onRowClick?: (el: HTMLElement) => void;
  currentTick?: number;
}

export default function SchematicGrid({
  grid,
  cellSize,
  onColumnClick,
  onRowClick,
  currentTick = 0,
}: SchematicGridProps) {
  const cs = cellSize ?? 32;
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  if (!grid || !Array.isArray(grid.instruments) || grid.instruments.length === 0) return null;

  const { instruments, anchors } = grid;
  const totalCols = 1 + anchors.length * 2;
  const virtualRows = useMemo(() => {
    if (!Array.isArray(instruments)) return [];
    const rows: any[] = [];
    // Insert a synthetic header row as the first row
    rows.push({ type: 'header' });
    // rows.push({ type: 'label' });
    instruments.forEach((inst: any) => {
      if (Array.isArray(inst.rows)) {
        inst.rows.forEach((row: any) => {
          rows.push({ type: 'data', inst, row });
        });
      }
    });
    return rows;
  }, [instruments]);

  // Calculate the grid's pixel width, but never exceed 100% of the parent
  const gridContentWidth = totalCols * (cs - 2);

  // Render header row for ticks
  const headerCells = [];
  headerCells.push(
    <div
      key="header-connector"
      className="schematic-header-cell schematic-header-connector"
      style={{
        width: cs - 2,
        height: cs / 1.5,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        background: '#f5f5f5',
        border: '1px solid #c0c4c8',
        boxSizing: 'border-box',
      }}
    >
      Tick
    </div>,
  );
  for (let col = 1; col < totalCols; col++) {
    // Each anchor has two columns: segment and anchor
    const tickIdx = Math.floor((col - 1) / 2);
    const isAnchor = (col - 1) % 2 === 1;
    headerCells.push(
      <div
        key={`header-${col}`}
        className={
          'schematic-header-cell' +
          (isAnchor && tickIdx === currentTick ? ' schematic-header-current-tick' : '')
        }
        style={{
          width: cs - 2,
          height: cs / 1.5,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: isAnchor && tickIdx === currentTick ? 900 : 400,
          background: isAnchor && tickIdx === currentTick ? '#ffe066' : '#f5f5f5',
          border: '1px solid #c0c4c8',
          boxSizing: 'border-box',
        }}
      >
        {isAnchor ? tickIdx : ''}
      </div>,
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', maxWidth: '100%' }}>
      <Grid
        columnCount={totalCols}
        columnWidth={cs + 2}
        rowCount={virtualRows.length}
        rowHeight={cs + 2}
        cellComponent={SchematicRowGridCell}
        style={{ width: gridContentWidth, maxWidth: '100%' }}
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
