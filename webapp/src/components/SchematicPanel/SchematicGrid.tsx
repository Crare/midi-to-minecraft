import { useMemo, useState } from 'react';
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
  const virtualRows = useMemo(() => {
    if (!Array.isArray(instruments)) return [];
    const rows: any[] = [];
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
