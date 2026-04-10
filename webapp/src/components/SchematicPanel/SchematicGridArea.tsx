import { useRef } from 'react';
import SchematicGrid from './SchematicGrid';

interface SchematicGridAreaProps {
  grid: any;
  cellSize: number;
  maxWidth?: number;
  onIndicatorChange?: (x: number) => void;
  onHIndicatorChange?: (y: number) => void;
}

export default function SchematicGridArea({
  grid,
  cellSize,
  maxWidth,
  onIndicatorChange,
  onHIndicatorChange,
}: SchematicGridAreaProps) {
  // const [indicatorX, setIndicatorX] = React.useState(15);
  // const [indicatorY, setIndicatorY] = React.useState(30);
  const contentRef = useRef<HTMLDivElement>(null);
  // const indicatorDragRef = useRef<any>({ active: false, startClientX: 0, startX: 0 });
  // const hIndicatorDragRef = useRef<any>({ active: false, startClientY: 0, startY: 0 });

  // const panelContainerRef = useRef<HTMLDivElement>(null);
  // const panelWidth = useContainerWidth(panelContainerRef);

  // Handlers for vertical indicator (X)
  // const onIndicatorPointerDown = React.useCallback(
  //   (e: React.PointerEvent<HTMLButtonElement>) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     indicatorDragRef.current = { active: true, startClientX: e.clientX, startX: indicatorX };
  //     e.currentTarget.setPointerCapture(e.pointerId);
  //   },
  //   [indicatorX],
  // );

  // const onIndicatorPointerMove = React.useCallback(
  //   (e: React.PointerEvent<HTMLButtonElement>) => {
  //     if (!indicatorDragRef.current.active) return;
  //     const delta = e.clientX - indicatorDragRef.current.startClientX;
  //     const maxX = contentRef.current ? contentRef.current.scrollWidth : 999999;
  //     const newX = Math.max(0, Math.min(indicatorDragRef.current.startX + delta, maxX));
  //     setIndicatorX(newX);
  //     if (onIndicatorChange) onIndicatorChange(newX);
  //   },
  //   [onIndicatorChange],
  // );

  // const onIndicatorPointerUp = React.useCallback(() => {
  //   indicatorDragRef.current.active = false;
  // }, []);

  // // Handlers for horizontal indicator (Y)
  // const onHIndicatorPointerDown = React.useCallback(
  //   (e: React.PointerEvent<HTMLButtonElement>) => {
  //     e.preventDefault();
  //     e.stopPropagation();
  //     hIndicatorDragRef.current = { active: true, startClientY: e.clientY, startY: indicatorY };
  //     e.currentTarget.setPointerCapture(e.pointerId);
  //   },
  //   [indicatorY],
  // );

  // const onHIndicatorPointerMove = React.useCallback(
  //   (e: React.PointerEvent<HTMLButtonElement>) => {
  //     if (!hIndicatorDragRef.current.active) return;
  //     const delta = e.clientY - hIndicatorDragRef.current.startClientY;
  //     const maxY = contentRef.current ? contentRef.current.offsetHeight : 999999;
  //     const newY = Math.max(0, Math.min(hIndicatorDragRef.current.startY + delta, maxY));
  //     setIndicatorY(newY);
  //     if (onHIndicatorChange) onHIndicatorChange(newY);
  //   },
  //   [onHIndicatorChange],
  // );

  // const onHIndicatorPointerUp = React.useCallback(() => {
  //   hIndicatorDragRef.current.active = false;
  // }, []);

  // // Click handlers for columns/rows
  // const onColumnClick = React.useCallback(
  //   (el: HTMLElement) => {
  //     const content = contentRef.current;
  //     if (!content) return;
  //     const x =
  //       el.getBoundingClientRect().left - content.getBoundingClientRect().left + el.offsetWidth / 2;
  //     setIndicatorX(Math.max(0, x));
  //     if (onIndicatorChange) onIndicatorChange(Math.max(0, x));
  //   },
  //   [onIndicatorChange],
  // );

  // const onRowClick = React.useCallback(
  //   (el: HTMLElement) => {
  //     const content = contentRef.current;
  //     if (!content) return;
  //     const y =
  //       el.getBoundingClientRect().top - content.getBoundingClientRect().top + el.offsetHeight / 2;
  //     setIndicatorY(Math.max(0, y));
  //     if (onHIndicatorChange) onHIndicatorChange(Math.max(0, y));
  //   },
  //   [onHIndicatorChange],
  // );

  return (
    // <div
    //   className="schematic-content-x-scroll"
    //   style={{
    //     maxWidth: maxWidth ? Math.min(maxWidth, window.innerWidth) : '100vw',
    //     width: '100%',
    //   }}
    // >
    <div
      ref={contentRef}
      className="schematic-content"
      style={
        {
          // minWidth: 0,
          // width: 'max-content',
          // maxWidth: maxWidth ? Math.min(maxWidth, window.innerWidth) : '100vw',
          // overflowX: 'auto',
        }
      }
    >
      {/* {grid?.instruments?.length > 0 && (
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
      )} */}
      {grid.instruments.length === 0 ? (
        <p className="hint">No notes to display.</p>
      ) : (
        <SchematicGrid
          grid={grid}
          cellSize={cellSize}
          // onColumnClick={onColumnClick}
          // onRowClick={onRowClick}
        />
      )}
    </div>
    // </div>
  );
}
