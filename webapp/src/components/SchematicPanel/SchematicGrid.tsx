import { useState } from 'react';
import { Grid } from 'react-window';
import { SchematicRowGridCell } from './SchematicRowGridCell';

interface SchematicGridProps {
  grid: any;
  cellSize?: number;
  onColumnClick?: (el: HTMLElement) => void;
  onRowClick?: (el: HTMLElement) => void;
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

  // Calculate the grid's pixel width, but never exceed 100% of the parent
  const gridContentWidth = totalCols * (cs - 2);

  // Compute total number of rows (sum of all instrument rows)
  const rowCount = instruments.reduce(
    (sum: number, inst: any) => sum + (Array.isArray(inst.rows) ? inst.rows.length : 0),
    0,
  );

  // Helper to get instrument/row for a given index
  function getRowByIndex(index: number) {
    let idx = index;
    for (const inst of instruments) {
      if (Array.isArray(inst.rows)) {
        if (idx < inst.rows.length) {
          return { inst, row: inst.rows[idx] };
        }
        idx -= inst.rows.length;
      }
    }
    return null;
  }

  // Custom cell renderer to avoid building a virtualRows array
  const cellComponent = (props: any) => {
    // cellProps will be injected by react-window Grid
    return <SchematicRowGridCell {...props} />;
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto', maxWidth: '100%' }}>
      <Grid
        columnCount={totalCols}
        columnWidth={cs + 2}
        rowCount={rowCount}
        rowHeight={cs + 2}
        cellComponent={cellComponent}
        style={{ width: gridContentWidth, maxWidth: '100%' }}
        cellProps={{
          cellProps: {
            getRowByIndex,
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
