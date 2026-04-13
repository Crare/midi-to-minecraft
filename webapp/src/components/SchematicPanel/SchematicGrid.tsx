import ErrorBoundary from '@components/common/ErrorBoundary';
import { minecraftBlockToBlock, supportColorByBlock } from '@constants';
import Box from '@mui/material/Box';
// Tooltip info type
interface NoteTooltipInfo {
  x: number;
  y: number;
  block: string;
  uses: number;
  tick: number;
  instrument: string;
  lane: string;
}

import { useEffect, useRef, useState } from 'react';
import { InstrumentGrid } from '.';
import { blockLabel } from './schematicData';

interface SchematicGridProps {
  grid?: InstrumentGrid;
  cellSize?: number;
  width: number; // width from parent
}

interface GridCell {
  type: string;
  ticks?: number;
  note?: number;
  pitch?: string;
  instrument?: string;
  block?: string;
  event?: any;
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
  // Calculate label width dynamically based on the longest label
  const ctxForLabel =
    typeof window !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  let labelWidth = 80;
  if (ctxForLabel && instruments.length > 0) {
    ctxForLabel.font = '600 15px sans-serif';
    const maxLabel = instruments
      .map((inst) => inst?.title ?? '')
      .reduce((a, b) => (a.length > b.length ? a : b), '');
    const measured = ctxForLabel.measureText(maxLabel);
    labelWidth = Math.ceil(measured.width) + 24; // 24px padding for left/right
  }
  const cellGap = 2;
  const fullGridWidth = labelWidth + columnCount * (cs + cellGap);
  const canvasWidth = width > 0 ? width - cs : fullGridWidth - cs;
  // Add one row for tick row
  const canvasHeight = Math.min((rowCount + 1) * (cs + cellGap), 800);

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

