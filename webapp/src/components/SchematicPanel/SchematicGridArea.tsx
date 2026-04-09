import React from 'react';
import DragScrollArea from '../common/DragScrollArea';
import SchematicGrid from './SchematicGrid';

interface SchematicGridAreaProps {
  grid: any;
  cellSize: number;
  indicatorX: number;
  indicatorY: number;
  onIndicatorPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onIndicatorPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onIndicatorPointerUp: () => void;
  onHIndicatorPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onHIndicatorPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onHIndicatorPointerUp: () => void;
  onColumnClick: (el: HTMLElement) => void;
  onRowClick: (el: HTMLElement) => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

export default function SchematicGridArea({
  grid,
  cellSize,
  indicatorX,
  indicatorY,
  onIndicatorPointerDown,
  onIndicatorPointerMove,
  onIndicatorPointerUp,
  onHIndicatorPointerDown,
  onHIndicatorPointerMove,
  onHIndicatorPointerUp,
  onColumnClick,
  onRowClick,
  contentRef,
}: SchematicGridAreaProps) {
  return (
    <DragScrollArea className="schematic-scroll">
      <div ref={contentRef} className="schematic-content">
        {grid?.instruments?.length > 0 && (
          <>
            <button
              type="button"
              className="schematic-indicator"
              style={{ left: `${indicatorX}px` }}
              onPointerDown={onIndicatorPointerDown}
              onPointerMove={onIndicatorPointerMove}
              onPointerUp={onIndicatorPointerUp}
              onPointerCancel={onIndicatorPointerUp}
              aria-label="Drag to mark column build progress"
            >
              <span className="schematic-indicator-line" aria-hidden="true" />
              <span className="schematic-indicator-head" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="schematic-h-indicator"
              style={{ top: `${indicatorY}px` }}
              onPointerDown={onHIndicatorPointerDown}
              onPointerMove={onHIndicatorPointerMove}
              onPointerUp={onHIndicatorPointerUp}
              onPointerCancel={onHIndicatorPointerUp}
              aria-label="Drag to mark row build progress"
            >
              <span className="schematic-h-indicator-line" aria-hidden="true" />
              <span className="schematic-h-indicator-head" aria-hidden="true" />
            </button>
          </>
        )}
        {grid.instruments.length === 0 ? (
          <p className="hint">No notes to display.</p>
        ) : (
          <SchematicGrid
            grid={grid}
            cellSize={cellSize}
            onColumnClick={onColumnClick}
            onRowClick={onRowClick}
          />
        )}
      </div>
    </DragScrollArea>
  );
}
