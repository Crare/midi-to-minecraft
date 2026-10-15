import type {
  CanvasLane,
  CanvasOpts,
  CanvasView,
  HitResult,
  SpriteStore,
  TuningInfo,
  VisualizationNote,
  VisualizationPlacement,
} from '../../types';
import { noteColorByStep, notePitchNames, supportColorByBlock } from '../../constants';

export const LANE_GAP = 6;
export const LANE_PAD = 4;
export const TIMELINE_ORIGIN = 6;
export const GRID_UNITS = 4;
export const MIN_LANE_HEIGHT = 44;
export const NOTE_STACK_STEP = 10;

const BASE_UNIT = 34;
const noteblockSrc = `${import.meta.env.BASE_URL}assets/noteblock.svg`;

export function getMinecraftTuningInfo(useCount: number): TuningInfo {
  const normalizedUseCount = ((useCount % 24) + 24) % 24;
  const noteStep = normalizedUseCount % 12;
  return {
    useCount: normalizedUseCount,
    pitchName: notePitchNames[noteStep],
    playsoundPitch: 2 ** ((normalizedUseCount - 12) / 12),
    color: noteColorByStep[noteStep],
  };
}

export function getNoteTooltipLines(placement: VisualizationPlacement): string[] {
  const tuning = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
  return [
    `Instrument: ${placement.instrument}`,
    `Pitch: ${placement.pitch || 'drum'}`,
    `Note: ${placement.note}`,
    tuning ? `Use count: ${tuning.useCount}` : null,
    tuning ? `Minecraft pitch: ${tuning.pitchName}` : null,
    tuning ? `Playsound pitch: ${tuning.playsoundPitch.toFixed(6)}` : null,
    tuning ? `Color: ${tuning.color}` : null,
    `Block: ${placement.block}`,
  ].filter((line): line is string => line !== null);
}

function supportSvgUri(blockId: string | undefined) {
  const blockName = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  const color = supportColorByBlock[blockName] || '#8a8a8a';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' shape-rendering='crispEdges'>
    <rect width='64' height='64' fill='${color}'/>
    <rect x='2' y='2' width='60' height='10' fill='rgba(255,255,255,0.25)'/>
    <rect x='2' y='54' width='60' height='8' fill='rgba(0,0,0,0.2)'/>
    <rect x='0' y='0' width='64' height='64' fill='none' stroke='#4c4c4c' stroke-width='2'/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Loads sprites lazily and calls onLoad when one finishes so the caller can redraw.
export function createSpriteStore(onLoad: () => void): SpriteStore {
  const images = new Map<string, HTMLImageElement>();

  function load(key: string, src: string): HTMLImageElement {
    if (images.has(key)) return images.get(key)!;
    const img = new Image();
    img.onload = onLoad;
    img.src = src;
    images.set(key, img);
    return img;
  }

  const ready = (img: HTMLImageElement) => (img.complete && img.naturalWidth > 0 ? img : null);

  return {
    noteblock: () => ready(load('noteblock', noteblockSrc)),
    support: (blockId: string) => ready(load(`support:${blockId}`, supportSvgUri(blockId))),
  };
}

export function tickToX(tick: number, pitch: number): number {
  return TIMELINE_ORIGIN + tick * pitch;
}

export function computeLaneLayout({
  laneCount,
  availableHeight,
  baseUnit = BASE_UNIT,
}: {
  laneCount: number;
  availableHeight: number;
  baseUnit?: number;
}) {
  const count = Math.max(1, laneCount);
  const gaps = (count - 1) * LANE_GAP;
  const maxLaneHeight = 2 * baseUnit + 2 * LANE_PAD;
  const fitted = Math.floor((availableHeight - gaps) / count);
  const laneHeight = Math.min(maxLaneHeight, Math.max(MIN_LANE_HEIGHT, fitted));
  const cell = Math.min(baseUnit, Math.max(10, Math.floor((laneHeight - 2 * LANE_PAD + 4) / 2)));

  return {
    laneHeight,
    cell,
    pitch: cell + 2,
    height: count * laneHeight + gaps,
  };
}

// Simultaneous notes are stacked from the top, each offset by at least NOTE_STACK_STEP
// so every note's number stays readable. The last note is drawn on top and may be
// clipped by the lane bottom.
function placementRects(
  count: number,
  laneTop: number,
  laneHeight: number,
  cell: number,
  showSupport: boolean
) {
  const overlap = Math.round((4 * cell) / BASE_UNIT);
  const fullHeight = showSupport ? 2 * cell - overlap : cell;
  const top = laneTop + LANE_PAD;

  return Array.from({ length: count }, (_, index) => ({
    y: top + index * NOTE_STACK_STEP,
    height: fullHeight,
    overlap,
  }));
}

// First note whose startTick is >= tick (notes are sorted ascending by startTick).
function lowerBound(notes: VisualizationNote[], tick: number): number {
  let low = 0;
  let high = notes.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (notes[mid].startTick < tick) low = mid + 1;
    else high = mid;
  }
  return low;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}

