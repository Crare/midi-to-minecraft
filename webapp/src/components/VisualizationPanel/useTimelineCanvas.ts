import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { CanvasLane, CanvasOpts, SpriteStore } from '../../types';
import { playPlacementSound } from '../../audio/noteblockAudio';
import {
  computeLaneLayout,
  createSpriteStore,
  getNoteTooltipLines,
  hitTest,
  renderTracks,
  tickToX,
} from './canvasRenderer';

interface RenderParams extends CanvasOpts {
  layout: ReturnType<typeof computeLaneLayout>;
  width: number;
  lanes: CanvasLane[];
  timelineUnitCount: number;
}

export interface TooltipState {
  lines: string[];
  left: number;
  top: number;
  below: boolean;
}

export interface PlayheadPositionOptions {
  syncState?: boolean;
  syncScroll?: boolean;
  follow?: 'anchor' | 'visible';
  draw?: boolean;
}

interface UseTimelineCanvasArgs extends CanvasOpts {
  layout: ReturnType<typeof computeLaneLayout>;
  lanes: CanvasLane[];
  timelineUnitCount: number;
  maxVisibleTick: number;
  trackUnitSize: number;
  tracksOpen: boolean;
}

const KEY_PAN_STEP = 60;
const PAN_DRAG_THRESHOLD = 4;
const IDLE_PAN = { pointerId: null as number | null, startX: 0, startScroll: 0, moved: false };

/**
 * Owns the track canvas: drawing, horizontal scrolling (drag, wheel, keys),
 * resizing, note tooltips and the playhead position.
 */
