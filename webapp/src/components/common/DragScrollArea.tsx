import { useRef, useState, ReactNode, RefObject } from 'react';

interface DragScrollAreaProps {
  className?: string;
  children?: ReactNode;
  containerRef?: RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void);
}

export default function DragScrollArea({
  className = '',
  children,
  containerRef: externalRef,
}: DragScrollAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; pointerId: number | null; lastClientX: number }>({
    active: false,
    pointerId: null,
    lastClientX: 0,
  });
  const [dragging, setDragging] = useState(false);

  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (!externalRef) return;
    if (typeof externalRef === 'function') {
      externalRef(node);
      return;
    }
    (externalRef as RefObject<HTMLDivElement>).current = node;
  };

  const finishDrag = () => {
    dragRef.current = { active: false, pointerId: null, lastClientX: 0 };
    setDragging(false);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      lastClientX: event.clientX,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;
    if (containerRef.current) {
      const dx = event.clientX - dragRef.current.lastClientX;
      containerRef.current.scrollLeft -= dx;
    }
    dragRef.current.lastClientX = event.clientX;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId === event.pointerId) {
      finishDrag();
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={`drag-scroll-area${className ? ` ${className}` : ''}${dragging ? ' dragging' : ''}`}
      ref={setContainerRef}
      style={{ overflow: 'auto', cursor: dragging ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {children}
    </div>
  );
}
