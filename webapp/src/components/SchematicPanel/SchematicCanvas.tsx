import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TickGrid } from "../../types";
import { playPlacementSound } from "../../audio/noteblockAudio";
import {
  HEADER_H,
  computeLayout,
  drawSchematic,
  hitTest,
  type HitResult
} from "./canvasSchematic";
import { blockLabel, getUseCount } from "./schematicData";

const DRAG_THRESHOLD = 4;

interface Tooltip {
  left: number;
  top: number;
  below: boolean;
  lines: string[];
}

interface PanState {
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  moved: boolean;
}

interface MarkerDrag {
  axis: "x" | "y";
  start: number;
  base: number;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(v, hi));
}

// Canvas-rendered schematic. Only the visible cells are painted; the viewport
// is sized to fit the window and panned by drag / wheel instead of scrollbars.
export default function SchematicCanvas({
  grid,
  cellSize
}: {
  grid: TickGrid;
  cellSize: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [scroll, setScroll] = useState({ x: 0, y: 0 });
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [indicatorX, setIndicatorX] = useState(15);
  const [indicatorY, setIndicatorY] = useState(30);
  const panRef = useRef<PanState | null>(null);
  const markerDragRef = useRef<MarkerDrag | null>(null);

  const layout = useMemo(() => computeLayout(grid, cellSize), [grid, cellSize]);
  const maxViewportH = Math.max(300, windowHeight - 340);
  const height = Math.min(layout.height + HEADER_H, maxViewportH);
  const maxScrollX = Math.max(0, layout.width - width);
  const maxScrollY = Math.max(0, layout.height - (height - HEADER_H));
  const scrollX = clamp(scroll.x, 0, maxScrollX);
  const scrollY = clamp(scroll.y, 0, maxScrollY);

  const limitsRef = useRef({ maxScrollX: 0, maxScrollY: 0 });
  limitsRef.current = { maxScrollX, maxScrollY };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)));
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth));
    const onResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawSchematic(ctx, {
      grid,
      layout,
      scrollX,
      scrollY,
      width,
      height,
      dpr,
      lastPressed
    });
  }, [grid, layout, scrollX, scrollY, width, height, lastPressed]);

  // Non-passive wheel listener so vertical wheel only hijacks the page while
  // the schematic can actually scroll in that direction.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const onWheel = (e: WheelEvent) => {
      const { maxScrollX: mx, maxScrollY: my } = limitsRef.current;
      const horizontal = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const dx = horizontal ? (e.shiftKey ? e.deltaY : e.deltaX) : 0;
      const dy = horizontal ? 0 : e.deltaY;
      let changed = false;
      setScroll((s) => {
        const nx = clamp(s.x + dx, 0, mx);
        const ny = clamp(s.y + dy, 0, my);
        changed = nx !== s.x || ny !== s.y;
        return changed ? { x: nx, y: ny } : s;
      });
      if (dx !== 0 && mx > 0) e.preventDefault();
      else if (dy !== 0 && my > 0) {
        const s = scrollRefValue.current;
        const atEdge = (dy < 0 && s.y <= 0) || (dy > 0 && s.y >= my);
        if (!atEdge) e.preventDefault();
      }
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);
  const scrollRefValue = useRef(scroll);
  scrollRefValue.current = { x: scrollX, y: scrollY };

  function localPoint(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function hit(p: { x: number; y: number }) {
    return hitTest({ grid, layout, scrollX, scrollY, x: p.x, y: p.y });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    const { maxScrollX: mx, maxScrollY: my } = limitsRef.current;
    const stepX = layout.cs * 3;
    const pageY = Math.max(layout.cs, height - HEADER_H - layout.cs);
    const move: Record<string, [number, number]> = {
      ArrowRight: [stepX, 0],
      ArrowLeft: [-stepX, 0],
      ArrowDown: [0, layout.cs * 2],
      ArrowUp: [0, -layout.cs * 2],
      PageDown: [0, pageY],
      PageUp: [0, -pageY],
      Home: [-Infinity, 0],
      End: [Infinity, 0],
    };
    const delta = move[e.key];
    if (!delta) return;
    e.preventDefault();
    setScroll((s) => ({
      x: clamp(s.x + delta[0], 0, mx),
      y: clamp(s.y + delta[1], 0, my),
    }));
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return;
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: scrollX,
      baseY: scrollY,
      moved: false
    };
    canvasRef.current!.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const pan = panRef.current;
    if (pan) {
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      if (!pan.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      pan.moved = true;
      setTooltip(null);
      setScroll({
        x: clamp(pan.baseX - dx, 0, maxScrollX),
        y: clamp(pan.baseY - dy, 0, maxScrollY)
      });
      return;
    }
    const h = hit(localPoint(e));
    if (!h || (h.type !== "note" && h.type !== "repeater")) {
      setTooltip(null);
      return;
    }
    const left = h.left - scrollX + h.size / 2;
    const top = HEADER_H + h.top - scrollY;
    const below = top < 90;
    setTooltip({
      left,
      top: below ? top + h.size : top,
      below,
      lines:
        h.type === "repeater"
          ? [`Repeater: ${h.ticks} tick${h.ticks !== 1 ? "s" : ""}`]
          : [
              h.instrument,
              h.note.pitch || "drum",
              `Use count: ${getUseCount(h.note.note)}`,
              blockLabel(h.block)
            ]
    });
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const pan = panRef.current;
    panRef.current = null;
    if (!pan || pan.moved) return;
    const h = hit(localPoint(e));
    if (!h) return;
    if (h.type === "note") {
      void playPlacementSound({
        instrument: h.instrument,
        note: h.note.note,
        pitch: h.note.pitch
      });
      setLastPressed(h.key);
    } else if (h.type === "tick") {
      setIndicatorX(h.cx);
    } else if (h.type === "connector") {
      setIndicatorY(h.cy);
    }
  }

  function startMarkerDrag(axis: "x" | "y") {
    return (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      markerDragRef.current = {
        axis,
        start: axis === "x" ? e.clientX : e.clientY,
        base: axis === "x" ? indicatorX : indicatorY
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
  }

  function moveMarkerDrag(e: React.PointerEvent<HTMLButtonElement>) {
    const d = markerDragRef.current;
    if (!d) return;
    if (d.axis === "x") {
      setIndicatorX(clamp(d.base + e.clientX - d.start, 0, layout.width));
    } else {
      setIndicatorY(clamp(d.base + e.clientY - d.start, 0, layout.height));
    }
  }

  function endMarkerDrag() {
    markerDragRef.current = null;
  }

  const markerScreenX = indicatorX - scrollX;
  const markerScreenY = HEADER_H + indicatorY - scrollY;
  const showV = markerScreenX >= 0 && markerScreenX <= width;
  const showH = markerScreenY >= HEADER_H && markerScreenY <= height;

  return (
    <div
      ref={wrapRef}
      className="schematic-canvas-wrap"
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className="schematic-canvas"
        style={{ width: `${width}px`, height: `${height}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          panRef.current = null;
        }}
        onPointerLeave={() => setTooltip(null)}
        role="img"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={`Top-down build schematic with ${grid.instruments.length} instrument(s): ${grid.instruments.map((i) => i.label).join(", ")}. Use arrow keys to scroll.`}
      />
      {showV && (
        <button
          type="button"
          className="schematic-indicator"
          style={{ left: `${markerScreenX}px` }}
          onPointerDown={startMarkerDrag("x")}
          onPointerMove={moveMarkerDrag}
          onPointerUp={endMarkerDrag}
          onPointerCancel={endMarkerDrag}
          aria-label="Drag to mark column build progress"
        >
          <span className="schematic-indicator-line" aria-hidden="true" />
          <span className="schematic-indicator-head" aria-hidden="true" />
        </button>
      )}
      {showH && (
        <button
          type="button"
          className="schematic-h-indicator"
          style={{ top: `${markerScreenY}px` }}
          onPointerDown={startMarkerDrag("y")}
          onPointerMove={moveMarkerDrag}
          onPointerUp={endMarkerDrag}
          onPointerCancel={endMarkerDrag}
          aria-label="Drag to mark row build progress"
        >
          <span className="schematic-h-indicator-line" aria-hidden="true" />
          <span className="schematic-h-indicator-head" aria-hidden="true" />
        </button>
      )}
      {tooltip && (
        <div
          className={
            tooltip.below
              ? "canvas-tooltip canvas-tooltip-below"
              : "canvas-tooltip"
          }
          style={{ left: `${tooltip.left}px`, top: `${tooltip.top}px` }}
          role="tooltip"
        >
          {tooltip.lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
