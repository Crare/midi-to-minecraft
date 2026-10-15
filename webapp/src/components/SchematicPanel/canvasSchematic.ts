import type {
  AnchorCell,
  Connects,
  GridAnchor,
  GridInstrument,
  GridRow,
  GridNote,
  TickGrid
} from "../../types";
import { blockColorFor, blockLabel, getUseCount } from "./schematicData";

export const HEADER_H = 20;
export const LABEL_H = 22;

const PANEL = "#7daf52";
const PANEL_DARK = "#537b32";
const RED = "#c0392b";
const GRID_LINE = "rgba(0,0,0,0.15)";

export type ColInfo = { kind: "seg" | "anchor"; ai: number };

/** Column positions; shared by every row, or per instrument in the compact grid. */
export interface Columns {
  segLen: number[];
  segX: number[];
  anchorX: number[];
  colStarts: number[];
  colInfo: ColInfo[];
}

export type LayoutRow =
  | { type: "label"; y: number; h: number; inst: GridInstrument }
  | {
      type: "row";
      y: number;
      h: number;
      inst: GridInstrument;
      row: GridRow;
      /** Set in compact mode, where each instrument has its own columns. */
      cols?: Columns;
    };

export interface Layout extends Columns {
  cs: number;
  width: number;
  height: number;
  rows: LayoutRow[];
  rowStarts: number[];
}

/** The compact grid has no shared tick columns, so the tick header is hidden. */
export function headerHeight(grid: TickGrid) {
  return grid.instruments.some((inst) => inst.anchors) ? 0 : HEADER_H;
}

export type HitResult =
  | { type: "tick"; tick: number; cx: number }
  | { type: "connector"; cy: number; rowTop: number }
  | {
      type: "repeater";
      ticks: number;
      left: number;
      top: number;
      size: number;
    }
  | {
      type: "note";
      key: string;
      note: GridNote;
      instrument: string;
      block: string;
      left: number;
      top: number;
      size: number;
    };

type Ctx = CanvasRenderingContext2D;

function lowerBound(arr: number[], value: number) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Largest index whose start is <= value (or -1).
function indexAt(starts: number[], value: number) {
  return lowerBound(starts, value + 1e-6) - 1;
}

// Positions of every column and row in content space. Body rows start at y=0
// (the sticky header is drawn separately above them).
function computeColumns(
  anchors: GridAnchor[],
  instruments: GridInstrument[],
  cs: number
): Columns & { width: number } {
  const segLen = anchors.map(() => 0);
  for (const inst of instruments) {
    for (const row of inst.rows) {
      anchors.forEach((_, ai) => {
        segLen[ai] = Math.max(segLen[ai], (row.segments[ai] ?? []).length);
      });
    }
  }

  const segX: number[] = [];
  const anchorX: number[] = [];
  let x = cs;
  anchors.forEach((_, ai) => {
    segX.push(x);
    x += segLen[ai] * cs;
    anchorX.push(x);
    x += cs;
  });

  const colStarts: number[] = [];
  const colInfo: ColInfo[] = [];
  anchors.forEach((_, ai) => {
    if (segLen[ai] > 0) {
      colStarts.push(segX[ai]);
      colInfo.push({ kind: "seg", ai });
    }
    colStarts.push(anchorX[ai]);
    colInfo.push({ kind: "anchor", ai });
  });

  return { segLen, segX, anchorX, colStarts, colInfo, width: x };
}

export function computeLayout(grid: TickGrid, cs: number): Layout {
  const { instruments, anchors } = grid;
  const compact = instruments.some((inst) => inst.anchors);
  const shared = computeColumns(compact ? [] : anchors, compact ? [] : instruments, cs);
  let width = shared.width;
  const sharedCols: Columns = {
    segLen: shared.segLen,
    segX: shared.segX,
    anchorX: shared.anchorX,
    colStarts: shared.colStarts,
    colInfo: shared.colInfo
  };

  const rows: LayoutRow[] = [];
  let y = 0;
  for (const inst of instruments) {
    rows.push({ type: "label", y, h: LABEL_H, inst });
    y += LABEL_H;
    const own = compact ? computeColumns(inst.anchors ?? [], [inst], cs) : null;
    if (own) width = Math.max(width, own.width);
    const cols: Columns | undefined = own
      ? { segLen: own.segLen, segX: own.segX, anchorX: own.anchorX, colStarts: own.colStarts, colInfo: own.colInfo }
      : undefined;
    for (const row of inst.rows) {
      rows.push({ type: "row", y, h: cs, inst, row, ...(cols ? { cols } : {}) });
      y += cs;
    }
  }

  return {
    cs,
    width,
    height: y,
    ...sharedCols,
    rows,
    rowStarts: rows.map((r) => r.y)
  };
}

