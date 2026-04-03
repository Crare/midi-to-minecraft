import { useRef, useState } from 'react';

export default function DragScrollArea({ className = '', children, containerRef: externalRef }) {
  const containerRef = useRef(null);
  const dragRef = useRef({ active: false, pointerId: null, lastClientX: 0 });
  const [dragging, setDragging] = useState(false);

  const setContainerRef = (node) => {
    containerRef.current = node;

    if (!externalRef) return;
    if (typeof externalRef === 'function') {
      externalRef(node);
      return;
    }

    externalRef.current = node;
  };

  const finishDrag = () => {
    dragRef.current = { active: false, pointerId: null, lastClientX: 0 };
    setDragging(false);
  };

  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      lastClientX: event.clientX,
    };

    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
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