function drawPlacement(
  ctx: CanvasRenderingContext2D,
  placement: VisualizationPlacement,
  x: number,
  rect: { y: number; overlap: number },
  cell: number,
  opts: CanvasOpts,
  sprites: SpriteStore
) {
  const k = cell / BASE_UNIT;
  const noteImg = sprites.noteblock();
  if (noteImg) ctx.drawImage(noteImg, x, rect.y, cell, cell);

  if (opts.showSupport) {
    const supportImg = sprites.support(placement.block);
    if (supportImg) ctx.drawImage(supportImg, x, rect.y + cell - rect.overlap, cell, cell);
  }

  const tuning = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
  if (!tuning) return;

  if (opts.showColor) {
    const size = Math.max(5, 9 * k);
    const cx = x + cell - 2 * k - size;
    const cy = rect.y + 2 * k;
    ctx.fillStyle = tuning.color;
    ctx.strokeStyle = 'rgba(22, 33, 14, 0.8)';
    ctx.lineWidth = 1;
    roundedRect(ctx, cx, cy, size, size, 2);
    ctx.fill();
    ctx.stroke();
  }

  if (opts.showNumber) {
    const fontSize = Math.max(7, 9.3 * k);
    const text = String(tuning.useCount);
    ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
    const padX = 3 * k;
    const boxWidth = Math.max(14 * k, ctx.measureText(text).width + 2 * padX);
    const boxHeight = fontSize * 1.2;
    const bx = x + 3 * k;
    const by = rect.y + 4 * k;
    ctx.fillStyle = 'rgba(26, 33, 14, 0.82)';
    roundedRect(ctx, bx, by, boxWidth, boxHeight, 3);
    ctx.fill();
    ctx.fillStyle = '#f7f3dd';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + boxWidth / 2, by + boxHeight / 2 + 0.5);
  }
}

function drawLane(
  ctx: CanvasRenderingContext2D,
  lane: CanvasLane,
  laneTop: number,
  view: CanvasView,
  opts: CanvasOpts,
  sprites: SpriteStore
) {
  const { scrollLeft, width, laneHeight, cell, pitch } = view;

  ctx.save();
  ctx.globalAlpha = lane.dimmed ? 0.4 : 1;

  roundedRect(ctx, 0.5, laneTop + 0.5, width - 1, laneHeight - 1, 4);
  ctx.fillStyle = 'rgba(219, 233, 194, 0.34)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(66, 97, 38, 0.65)';
  ctx.lineWidth = 1;
  ctx.stroke();

  roundedRect(ctx, 0.5, laneTop + 0.5, width - 1, laneHeight - 1, 4);
  ctx.clip();

  const gridPitch = GRID_UNITS * pitch;
  const firstGrid = Math.max(1, Math.floor((scrollLeft - TIMELINE_ORIGIN) / gridPitch));
  ctx.strokeStyle = 'rgba(66, 97, 38, 0.3)';
  ctx.beginPath();
  for (let g = firstGrid; ; g += 1) {
    const x = Math.round(TIMELINE_ORIGIN + g * gridPitch - 1 - scrollLeft) + 0.5;
    if (x > width) break;
    ctx.moveTo(x, laneTop + 1);
    ctx.lineTo(x, laneTop + laneHeight - 1);
  }
  ctx.stroke();

  const firstTick = Math.floor((scrollLeft - TIMELINE_ORIGIN - cell) / pitch);
  const lastTick = (scrollLeft + width - TIMELINE_ORIGIN) / pitch;
  const notes = lane.notes;

  for (let i = lowerBound(notes, firstTick); i < notes.length; i += 1) {
    const note = notes[i];
    if (note.startTick > lastTick) break;
    const x = Math.round(tickToX(note.startTick, pitch) - scrollLeft);
    const rects = placementRects(note.placements.length, laneTop, laneHeight, cell, opts.showSupport);
    note.placements.forEach((placement, index) => {
      drawPlacement(ctx, placement, x, rects[index], cell, opts, sprites);
    });
  }

  ctx.restore();
}

export function renderTracks(
  ctx: CanvasRenderingContext2D,
  {
    lanes,
    view,
    opts,
    sprites,
    dpr,
  }: {
    lanes: CanvasLane[];
    view: CanvasView;
    opts: CanvasOpts;
    sprites: SpriteStore;
    dpr: number;
  }
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.imageSmoothingEnabled = false;

  lanes.forEach((lane, index) => {
    const laneTop = index * (view.laneHeight + LANE_GAP);
    if (laneTop > view.height) return;
    drawLane(ctx, lane, laneTop, view, opts, sprites);
  });
}

// Maps a point in canvas CSS pixels to a note placement, or null on empty space.
export function hitTest({
  lanes,
  view,
  opts,
  x,
  y,
}: {
  lanes: CanvasLane[];
  view: CanvasView;
  opts: Pick<CanvasOpts, 'showSupport'>;
  x: number;
  y: number;
}): HitResult | null {
  const laneIndex = Math.floor(y / (view.laneHeight + LANE_GAP));
  const lane = lanes[laneIndex];
  if (!lane) return null;

  const laneTop = laneIndex * (view.laneHeight + LANE_GAP);
  if (y > laneTop + view.laneHeight) return null;

  const contentX = x + view.scrollLeft;
  const tick = Math.floor((contentX - TIMELINE_ORIGIN) / view.pitch);
  const noteIndex = lowerBound(lane.notes, tick);
  const note = lane.notes[noteIndex];
  if (!note || note.startTick !== tick) return null;

  const noteX = tickToX(note.startTick, view.pitch);
  if (contentX < noteX || contentX > noteX + view.cell) return null;

  const rects = placementRects(
    note.placements.length,
    laneTop,
    view.laneHeight,
    view.cell,
    opts.showSupport
  );
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    if (y >= rects[i].y && y <= rects[i].y + rects[i].height) {
      return {
        key: `${laneIndex}:${noteIndex}:${i}`,
        placement: note.placements[i],
        x: noteX - view.scrollLeft,
        y: rects[i].y,
        width: view.cell,
        height: rects[i].height,
      };
    }
  }
  return null;
}
