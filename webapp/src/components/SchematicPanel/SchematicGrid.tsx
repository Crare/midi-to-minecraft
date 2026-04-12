import ErrorBoundary from '@components/common/ErrorBoundary';
import Box from '@mui/material/Box';
import { useEffect, useRef } from 'react';
import { InstrumentGrid } from '.';

interface SchematicGridProps {
  grid?: InstrumentGrid;
  cellSize?: number;
  width: number; // width from parent
}

export default function SchematicGrid({ grid, cellSize, width }: SchematicGridProps) {
  const cs = cellSize ?? 32;
  // Type as any to allow .title property (TrackEvent has .title)
  const instruments: any[] = Array.isArray(grid?.instruments) ? grid?.instruments : [];
  if (instruments.length === 0) return null;

  // Prepare grid data
  const instrumentRows = instruments.map((inst: any) =>
    Array.isArray(inst.cells) ? inst.cells : [],
  );
  const rowCount = instrumentRows.length;
  let columnCount = instrumentRows.reduce((max, row) => Math.max(max, row.length), 0);
  if (columnCount > 512) {
    console.warn('Column count is very high:', columnCount, '- capping to 512 for rendering.');
    columnCount = 512;
  }

  // Calculate how many columns fit in the given width
  const labelWidth = 80;
  const cellGap = 2;
  const maxColumns = Math.max(1, Math.floor((width - labelWidth) / (cs + cellGap)));
  const renderColumnCount = Math.min(columnCount, maxColumns);
  const canvasWidth = width > 0 ? width : labelWidth + renderColumnCount * (cs + cellGap);
  const canvasHeight = Math.min(rowCount * (cs + cellGap), 800);

  // Truncate each row to the number of columns that fit
  const visibleInstrumentRows = instrumentRows.map((row) => row.slice(0, renderColumnCount));

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log('width', width);
    console.log(
      'canvasWidth',
      canvasWidth,
      'renderColumnCount',
      renderColumnCount,
      'maxColumns',
      maxColumns,
    );
    console.log('rowCount', rowCount, 'columnCount', columnCount);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = '600 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Draw each row
    for (let rowIdx = 0; rowIdx < rowCount; ++rowIdx) {
      const y = rowIdx * (cs + cellGap);
      // Draw instrument label
      ctx.fillStyle = '#222';
      ctx.fillText(instruments[rowIdx]?.title ?? '', labelWidth - 8, y + cs / 2);

      // Draw cells
      const row = visibleInstrumentRows[rowIdx];
      for (let colIdx = 0; colIdx < row.length; ++colIdx) {
        const cell = row[colIdx];
        const x = labelWidth + colIdx * (cs + cellGap);
        if (x + cs > canvasWidth) continue; // Don't draw outside visible area
        if (!cell) continue;
        if (cell.type === 'repeater') {
          // Draw repeater cell
          ctx.fillStyle = '#e6b800';
          ctx.fillRect(x, y, cs, cs);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(String(cell.ticks), x + cs / 2, y + cs / 2);
        } else if (cell.type === 'split') {
          // Draw split (redstone) cell
          ctx.fillStyle = '#b71c1c';
          ctx.beginPath();
          ctx.arc(x + cs / 2, y + cs / 2, cs / 3, 0, 2 * Math.PI);
          ctx.fill();
        } else if (cell.type === 'note') {
          // Draw note cell (block color + note number)
          ctx.fillStyle = '#8bc34a';
          ctx.fillRect(x, y, cs, cs);
          ctx.fillStyle = '#222';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(String(cell.event.note), x + cs / 2, y + cs / 2);
        }
      }
    }
  }, [grid, cs, rowCount, columnCount, canvasWidth, canvasHeight]);

  return (
    <ErrorBoundary>
      <Box sx={{ width: '100%', overflowX: 'auto', maxWidth: '100%' }}>
        <div style={{ width: '100%', minWidth: 400, overflowX: 'auto' }}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{ display: 'block', width: canvasWidth, height: canvasHeight, maxHeight: 800 }}
          />
        </div>
      </Box>
    </ErrorBoundary>
  );
}
