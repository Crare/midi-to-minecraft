// Shared domain types for the MIDI → Minecraft conversion pipeline.

/** One note converted from MIDI, with Minecraft block/pitch info. Times in seconds. */
export interface NoteEvent {
  time: number;
  endTime: number;
  block: string;
  /** Pitch class (e.g. "C#"); undefined for percussion. */
  pitch: string | undefined;
  /** Noteblock tuning step, 0-23. */
  note: number;
  instrument: string;
  trackIndex: number;
  trackName: string;
}

/** A lane of non-overlapping notes for one instrument. */
export interface TrackEvents {
  id: string;
  title: string;
  events: NoteEvent[];
}

/** A note positioned on the redstone tick timeline (1 tick = 0.1 s). */
export interface Placement {
  redstoneTickDelay: number;
  startTick: number;
  block: string;
  pitch: string | undefined;
  note: number;
  instrument: string;
  trackIndex: number;
  trackName: string;
}

export interface DownloadFile {
  name: string;
  data: Placement[];
}

// ── Visualization ───────────────────────────────────────────────────────────

export interface VisualizationPlacement {
  block: string;
  pitch: string | undefined;
  note: number;
  instrument: string;
}

export interface VisualizationNote {
  redstoneTickDelay: number;
  startTick: number;
  placements: VisualizationPlacement[];
}

export interface VisualizationTrack {
  id: string;
  title: string;
  subtitle: string;
  notes: VisualizationNote[];
}

// ── Schematic ───────────────────────────────────────────────────────────────

export interface Connects {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface GridNote {
  absoluteTick: number;
  block: string;
  instrument: string;
  note: number;
  pitch: string | undefined;
}

export type SegmentCell = { kind: "repeater"; ticks: number } | { kind: "dust" };

export type AnchorCell =
  | { kind: "note"; note: GridNote | null; tick: number }
  | { kind: "split-branch" | "split-pass"; connects: Connects }
  | { kind: "inactive" };

export interface GridAnchor {
  kind: "split" | "note";
  tick: number;
  index: number;
  isSplit?: boolean;
}

export interface GridRow {
  id: string;
  isSub: boolean;
  segments: SegmentCell[][];
  anchorCells: AnchorCell[];
}

export interface GridInstrument {
  id: string;
  label: string;
  block: string;
  rows: GridRow[];
  /** Own column set; only present in the compact grid, where instruments don't share columns. */
  anchors?: GridAnchor[];
}

export interface TickGrid {
  instruments: GridInstrument[];
  anchors: GridAnchor[];
}

// ── Canvas renderer ─────────────────────────────────────────────────────────

export interface TuningInfo {
  useCount: number;
  pitchName: string;
  playsoundPitch: number;
  color: string;
}

export interface CanvasLane {
  dimmed?: boolean;
  notes: VisualizationNote[];
}

export interface CanvasView {
  scrollLeft: number;
  width: number;
  height: number;
  laneHeight: number;
  cell: number;
  pitch: number;
}

export interface CanvasOpts {
  showSupport: boolean;
  showColor: boolean;
  showNumber: boolean;
}

export interface SpriteStore {
  noteblock: () => HTMLImageElement | null;
  support: (blockId: string) => HTMLImageElement | null;
}

export interface HitResult {
  key: string;
  placement: VisualizationPlacement;
  x: number;
  y: number;
  width: number;
  height: number;
}