// ── Cell painters (drawn in a 28×28 design space scaled to cs) ───────────────
function fill(
  ctx: Ctx,
  x: number,
  y: number,
  k: number,
  rx: number,
  ry: number,
  w: number,
  h: number,
  color: string,
  alpha = 1
) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + rx * k, y + ry * k, w * k, h * k);
  ctx.globalAlpha = 1;
}

function drawDust(ctx: Ctx, x: number, y: number, cs: number, alpha = 1) {
  const k = cs / 28;
  fill(ctx, x, y, k, 0, 11, 28, 6, RED, alpha);
}

function drawRepeater(
  ctx: Ctx,
  x: number,
  y: number,
  cs: number,
  ticks: number
) {
  const k = cs / 28;
  fill(ctx, x, y, k, 0, 0, 28, 28, "#b9b3a8");
  fill(ctx, x, y, k, 2, 2, 24, 24, "#ddd7ca");
  fill(ctx, x, y, k, 2, 11, 24, 6, "#b94141");
  fill(ctx, x, y, k, 18, 5, 4, 4, "#d63737");
  fill(ctx, x, y, k, 6 + (ticks - 1) * 4, 19, 4, 4, "#d63737");
  ctx.fillStyle = "#222";
  ctx.font = `bold ${13 * k}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(ticks), x + 14 * k, y + 10 * k);
}

function drawSplit(
  ctx: Ctx,
  x: number,
  y: number,
  cs: number,
  c: Partial<Connects>
) {
  const k = cs / 28;
  const any = c.left || c.right || c.up || c.down;
  if (c.left) fill(ctx, x, y, k, 0, 11, 14, 6, RED);
  if (c.right) fill(ctx, x, y, k, 14, 11, 14, 6, RED);
  if (c.up) fill(ctx, x, y, k, 11, 0, 6, 14, RED);
  if (c.down) fill(ctx, x, y, k, 11, 14, 6, 14, RED);
  if (any) fill(ctx, x, y, k, 11, 11, 6, 6, RED);
}

function drawNote(
  ctx: Ctx,
  x: number,
  y: number,
  cs: number,
  color: string,
  label: string
) {
  const k = cs / 28;
  fill(ctx, x, y, k, 0, 0, 28, 28, color);
  ctx.fillStyle = "#000000aa";
  ctx.font = `bold ${11 * k}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(label, x + 14 * k, y + 19 * k);
}

function noteBlockOf(inst: GridInstrument, cell: { note: GridNote | null }) {
  return cell.note!.block ?? inst.block;
}

// Returns true when the cell is plain wire (drawn without a grid border so the
// line reads as continuous).
function drawAnchor(
  ctx: Ctx,
  x: number,
  y: number,
  cs: number,
  inst: GridInstrument,
  cell: AnchorCell | undefined,
  isSub: boolean
) {
  if (!cell || cell.kind === "inactive") return false;
  if (cell.kind === "split-pass") {
    const c: Partial<Connects> = cell.connects ?? {};
    if (!isSub && !c.left && !c.right && !c.up && !c.down) {
      drawDust(ctx, x, y, cs);
      return true;
    }
    drawSplit(ctx, x, y, cs, c);
    return !!(c.left && c.right && !c.up && !c.down);
  } else if (cell.kind === "split-branch") {
    drawSplit(
      ctx,
      x,
      y,
      cs,
      cell.connects ?? { left: true, right: true, up: false, down: true }
    );
  } else if (cell.kind === "note") {
    if (!cell.note) {
      drawDust(ctx, x, y, cs);
      return true;
    }
    drawNote(
        ctx,
        x,
        y,
        cs,
        blockColorFor(noteBlockOf(inst, cell)),
        String(getUseCount(cell.note.note))
      );
  }
  return false;
}