  const renderCanvas = () => {
    // console.log('instruments', instruments);
    // console.log('instrumentRows', instrumentRows);
    console.log('visibleInstrumentRows', visibleInstrumentRows);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw instrument rows, shifted down by one row
    ctx.font = '600 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let rowIdx = 0; rowIdx < rowCount; ++rowIdx) {
      let y = (rowIdx + 1) * (cs + cellGap);
      // Draw instrument label
      ctx.fillStyle = '#222';
      ctx.font = '600 15px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      // Draw label aligned left, with 8px left padding
      const instrument = instruments[rowIdx]?.title.split(' ')[0] ?? '';
      const lane = instruments[rowIdx]?.title.split(' ')[2] ?? '';
      // if (lane == 0) {
      //   ctx.fillText(`${instrument}`, 8, y);
      // }
      ctx.fillText(`${instrument} lane ${lane}`, 8, y + cs / 2);

      // Draw cells
      const row = visibleInstrumentRows[rowIdx];
      for (let colIdx = 0; colIdx < row.length; ++colIdx) {
        const cell = row[colIdx] as GridCell;
        // x is relative to visible area, shifted by pixelOffset for smooth scroll
        const x = labelWidth + colIdx * (cs + cellGap) + pixelOffset;
        if (x + cs < labelWidth) continue; // Don't draw left of visible area
        if (x > canvasWidth) continue; // Don't draw outside visible area
        if (!cell) continue;
        if (cell.type === 'empty') {
          continue;
        } else if (cell.type === 'repeater') {
          // Draw gray background
          ctx.fillStyle = '#b8b8b8';
          ctx.fillRect(x, y, cs, cs);
          ctx.fillStyle = '#e7e7e7';
          ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);

          // Draw red horizontal line in the middle
          ctx.strokeStyle = '#b71c1c';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + cs - 4);
          ctx.lineTo(x + cs - 2, y + cs - 4);
          ctx.stroke();

          // Draw red square near top right corner
          ctx.fillStyle = '#b71c1c';
          ctx.fillRect(x + cs - 10, y + cs - 10, 6, 6);

          // Draw red square near bottom left corner
          ctx.fillRect(x + 4, y + cs - 10, 6, 6);

          // Draw ticks number in white, centered
          ctx.fillStyle = '#000';
          ctx.font = '600 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(cell.ticks), Math.round(x + cs / 2), Math.round(y + cs / 2));
        } else if (cell.type === 'dust') {
          // Draw a horizontal red line (dust)
          ctx.strokeStyle = '#b71c1c';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + 4, y + cs / 2);
          ctx.lineTo(x + cs - 4, y + cs / 2);
          ctx.stroke();
        } else if (cell.type === 'split') {
          // Draw a T-junction: horizontal and vertical red lines
          ctx.strokeStyle = '#b71c1c';
          ctx.lineWidth = 4;
          // Horizontal
          ctx.beginPath();
          ctx.moveTo(x + 4, y + cs / 2);
          ctx.lineTo(x + cs - 4, y + cs / 2);
          ctx.stroke();
          // Vertical
          ctx.beginPath();
          ctx.moveTo(x + cs / 2, y + 4);
          ctx.lineTo(x + cs / 2, y + cs - 4);
          ctx.stroke();
        } else if (cell.type === 'note') {
          ctx.fillStyle = cell.block
            ? supportColorByBlock[minecraftBlockToBlock(cell.block)]
            : '#8bc34a';
          ctx.fillRect(x, y, cs, cs);
          ctx.fillStyle = '#222';
          ctx.font = '600 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Support both cell.note and cell.event.note for compatibility
          const noteVal = cell.note ?? (cell.event && cell.event.note) ?? '?';
          // Use integer coordinates for sharp rendering
          ctx.fillText(String(noteVal), Math.round(x + cs / 2), Math.round(y + cs / 2));
        }
      }
    }
  };

  useEffect(() => {
    renderCanvas();
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

  // Tooltip state
  const [tooltip, setTooltip] = useState<NoteTooltipInfo | null>(null);
  // Helper to get cell under mouse
  function getNoteCellAt(mouseX: number, mouseY: number): NoteTooltipInfo | null {
    // Adjust for canvas position
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = mouseX - rect.left;
    const y = mouseY - rect.top;
    // Find row
    let yCursor = cs + cellGap; // skip tick row
    for (let rowIdx = 0; rowIdx < rowCount; ++rowIdx) {
      // TODO: handle extra gap if present
      if (y >= yCursor && y < yCursor + cs) {
        // Find col
        for (let colIdx = 0; colIdx < visibleInstrumentRows[rowIdx].length; ++colIdx) {
          const cellX = labelWidth + colIdx * (cs + cellGap) + pixelOffset;
          if (x >= cellX && x < cellX + cs) {
            const cell = visibleInstrumentRows[rowIdx][colIdx] as GridCell;
            if (cell && cell.type === 'note') {
              // Extract info
              const instrument = instruments[rowIdx]?.title.split(' ')[0] ?? '';
              const lane = instruments[rowIdx]?.title.split(' ')[2] ?? '';
              // remove "minecraft." prefix for readability
              const block = cell.block ? blockLabel(cell.block) : '?';
              const uses = cell.note ?? 0;
              const tick = cell.tick ?? '?';
              return {
                x: mouseX,
                y: mouseY,
                block,
                uses,
                tick,
                instrument,
                lane,
              };
            } else if (cell && cell.type === 'repeater') {
              const instrument = instruments[rowIdx]?.title.split(' ')[0] ?? '';
              const lane = instruments[rowIdx]?.title.split(' ')[2] ?? '';
              const block = 'repeater';
              const uses = cell.ticks;
              const tick = cell.tick ?? '?';
              return {
                x: mouseX,
                y: mouseY,
                block,
                uses,
                tick,
                instrument,
                lane,
              };
            }
          }
        }
      }
      yCursor += cs + cellGap;
    }
    return null;
  }
  // Mouse move for tooltip
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const info = getNoteCellAt(e.clientX, e.clientY);
    setTooltip(info);
  };
  const handleCanvasMouseLeave = () => {
    setTooltip(null);
  };

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
          <div style={{ position: 'relative' }}>
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
              onMouseMove={(e) => {
                handleMouseMove(e);
                handleCanvasMouseMove(e);
              }}
              onMouseUp={handleMouseUp}
              onMouseLeave={(e) => {
                handleMouseUp();
                handleCanvasMouseLeave();
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            {tooltip && (
              <div
                style={{
                  position: 'fixed',
                  left: tooltip.x + 12,
                  top: tooltip.y + 12,
                  background: 'rgba(30,30,30,0.97)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 6,
                  pointerEvents: 'none',
                  zIndex: 1000,
                  fontSize: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  minWidth: 180,
                }}
              >
                <div>
                  <b>Block:</b> {tooltip.block}
                </div>
                <div>
                  {tooltip.block === 'repeater' ? <b>Delay: </b> : <b>Note: </b>}
                  {tooltip.uses}
                </div>
                <div>
                  <b>Tick:</b> {tooltip.tick}
                </div>
                <div>
                  <b>Instrument:</b> {tooltip.instrument}
                </div>
                <div>
                  <b>Lane:</b> {tooltip.lane}
                </div>
              </div>
            )}
          </div>
        </div>
      </Box>
    </ErrorBoundary>
  );
}
