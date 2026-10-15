import { useRef, useState, type PointerEvent, type ReactNode, type Ref, type RefCallback, type MutableRefObject } from 'react';

interface DragScrollAreaProps {
  className?: string;
  children?: ReactNode;
  containerRef?: Ref<HTMLDivElement>;
}

export default function DragScrollArea({ className = '', children, containerRef: externalRef }: DragScrollAreaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; pointerId: number | null; lastClientX: number }>({ active: false, pointerId: null, lastClientX: 0 });
  const [dragging, setDragging] = useState(false);

  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;

    if (!externalRef) return;
    if (typeof externalRef === 'function') {
      externalRef(node);
      return;
    }

    (externalRef as MutableRefObject<HTMLDivElement | null>).current = node;
  };

  const finishDrag = () => {
    dragRef.current = { active: false, pointerId: null, lastClientX: 0 };
    setDragging(false);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      lastClientX: event.clientX,
    };

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;

    const container = containerRef.current;
    if (!container) return;

    const deltaX = event.clientX - dragRef.current.lastClientX;
    dragRef.current.lastClientX = event.clientX;
    container.scrollLeft -= deltaX;
  };

  const onPointerUp = () => {
    finishDrag();
  };

  const onPointerCancel = () => {
    finishDrag();
  };

  const classes = ['drag-scroll-area', className, dragging ? 'dragging' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setContainerRef}
      className={classes}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerCancel}
      onDragStart={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}