function cellBorder(ctx: Ctx, x: number, y: number, cs: number) {
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);
}

// ── Main draw ────────────────────────────────────────────────────────────────
export interface DrawParams {
  grid: TickGrid;
  layout: Layout;
  scrollX: number;
  scrollY: number;
  width: number;
  height: number;
  dpr: number;
  lastPressed: string | null;
}

export function drawSchematic(
  ctx: Ctx,
  { grid, layout, scrollX, scrollY, width, height, dpr, lastPressed }: DrawParams
) {
  const { cs, rows, rowStarts, colStarts, colInfo, anchorX } = layout;
  const headerH = headerHeight(grid);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, width, height);

  const bodyTop = headerH;
  const viewY0 = scrollY;
  const viewY1 = scrollY + (height - headerH);
  const firstRow = Math.max(0, indexAt(rowStarts, viewY0));
  const lastRow = Math.min(rows.length - 1, indexAt(rowStarts, viewY1));

  const viewX0 = scrollX + layout.cs;
  const viewX1 = scrollX + width;
  const firstCol = Math.max(0, indexAt(colStarts, viewX0));
  const lastCol = Math.min(colStarts.length - 1, indexAt(colStarts, viewX1));

  // Label rows span the full width; their text stays pinned to the left.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, bodyTop, width, height - bodyTop);
  ctx.clip();
  for (let r = firstRow; r <= lastRow; r++) {
    const row = rows[r];
    if (row.type !== "label") continue;
    const sy = bodyTop + row.y - scrollY;
    ctx.fillStyle = PANEL_DARK;
    ctx.fillRect(0, sy, width, row.h);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, sy, width, 2);
    ctx.fillStyle = "#314223";
    ctx.font = "bold 12px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${row.inst.label} — ${blockLabel(row.inst.block)}`,
      6,
      sy + row.h / 2 + 1
    );
  }
  ctx.restore();

  // Scrolling cells (clipped so they slide under the sticky connector column).
  ctx.save();
  ctx.beginPath();
  ctx.rect(cs, bodyTop, Math.max(0, width - cs), height - bodyTop);
  ctx.clip();
  for (let r = firstRow; r <= lastRow; r++) {
    const row = rows[r];
    if (row.type !== "row") continue;
    const sy = bodyTop + row.y - scrollY;
    const cols = row.cols ?? layout;
    const rowFirst = row.cols ? Math.max(0, indexAt(cols.colStarts, viewX0)) : firstCol;
    const rowLast = row.cols
      ? Math.min(cols.colStarts.length - 1, indexAt(cols.colStarts, viewX1))
      : lastCol;
    for (let c = rowFirst; c <= rowLast; c++) {
      const info = cols.colInfo[c];
      const sx = cols.colStarts[c] - scrollX;
      if (info.kind === "seg") {
        const seg = row.row.segments[info.ai] ?? [];
        for (let i = 0; i < cols.segLen[info.ai]; i++) {
          const cx = sx + i * cs;
          if (cx + cs < cs || cx > width) continue;
          const cell = seg[i];
          if (cell?.kind === "repeater") {
            drawRepeater(ctx, cx, sy, cs, cell.ticks);
            cellBorder(ctx, cx, sy, cs);
          } else if (!row.row.isSub) {
            drawDust(ctx, cx, sy, cs);
          } else {
            cellBorder(ctx, cx, sy, cs);
          }
        }
      } else {
        const isWire = drawAnchor(
          ctx,
          sx,
          sy,
          cs,
          row.inst,
          row.row.anchorCells[info.ai],
          row.row.isSub
        );
        if (!isWire) cellBorder(ctx, sx, sy, cs);
        if (lastPressed === `${row.row.id}:${info.ai}`) {
          ctx.strokeStyle = "#ff8c00";
          ctx.lineWidth = 2;
          ctx.strokeRect(sx + 1, sy + 1, cs - 2, cs - 2);
        }
      }
    }
  }
  ctx.restore();

  // Sticky connector column.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, bodyTop, cs, height - bodyTop);
  ctx.clip();
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, bodyTop, cs, height - bodyTop);
  for (let r = firstRow; r <= lastRow; r++) {
    const row = rows[r];
    if (row.type === "label") {
      const sy = bodyTop + row.y - scrollY;
      ctx.fillStyle = PANEL_DARK;
      ctx.fillRect(0, sy, cs, row.h);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, sy, cs, 2);
      ctx.fillStyle = "#314223";
      ctx.font = "bold 12px 'Trebuchet MS', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${row.inst.label} — ${blockLabel(row.inst.block)}`,
        6,
        sy + row.h / 2 + 1
      );
    } else {
      const sy = bodyTop + row.y - scrollY;
      if (!row.row.isSub) drawDust(ctx, 0, sy, cs);
      else cellBorder(ctx, 0, sy, cs);
    }
  }
  ctx.restore();

  // Sticky tick header (hidden in the compact grid).
  if (headerH === 0) return;
  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, width, HEADER_H);
  ctx.save();
  ctx.beginPath();
  ctx.rect(cs, 0, Math.max(0, width - cs), HEADER_H);
  ctx.clip();
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let c = firstCol; c <= lastCol; c++) {
    const info = colInfo[c];
    if (info.kind !== "anchor") continue;
    const anchor = grid.anchors[info.ai];
    if (anchor.kind !== "note") continue;
    const sx = anchorX[info.ai] - scrollX;
    ctx.fillStyle = "rgba(240,192,64,0.18)";
    ctx.fillRect(sx, 0, cs, HEADER_H - 2);
    ctx.fillStyle = "#000";
    ctx.fillText(String(anchor.tick), sx + cs / 2, HEADER_H / 2 - 1);
  }
  ctx.restore();
  ctx.fillStyle = "rgba(240,192,64,0.5)";
  ctx.fillRect(0, HEADER_H - 2, width, 2);
}