export function useTimelineCanvas({
  layout,
  lanes,
  timelineUnitCount,
  maxVisibleTick,
  trackUnitSize,
  tracksOpen,
  showColor,
  showNumber,
  showSupport,
}: UseTimelineCanvasArgs) {
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [playheadTick, setPlayheadTick] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playheadRef = useRef<HTMLButtonElement>(null);
  const scrollLeftRef = useRef(0);
  const playheadTickRef = useRef(0);
  const drawFrameRef = useRef(0);
  const renderParamsRef = useRef<RenderParams | null>(null);
  const spritesRef = useRef<SpriteStore | null>(null);
  const canvasPanRef = useRef({ ...IDLE_PAN });
  const hoveredKeyRef = useRef<string | null>(null);

  renderParamsRef.current = {
    layout,
    width: canvasWidth,
    lanes,
    timelineUnitCount,
    showColor,
    showNumber,
    showSupport,
  };

  const getMaxScrollLeft = useCallback(() => {
    const params = renderParamsRef.current!;
    return Math.max(0, tickToX(params.timelineUnitCount, params.layout.pitch) - params.width);
  }, []);

  const clampScroll = useCallback(
    (value: number) => Math.min(getMaxScrollLeft(), Math.max(0, value)),
    [getMaxScrollLeft]
  );

  const drawNowRef = useRef<() => void>(() => {});
  const requestDraw = useCallback(() => {
    if (drawFrameRef.current) return;
    drawFrameRef.current = window.requestAnimationFrame(() => {
      drawFrameRef.current = 0;
      drawNowRef.current();
    });
  }, []);

  // Reads everything from refs, so it always draws the newest props.
  const drawNow = useCallback(() => {
    const canvas = canvasRef.current;
    const params = renderParamsRef.current;
    if (!canvas || !params || params.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const { layout: laneLayout, width, lanes: laneList } = params;
    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(laneLayout.height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    if (!spritesRef.current) spritesRef.current = createSpriteStore(requestDraw);

    const scrollLeft = scrollLeftRef.current;
    renderTracks(canvas.getContext('2d')!, {
      lanes: laneList,
      view: { ...laneLayout, width, scrollLeft },
      opts: {
        showColor: params.showColor,
        showNumber: params.showNumber,
        showSupport: params.showSupport,
      },
      sprites: spritesRef.current!,
      dpr,
    });

    const playhead = playheadRef.current;
    if (playhead) {
      const x = tickToX(playheadTickRef.current, laneLayout.pitch) - scrollLeft;
      const inView = x >= -10 && x <= width + 10;
      playhead.style.visibility = inView ? 'visible' : 'hidden';
      playhead.style.left = `${x}px`;
    }
  }, [requestDraw]);
  drawNowRef.current = drawNow;

  const syncViewportToTick = useCallback(
    (nextTick: number, follow: 'anchor' | 'visible' = 'anchor') => {
      const params = renderParamsRef.current;
      if (!params || params.width === 0) return;

      const { pitch } = params.layout;
      const contentX = tickToX(nextTick, pitch);

      if (follow === 'anchor') {
        const anchorX = Math.max(pitch * 2, params.width * 0.3);
        scrollLeftRef.current = clampScroll(contentX - anchorX);
      } else {
        // Only pan when the playhead leaves the visible area (e.g. while dragging).
        const margin = pitch * 2;
        const left = scrollLeftRef.current;
        if (contentX < left + margin) {
          scrollLeftRef.current = clampScroll(contentX - margin);
        } else if (contentX > left + params.width - margin) {
          scrollLeftRef.current = clampScroll(contentX - params.width + margin);
        }
      }
    },
    [clampScroll]
  );

  const setPlayheadPosition = useCallback(
    (
      nextTick: number,
      { syncState = false, syncScroll = false, follow, draw = true }: PlayheadPositionOptions = {}
    ) => {
      const clampedTick = Math.max(0, nextTick);
      playheadTickRef.current = clampedTick;
      if (syncState) setPlayheadTick(clampedTick);
      if (syncScroll) syncViewportToTick(clampedTick, follow);
      if (draw) requestDraw();
    },
    [syncViewportToTick, requestDraw]
  );

  const pointerToTick = useCallback((clientX: number) => {
    const rect = canvasWrapRef.current!.getBoundingClientRect();
    const { pitch } = renderParamsRef.current!.layout;
    return (clientX - rect.left + scrollLeftRef.current - tickToX(0, pitch)) / pitch;
  }, []);

  useEffect(() => {
    requestDraw();
  }, [requestDraw, layout, canvasWidth, lanes, showColor, showNumber, showSupport, tracksOpen]);

  useEffect(
    () => () => {
      if (drawFrameRef.current) window.cancelAnimationFrame(drawFrameRef.current);
      drawFrameRef.current = 0;
    },
    []
  );

  // Keep the playhead inside the song when it gets shorter.
  useEffect(() => {
    setPlayheadPosition(Math.min(playheadTickRef.current, maxVisibleTick + 1), {
      syncState: true,
      syncScroll: true,
    });
  }, [maxVisibleTick, setPlayheadPosition]);

  useEffect(() => {
    setPlayheadPosition(playheadTickRef.current, { syncState: false, syncScroll: true });
  }, [timelineUnitCount, trackUnitSize, canvasWidth, setPlayheadPosition]);

  useEffect(() => {
    if (!tracksOpen) return;
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    setCanvasWidth(Math.floor(wrap.clientWidth));
    const observer = new ResizeObserver(([entry]) => {
      setCanvasWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(wrap);

    // Horizontal wheel/trackpad gestures pan the timeline; vertical wheel still scrolls the page.
    const onWheel = (event: WheelEvent) => {
      const horizontal = event.shiftKey ? event.deltaY : event.deltaX;
      if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      scrollLeftRef.current = clampScroll(scrollLeftRef.current + horizontal);
      requestDraw();
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      observer.disconnect();
      wrap.removeEventListener('wheel', onWheel);
    };
  }, [tracksOpen, clampScroll, requestDraw]);

  const hitTestAt = (event: { clientX: number; clientY: number }) => {
    const params = renderParamsRef.current!;
    const rect = canvasRef.current!.getBoundingClientRect();
    return hitTest({
      lanes: params.lanes,
      view: { ...params.layout, width: params.width, scrollLeft: scrollLeftRef.current },
      opts: { showSupport: params.showSupport },
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const hideTooltip = () => {
    if (hoveredKeyRef.current === null) return;
    hoveredKeyRef.current = null;
    setTooltip(null);
  };

  const onCanvasKeyDown = (event: ReactKeyboardEvent<HTMLCanvasElement>) => {
    const page = Math.max(80, canvasWidth * 0.8);
    const delta =
      event.key === 'ArrowRight' ? KEY_PAN_STEP
      : event.key === 'ArrowLeft' ? -KEY_PAN_STEP
      : event.key === 'PageDown' ? page
      : event.key === 'PageUp' ? -page
      : event.key === 'End' ? Infinity
      : event.key === 'Home' ? -Infinity
      : 0;
    if (delta === 0) return;
    event.preventDefault();
    scrollLeftRef.current = clampScroll(scrollLeftRef.current + delta);
    requestDraw();
  };

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    canvasPanRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: scrollLeftRef.current,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const pan = canvasPanRef.current;
    if (pan.pointerId === event.pointerId) {
      const deltaX = event.clientX - pan.startX;
      if (!pan.moved && Math.abs(deltaX) < PAN_DRAG_THRESHOLD) return;
      pan.moved = true;
      hideTooltip();
      scrollLeftRef.current = clampScroll(pan.startScroll - deltaX);
      requestDraw();
      return;
    }

    if (event.pointerType !== 'mouse') return;
    const hit = hitTestAt(event);
    if (!hit) {
      hideTooltip();
      return;
    }
    if (hit.key === hoveredKeyRef.current) return;
    hoveredKeyRef.current = hit.key;
    const wrapWidth = renderParamsRef.current!.width;
    const below = hit.y < 140;
    setTooltip({
      lines: getNoteTooltipLines(hit.placement),
      left: Math.min(wrapWidth - 90, Math.max(90, hit.x + hit.width / 2)),
      top: below ? hit.y + hit.height : hit.y,
      below,
    });
  };

  const onCanvasPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const pan = canvasPanRef.current;
    if (pan.pointerId !== event.pointerId) return;
    canvasPanRef.current = { ...IDLE_PAN };
    if (pan.moved) return;
    const hit = hitTestAt(event);
    if (hit) void playPlacementSound(hit.placement);
  };

  const onCanvasPointerCancel = () => {
    canvasPanRef.current = { ...IDLE_PAN };
  };

  return {
    canvasRef,
    canvasWrapRef,
    playheadRef,
    canvasWidth,
    playheadTick,
    setPlayheadTick,
    playheadTickRef,
    tooltip,
    setPlayheadPosition,
    drawNow,
    pointerToTick,
    canvasHandlers: {
      onKeyDown: onCanvasKeyDown,
      onPointerDown: onCanvasPointerDown,
      onPointerMove: onCanvasPointerMove,
      onPointerUp: onCanvasPointerUp,
      onPointerCancel: onCanvasPointerCancel,
      onPointerLeave: hideTooltip,
    },
  };
}
