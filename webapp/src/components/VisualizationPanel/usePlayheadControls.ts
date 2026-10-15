import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject, PointerEvent as ReactPointerEvent } from 'react';
import type { PlayheadPositionOptions } from './useTimelineCanvas';

const IDLE_DRAG = { active: false, pointerId: null as number | null, grabOffsetTicks: 0 };
const PAGE_TICKS = 50;
const SHIFT_STEP_TICKS = 10;

interface UsePlayheadControlsArgs {
  hasTracks: boolean;
  maxVisibleTick: number;
  playheadTickRef: MutableRefObject<number>;
  setPlayheadPosition: (tick: number, options?: PlayheadPositionOptions) => void;
  pointerToTick: (clientX: number) => number;
  stopPlayback: () => void;
}

/** Pointer dragging and keyboard (slider) control of the playhead. */
export function usePlayheadControls({
  hasTracks,
  maxVisibleTick,
  playheadTickRef,
  setPlayheadPosition,
  pointerToTick,
  stopPlayback,
}: UsePlayheadControlsArgs) {
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ ...IDLE_DRAG });

  const finishDrag = useCallback(() => {
    dragRef.current = { ...IDLE_DRAG };
    setDragging(false);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!hasTracks) return;

    event.preventDefault();
    event.stopPropagation();
    stopPlayback();
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      grabOffsetTicks: playheadTickRef.current - pointerToTick(event.clientX),
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return;

    event.preventDefault();
    const nextTick = Math.min(
      maxVisibleTick + 1,
      pointerToTick(event.clientX) + dragRef.current.grabOffsetTicks
    );
    setPlayheadPosition(nextTick, { syncState: true, syncScroll: true, follow: 'visible' });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    finishDrag();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? SHIFT_STEP_TICKS : 1;
    const current = Math.round(playheadTickRef.current);
    let next: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
    else if (event.key === 'PageUp') next = current + PAGE_TICKS;
    else if (event.key === 'PageDown') next = current - PAGE_TICKS;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = maxVisibleTick;
    if (next === null) return;
    event.preventDefault();
    setPlayheadPosition(Math.min(maxVisibleTick, Math.max(0, next)), {
      syncState: true,
      syncScroll: true,
    });
  };

  return {
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: finishDrag,
      onKeyDown,
    },
  };
}