// ── Hit testing (x,y are viewport-relative canvas coordinates) ───────────────
export function hitTest({
  grid,
  layout,
  scrollX,
  scrollY,
  x,
  y
}: {
  grid: TickGrid;
  layout: Layout;
  scrollX: number;
  scrollY: number;
  x: number;
  y: number;
}): HitResult | null {
  const { cs } = layout;
  const headerH = headerHeight(grid);
  if (y < headerH) {
    if (x < cs) return null;
    const cx = x + scrollX;
    const c = indexAt(layout.colStarts, cx);
    if (c < 0) return null;
    const info = layout.colInfo[c];
    if (info.kind !== "anchor") return null;
    const anchor = grid.anchors[info.ai];
    if (anchor.kind !== "note") return null;
    return {
      type: "tick",
      tick: anchor.tick,
      cx: layout.anchorX[info.ai] + cs / 2
    };
  }

  const cy = y - headerH + scrollY;
  const r = indexAt(layout.rowStarts, cy);
  if (r < 0 || cy >= layout.height) return null;
  const row = layout.rows[r];
  if (row.type !== "row") return null;
  const rowTop = headerH + row.y - scrollY;

  if (x < cs) {
    return { type: "connector", cy: row.y + cs / 2, rowTop };
  }

  const cols = row.cols ?? layout;
  const cx = x + scrollX;
  const c = indexAt(cols.colStarts, cx);
  if (c < 0) return null;
  const info = cols.colInfo[c];
  if (info.kind === "seg") {
    const i = Math.floor((cx - cols.colStarts[c]) / cs);
    const cell = (row.row.segments[info.ai] ?? [])[i];
    if (cell?.kind !== "repeater") return null;
    return {
      type: "repeater",
      ticks: cell.ticks,
      left: cols.colStarts[c] + i * cs,
      top: row.y,
      size: cs
    };
  }
  const cell = row.row.anchorCells[info.ai];
  if (cell?.kind !== "note" || !cell.note) return null;
  return {
    type: "note",
    key: `${row.row.id}:${info.ai}`,
    note: cell.note,
    instrument: cell.note.instrument ?? row.inst.label,
    block: noteBlockOf(row.inst, cell),
    left: cols.anchorX[info.ai],
    top: row.y,
    size: cs
  };
}
