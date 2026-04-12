import ErrorBoundary from '@components/common/ErrorBoundary';
import Box from '@mui/material/Box';
import { useEffect, useRef, useState } from 'react';
import { InstrumentGrid } from '.';

interface SchematicGridProps {
  grid?: InstrumentGrid;
  cellSize?: number;
  width: number; // width from parent
}

export default function SchematicGrid({ grid, cellSize, width }: SchematicGridProps) {
  // Horizontal scroll state and drag logic
  const [scrollX, setScrollX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const scrollStartX = useRef<number>(0);
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
    // console.warn('Column count is very high:', columnCount, '- capping to 512 for rendering.');
    columnCount = 512;
  }

  // Calculate full grid size
  const labelWidth = 80;
  const cellGap = 2;
  const fullGridWidth = labelWidth + columnCount * (cs + cellGap);
  const canvasWidth = width > 0 ? width - cs : fullGridWidth - cs;
  const canvasHeight = Math.min(rowCount * (cs + cellGap), 800);

  // Clamp scrollX
  const maxScrollX = Math.max(0, fullGridWidth - canvasWidth);
  const clampedScrollX = Math.max(0, Math.min(scrollX, maxScrollX));

  // Truncate each row to visible columns based on scrollX
  const firstVisibleCol = Math.floor(clampedScrollX / (cs + cellGap));
  const maxColumns = Math.max(1, Math.floor((width - labelWidth) / (cs + cellGap)));
  const renderColumnCount = Math.min(columnCount - firstVisibleCol, maxColumns);
  const visibleInstrumentRows = instrumentRows.map((row) =>
    row.slice(firstVisibleCol, firstVisibleCol + renderColumnCount),
  );
  // Pixel offset for smooth scrolling
  const pixelOffset = -(clampedScrollX % (cs + cellGap));

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // ...existing code...
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw tick numbers above each visible column
    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#444';
    for (let colIdx = 0; colIdx < renderColumnCount; ++colIdx) {
      const tick = firstVisibleCol + colIdx;
      const x = labelWidth + colIdx * (cs + cellGap) + pixelOffset + cs / 2;
      if (x + cs / 2 < labelWidth) continue;
      if (x - cs / 2 > canvasWidth) continue;
      ctx.fillText(String(tick), x, 12);
    }
    ctx.restore();

    // Draw each row
    ctx.font = '600 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let rowIdx = 0; rowIdx < rowCount; ++rowIdx) {
      const y = rowIdx * (cs + cellGap);
      // Draw instrument label
      ctx.fillStyle = '#222';
      ctx.fillText(instruments[rowIdx]?.title ?? '', labelWidth - 8, y + cs / 2);

      // Draw cells
      const row = visibleInstrumentRows[rowIdx];
      for (let colIdx = 0; colIdx < row.length; ++colIdx) {
        const cell = row[colIdx];
        // x is relative to visible area, shifted by pixelOffset for smooth scroll
        const x = labelWidth + colIdx * (cs + cellGap) + pixelOffset;
        if (x + cs < labelWidth) continue; // Don't draw left of visible area
        if (x > canvasWidth) continue; // Don't draw outside visible area
        if (!cell) continue;
        if (cell.type === 'repeater') {
          ctx.fillStyle = '#e6b800';
          ctx.fillRect(x, y, cs, cs);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(String(cell.ticks), x + cs / 2, y + cs / 2);
        } else if (cell.type === 'split') {
          ctx.fillStyle = '#b71c1c';
          ctx.beginPath();
          ctx.arc(x + cs / 2, y + cs / 2, cs / 3, 0, 2 * Math.PI);
          ctx.fill();
        } else if (cell.type === 'note') {
          ctx.fillStyle = '#8bc34a';
          ctx.fillRect(x, y, cs, cs);
          ctx.fillStyle = '#222';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText(String(cell.event.note), x + cs / 2, y + cs / 2);
        }
      }
    }
  }, [grid, cs, rowCount, columnCount, canvasWidth, canvasHeight, clampedScrollX, pixelOffset]);

  // Drag handlers for horizontal scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartX.current = clampedScrollX;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX.current === null) return;
    const dx = dragStartX.current - e.clientX;
    setScrollX(Math.max(0, Math.min(scrollStartX.current + dx, maxScrollX)));
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartX.current = null;
  };
  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    scrollStartX.current = clampedScrollX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStartX.current === null) return;
    const dx = dragStartX.current - e.touches[0].clientX;
    setScrollX(Math.max(0, Math.min(scrollStartX.current + dx, maxScrollX)));
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartX.current = null;
  };

  // Prevent text selection while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <ErrorBoundary>
      <Box
        sx={{
          width: '100%',
          overflowX: 'hidden',
          maxWidth: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div style={{ width: '100%', minWidth: 400, overflowX: 'hidden' }}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            style={{
              display: 'block',
              width: canvasWidth,
              height: canvasHeight,
              maxHeight: 800,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      </Box>
    </ErrorBoundary>
  );
}
