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
      // rows.push({ type: 'label', inst });
      if (Array.isArray(inst.rows)) {
        inst.rows.forEach((row: any) => {
          rows.push({ type: 'data', inst, row });
        });
      }
    });

    // console.log('virtualRows', rows);
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
