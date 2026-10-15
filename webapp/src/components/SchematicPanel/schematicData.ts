import type {
  AnchorCell,
  GridAnchor,
  GridInstrument,
  GridNote,
  GridRow,
  NoteEvent,
  SegmentCell,
  TickGrid,
  TrackEvents
} from '../../types';

export interface LanePlacement {
  delay: number;
  startTick: number;
  block: string;
  instrument: string;
  note: number;
  pitch: string | undefined;
}

export interface BranchFrom {
  sourceId: string;
  savedTicks: number;
  savedCellCount: number;
}

export interface BranchTap {
  atCellCount: number;
  childId: string;
  savedTicks: number;
}

export interface SubLane {
  id: string;
  notes: LanePlacement[];
  branchFrom?: BranchFrom;
  branchTaps?: BranchTap[];
}

export interface LaneGroup {
  id: string;
  label: string;
  sublanes: SubLane[];
}

export type LaneCell =
  | { type: 'spacer'; count: number; key: string }
  | { type: 'branch-start'; sourceId: string; savedTicks: number; key: string }
  | { type: 'repeater'; ticks: number; key: string }
  | { type: 'dust'; key: string }
  | { type: 'branch-tap'; key: string }
  | {
      type: 'note';
      block: string;
      note: number;
      pitch: string | undefined;
      instrument: string;
      useCount: number;
      key: string;
    };

export interface BlockCounts {
  noteblocks: number;
  repeaters: number;
  dust: number;
}

// Pre-anchor cell used while building the grid; note anchors hold every simultaneous note.
type RawAnchorCell =
  | { kind: 'note'; notes: GridNote[]; tick: number }
  | Exclude<AnchorCell, { kind: 'note' }>;

// ─── Block colors (top-down view of the instrument support block) ──────────────
export const blockColor: Record<string, string> = {
  'minecraft:dirt':         '#7f5a34',
  'minecraft:sand':         '#d4be7d',
  'minecraft:glass':        '#8cd9e9',
  'minecraft:stone':        '#8f9497',
  'minecraft:gold_block':   '#f3cf3f',
  'minecraft:clay':         '#b9a6a2',
  'minecraft:packed_ice':   '#bce8ff',
  'minecraft:white_wool':   '#f4f2e9',
  'minecraft:bone_block':   '#e3dcc2',
  'minecraft:iron_block':   '#c4cbd0',
  'minecraft:soul_sand':    '#6f5b45',
  'minecraft:pumpkin':      '#d27720',
  'minecraft:emerald_block':'#3cc76f',
  'minecraft:hay_block':    '#d6c66a',
  'minecraft:glowstone':    '#f2cb6c',
  'minecraft:acacia_log':   '#8b5a2b',
};

export function blockColorFor(blockId: string) {
  return blockColor[blockId] || '#8a8a8a';
}

export function blockLabel(blockId?: string | null) {
  const name = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
}

// How many times to right-click the noteblock to get this pitch (0-23)
export function getUseCount(note: number) {
  return ((note % 24) + 24) % 24;
}

// ─── Lane splitting ────────────────────────────────────────────────────────────

// Split events into non-overlapping sub-lanes (handles simultaneous / harmonic notes).
// Uses best-fit (latest-ending available lane) to minimise inter-note gaps and repeater use.
export function splitIntoSubLanes(events: NoteEvent[]) {
  const sorted = [...events].sort((a, b) => a.time - b.time || a.note - b.note);
  const lanes: { lastEndTime: number; events: NoteEvent[] }[] = [];
  const epsilon = 1e-6;
  sorted.forEach((event) => {
    // Best-fit: prefer the lane whose lastEndTime is closest (but still ≤) event.time.
    // This minimises gaps, reducing total repeater usage.
    let best: (typeof lanes)[number] | null = null;
    for (const l of lanes) {
      if (l.lastEndTime > event.time + epsilon) continue;
      if (!best || l.lastEndTime > best.lastEndTime) best = l;
    }
    if (!best) {
      best = { lastEndTime: -Infinity, events: [] };
      lanes.push(best);
    }
    best.events.push(event);
    best.lastEndTime = Math.max(best.lastEndTime, event.endTime);
  });
  return lanes.map((l) => l.events);
}

export function eventsToPlacements(events: NoteEvent[]): LanePlacement[] {
  let lastTime = 0;
  let lastTick = 0;
  return events.map((event) => {
    const delay = Math.round(Math.max(0, event.time - lastTime) * 10);
    const startTick = lastTick + delay;
    lastTime = event.time;
    lastTick = startTick;
    return { delay, startTick, block: event.block, instrument: event.instrument, note: event.note, pitch: event.pitch };
  });
}

// Decompose N ticks into minimum individual repeater delay values (1–4 each).
// E.g. 10 → [4, 4, 2],  7 → [4, 3],  3 → [3]
export function decomposeDelay(ticks: number) {
  const result: number[] = [];
  for (let rem = ticks; rem > 0; rem -= 4) {
    result.push(Math.min(rem, 4));
  }
  return result;
}

// Count how many cells the source lane renders from its start up to the signal point at tapTick.
// The tap occurs on the last repeater (or dust) of the delay chain reaching tapTick, so we
// exclude the note cell at tapTick itself — the T-junction lives on the wire, not the note block.
export function countCellsToTick(notes: LanePlacement[], tapTick: number) {
  let count = 0;
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (note.startTick < tapTick) {
      // Notes before the tap: count their full delay chain + note cell.
      if (note.delay > 0) {
        count += decomposeDelay(note.delay).length;
      } else if (i > 0) {
        count += 1; // dust cell
      }
      count += 1; // note cell
    } else if (note.startTick === tapTick) {
      // The note AT tapTick: count its delay chain (the wire), but NOT the note cell.
      // The tap physically comes off the repeater chain, before the note block fires.
      if (note.delay > 0) {
        count += decomposeDelay(note.delay).length;
      } else if (i > 0) {
        count += 1; // dust cell
      }
      break;
    } else {
      // Tap falls within this note's preceding repeater chain — count only the partial ticks.
      const prevTick = note.startTick - note.delay;
      const partialTicks = tapTick - prevTick;
      if (partialTicks > 0) count += decomposeDelay(partialTicks).length;
      break;
    }
  }
  return count;
}

// Build the flat cell list for one sub-lane row.
// - idx=0 with branchInfo: show a branch-start cell, then only the remaining delay repeaters
// - idx=0 with delay>0 (no branch): initial start-delay repeaters
// - idx>0 with delay>0: inter-note gap repeaters
// - idx>0 with delay=0: redstone dust (consecutive notes)
export function buildCells(
  notes: LanePlacement[],
  {
    branchInfo = null,
    branchTaps = []
  }: { branchInfo?: BranchFrom | null; branchTaps?: BranchTap[] } = {}
) {
  const cells: LaneCell[] = [];
  notes.forEach((p, idx) => {
    const isBranching = idx === 0 && branchInfo != null;
    const delay = isBranching ? Math.max(0, p.delay - branchInfo.savedTicks) : p.delay;

    if (isBranching) {
      // Spacer covers all shared cells (the repeaters from tick 0 to the tap tick).
      // The branch-start cell aligns with the T-junction column inserted in the source lane.
      const spacerCount = branchInfo.savedCellCount;
      if (spacerCount > 0) {
        cells.push({ type: 'spacer', count: spacerCount, key: 'spacer' });
      }
      // T-junction — standalone cell between the last shared repeater and the note block.
      cells.push({ type: 'branch-start', sourceId: branchInfo.sourceId, savedTicks: branchInfo.savedTicks, key: 'branch-start' });
      if (delay > 0) {
        decomposeDelay(delay).forEach((t, ti) => {
          cells.push({ type: 'repeater', ticks: t, key: `rep-0-${ti}` });
        });
      } else {
        // No residual delay — add a dust cell to wire the T-junction into the note block.
        cells.push({ type: 'dust', key: 'branch-dust' });
      }
    } else if (delay > 0) {
      decomposeDelay(delay).forEach((t, ti) => {
        cells.push({ type: 'repeater', ticks: t, key: `rep-${idx}-${ti}` });
      });
    } else if (idx > 0) {
      cells.push({ type: 'dust', key: `dust-${idx}` });
    }
    cells.push({
      type: 'note',
      block: p.block,
      note: p.note,
      pitch: p.pitch,
      instrument: p.instrument,
      useCount: getUseCount(p.note),
      key: `note-${idx}`,
    });
  });

  // Insert standalone branch-tap cells into the source lane at each tap position.
  // Sort in reverse order so earlier insertions don't shift later tap indices.
  const sortedTaps = [...branchTaps].sort((a, b) => b.atCellCount - a.atCellCount);
  sortedTaps.forEach((tap) => {
    const tapIdx = Math.min(tap.atCellCount, cells.length);
    cells.splice(tapIdx, 0, { type: 'branch-tap', key: `tap-${tap.childId}` });
  });

  return cells;
}

// After assigning notes to sublanes, find where a sublane with a large start-delay can
// "branch off" from an earlier sublane instead of running independent start repeaters.
// Returns an array parallel to `sublanes`; entries are { sourceIndex, savedTicks } or null.
export function detectBranches(
  sublanes: SubLane[],
  minSavings = 0
): ({ sourceIndex: number; savedTicks: number } | null)[] {
  return sublanes.map((lane, i) => {
    if (i === 0 || !lane.notes.length) return null;
    const firstTick = lane.notes[0].startTick;
    if (firstTick < minSavings) return null;

    let bestSaved = 0;
    let bestSrcIdx = -1;
    for (let j = 0; j < i; j++) {
      const src = sublanes[j];
      if (!src.notes.length) continue;
      // The source lane's signal runs from tick 0 to its last note's startTick.
      // We can tap anywhere in that span; the best tap is as close to firstTick as possible.
      const srcLastTick = src.notes[src.notes.length - 1].startTick;
      const savedTicks = Math.min(firstTick, srcLastTick);
      if (savedTicks > bestSaved) {
        bestSaved = savedTicks;
        bestSrcIdx = j;
      }
    }
    if (bestSaved < minSavings || bestSrcIdx === -1) return null;
    return { sourceIndex: bestSrcIdx, savedTicks: bestSaved };
  });
}

// ─── Block counting helpers ────────────────────────────────────────────────────

// Return the primary support block for a group (taken from its first note).
export function getGroupSupportBlock(group: LaneGroup) {
  for (const sl of group.sublanes) {
    for (const note of sl.notes) {
      if (note.block) return note.block;
    }
  }
  return 'minecraft:dirt';
}

// Count the placed block types for a single instrument group.
// - noteblocks  : note block placements
// - repeaters   : repeater placements
// - dust        : redstone dust placements (dust cells + 1 connector per sublane)
// - supportBlocks: equals noteblocks (one support block under every note block)
export function computeGroupBlockCounts(group: LaneGroup) {
  let noteblocks = 0;
  let repeaters = 0;
  let dust = 0;

  group.sublanes.forEach((sublane) => {
    const branchInfo = sublane.branchFrom
      ? {
          sourceId: sublane.branchFrom.sourceId,
          savedTicks: sublane.branchFrom.savedTicks,
          savedCellCount: sublane.branchFrom.savedCellCount,
        }
      : null;
    const cells = buildCells(sublane.notes, {
      branchInfo,
      branchTaps: sublane.branchTaps || [],
    });
    cells.forEach((cell) => {
      if (cell.type === 'note') noteblocks++;
      else if (cell.type === 'repeater') repeaters++;
      else if (cell.type === 'dust' || cell.type === 'branch-tap') dust++;
    });
    dust++; // connector column: 1 redstone dust per sublane row
    if (group.sublanes.length > 1) dust++; // harmonic branch column: 1 redstone dust per sublane row
  });

  return {
    noteblocks,
    repeaters,
    dust,
    supportBlocks: noteblocks,
    supportBlock: getGroupSupportBlock(group),
  };
}

// Compute raw crafting / gathering resources from placed-block counts.
//
// Crafting chain:
//   note block  = 4 wooden planks + 1 redstone dust
//   repeater    = 3 stone + 1 redstone dust + 2 redstone torches
//   red. torch  = 1 stick + 1 redstone dust  →  2 torches = 2 sticks + 2 redstone
//   sticks      = 2 planks → 4 sticks  (so 2 sticks = 1 plank)
//   1 log       = 4 planks
//   9 redstone dust = 1 redstone block (for compaction display)
export function computeRawResources({ noteblocks, repeaters, dust }: BlockCounts) {
  // planks: noteblocks×4 (for note blocks) + repeaters×1 (2 sticks per repeater = 1 plank)
  const planks = noteblocks * 4 + repeaters * 1;
  const logs = Math.ceil(planks / 4);
  // redstone dust: placed dust + crafting for note blocks + crafting for repeaters (3 each)
  const redstoneDust = dust + noteblocks + repeaters * 3;
  const redstoneBlocks = Math.floor(redstoneDust / 9);
  const redstoneRemainder = redstoneDust % 9;
  const stone = repeaters * 3;
  return { planks, logs, redstoneDust, redstoneBlocks, redstoneRemainder, stone };
}

// ─── Tick-grid builder ────────────────────────────────────────────────────────
//
// Build a shared multi-instrument tick grid aligned on a global tick set.
//
// All instruments share the same anchor columns (one per unique tick across all
// instruments). Instruments that don't play at a given tick get a dust pass-through
// cell. Segments between anchors are padded with dust cells (after the repeaters)
// so all instruments' note columns land at the same horizontal pixel position.
//
// Returned structure:
// {
//   instruments: [ { id, label, block, rows: [ rowDef, ... ] } ],
//   anchors:     [ { kind: 'split'|'note', tick, index } ],
// }
//
// rowDef: { id, isSub,
//   segments: [ [repCell, ...], ... ],   // N+1 segments (before/between/after anchors)
//   anchorCells: [ anchorCell, ... ],    // N anchor cells (parallel to anchors[])
// }
//
// repCell: { kind: 'repeater', ticks } | { kind: 'dust' }
// anchorCell:
//   { kind: 'note', note, tick }          — note block (note may be null = pass-through)
//   { kind: 'split-pass' }                — vertical wire column, no branch
//   { kind: 'split-branch' }              — vertical wire column with horizontal branch
//   { kind: 'inactive' }                  — sub-row not active here

export function buildTickGrid(trackEvents: TrackEvents[]): TickGrid {
  // ── 1. Gather events per instrument ─────────────────────────────────────────
  const instrumentMap = new Map<string, NoteEvent[]>();
  trackEvents.forEach((track) => {
    if (!instrumentMap.has(track.title)) instrumentMap.set(track.title, []);
    instrumentMap.get(track.title)!.push(...track.events);
  });

  // ── 2. Convert to absolute ticks ──────────────────────────────────────────
  const instrumentTicks = new Map<string, GridNote[]>(); // instrument → [{absoluteTick,...}]
  instrumentMap.forEach((events, instrument) => {
    if (events.length === 0) return;
    const sorted = [...events].sort((a, b) => a.time - b.time || a.note - b.note);
    instrumentTicks.set(instrument, sorted.map((ev) => ({
      absoluteTick: Math.round(ev.time * 10),
      block: ev.block,
      instrument: ev.instrument,
      note: ev.note,
      pitch: ev.pitch,
    })));
  });

  if (instrumentTicks.size === 0) return { instruments: [], anchors: [] };

  // ── 3. Unique sorted global ticks ─────────────────────────────────────────
  const tickSet = new Set<number>();
  instrumentTicks.forEach((evts) => evts.forEach((e) => tickSet.add(e.absoluteTick)));
  const globalTicks = [...tickSet].sort((a, b) => a - b);

  // ── 4. Group simultaneous notes per instrument per tick ──────────────────
  const instAtTick = new Map<string, Map<number, GridNote[]>>(); // instrument → Map(tick → [event,...])
  instrumentTicks.forEach((evts, instrument) => {
    const byTick = new Map<number, GridNote[]>();
    evts.forEach((e) => {
      if (!byTick.has(e.absoluteTick)) byTick.set(e.absoluteTick, []);
      byTick.get(e.absoluteTick)!.push(e);
    });
    instAtTick.set(instrument, byTick);
  });

  // ── 5. Build shared anchors + per-instrument segment/anchor data ──────────
  const instrLastTick = new Map<string, number>();
  instrumentTicks.forEach((_, instrument) => instrLastTick.set(instrument, -1));

  const instrSegments = new Map<string, SegmentCell[][]>(); // instrument → segments[]
  const instrAnchors  = new Map<string, RawAnchorCell[]>(); // instrument → anchorCell[]
  instrumentTicks.forEach((_, instrument) => {
    instrSegments.set(instrument, []);
    instrAnchors.set(instrument, []);
  });

  const anchors: GridAnchor[] = []; // shared global anchor list

  globalTicks.forEach((tick) => {
    // Compute gap repeaters for instruments that play at this tick.
    const gapReps = new Map<string, SegmentCell[] | null>();
    instrumentTicks.forEach((_, instrument) => {
      const plays = instAtTick.get(instrument)?.has(tick) ?? false;
      if (!plays) { gapReps.set(instrument, null); return; }
      const last = instrLastTick.get(instrument)!;
      const gap = last < 0 ? tick : tick - last;
      gapReps.set(instrument, gap > 0
        ? decomposeDelay(gap).map((t) => ({ kind: 'repeater' as const, ticks: t }))
        : []);
    });

    // Determine if any instrument splits (≥2 simultaneous notes) here.
    let isSplitTick = false;
    instAtTick.forEach((byTick) => {
      if ((byTick.get(tick)?.length ?? 0) >= 2) isSplitTick = true;
    });

    // ── emit split anchor (if needed) ────────────────────────────────────────
    if (isSplitTick) {
      anchors.push({ kind: 'split', tick, index: anchors.length });
      instrumentTicks.forEach((_, instrument) => {
        const plays = instAtTick.get(instrument)?.has(tick) ?? false;
        const instNoteCount = instAtTick.get(instrument)?.get(tick)?.length ?? 0;
        instrSegments.get(instrument)!.push(plays ? (gapReps.get(instrument) ?? []) : []);
        if (instNoteCount >= 2) {
          // Main row of splitting instrument: signal in from left, out right and down to sub-rows.
          instrAnchors.get(instrument)!.push({
            kind: 'split-branch',
            connects: { left: true, right: true, up: false, down: true },
          });
        } else if (instNoteCount === 1) {
          // Plays one note: signal flows straight through horizontally.
          instrAnchors.get(instrument)!.push({
            kind: 'split-pass',
            connects: { left: true, right: true, up: false, down: false },
          });
        } else {
          // Doesn't play here: no signal, show nothing.
          instrAnchors.get(instrument)!.push({
            kind: 'split-pass',
            connects: { left: false, right: false, up: false, down: false },
          });
        }
        if (plays) gapReps.set(instrument, []); // consumed
      });
    }

    // ── emit note anchor ─────────────────────────────────────────────────────
    anchors.push({ kind: 'note', tick, isSplit: isSplitTick, index: anchors.length });
    instrumentTicks.forEach((_, instrument) => {
      const plays = instAtTick.get(instrument)?.has(tick) ?? false;
      const notes  = instAtTick.get(instrument)?.get(tick) ?? [];
      instrSegments.get(instrument)!.push(plays ? (gapReps.get(instrument) ?? []) : []);
      instrAnchors.get(instrument)!.push({ kind: 'note', notes, tick });
      if (notes.length > 0) instrLastTick.set(instrument, tick);
    });
  });

  // Trailing segment — empty for all instruments.
  instrumentTicks.forEach((_, instrument) => instrSegments.get(instrument)!.push([]));

  // ── Pad all segments to uniform width within each segment column ──────────
  // After repeaters, add dust cells so every row in a segment column has the
  // same width. This makes all note-anchor columns land at the same x position.
  const segmentCount = instrSegments.values().next().value?.length ?? 0;
  for (let si = 0; si < segmentCount; si++) {
    let maxLen = 0;
    instrumentTicks.forEach((_, instrument) => {
      maxLen = Math.max(maxLen, instrSegments.get(instrument)![si].length);
    });
    if (maxLen > 0) {
      instrumentTicks.forEach((_, instrument) => {
        const seg = instrSegments.get(instrument)![si];
        while (seg.length < maxLen) seg.push({ kind: 'dust' });
      });
    }
  }

  // ── 6. Build instrument rows ───────────────────────────────────────────────
  const instruments: GridInstrument[] = [];
  instrumentTicks.forEach((_, instrument) => {
    const byTick    = instAtTick.get(instrument);
    const segments  = instrSegments.get(instrument)!;
    const anchorArr = instrAnchors.get(instrument)!;

    let maxSimul = 1;
    byTick?.forEach((notes) => { maxSimul = Math.max(maxSimul, notes.length); });

    const mainAnchorCells = anchorArr.map((cell): AnchorCell => {
      if (cell.kind !== 'note') return { ...cell };
      return { kind: 'note', note: cell.notes[0] ?? null, tick: cell.tick };
    });
    const rows: GridRow[] = [{ id: `${instrument}-main`, isSub: false, segments, anchorCells: mainAnchorCells }];

    for (let subIdx = 1; subIdx < maxSimul; subIdx++) {
      const activeTicks = new Set(
        [...(byTick?.entries() ?? [])]
          .filter(([, notes]) => notes.length > subIdx)
          .map(([t]) => t),
      );
      if (activeTicks.size === 0) continue;

      const subAnchorCells = anchorArr.map((_, ai): AnchorCell => {
        const anchor = anchors[ai];
        if (anchor.kind === 'split' && activeTicks.has(anchor.tick)) {
          // Sub-row picks up from vertical bus above; may continue down if not the last sub-row.
          const hasBelow = (byTick?.get(anchor.tick)?.length ?? 0) > subIdx + 1;
          return {
            kind: 'split-branch',
            connects: { left: false, right: true, up: true, down: hasBelow },
          };
        }
        if (anchor.kind === 'note' && activeTicks.has(anchor.tick)) {
          return { kind: 'note', note: byTick?.get(anchor.tick)?.[subIdx] ?? null, tick: anchor.tick };
        }
        return { kind: 'inactive' };
      });

      // Sub-rows have empty segments (they only appear at their active anchors).
      const emptySeg: SegmentCell[][] = segments.map(() => []);
      rows.push({ id: `${instrument}-sub-${subIdx}`, isSub: true, segments: emptySeg, anchorCells: subAnchorCells });
    }

    const firstBlock = [...(byTick?.values() ?? [])].flat().find((e) => e.block)?.block ?? 'minecraft:dirt';
    instruments.push({ id: `inst-${instrument}`, label: instrument, block: firstBlock, rows });
  });

  return { instruments, anchors };
}

// Compact grid: every instrument is built on its own, so nothing is padded to line up
// with other instruments. Redstone dust remains only where a lane has to split into
// several lanes, and tick numbers are dropped (the repeater delays still carry the timing).
export function buildCompactGrid(trackEvents: TrackEvents[]): TickGrid {
  const titles = [...new Set(trackEvents.map((track) => track.title))];
  const instruments = titles.flatMap((title) => {
    const single = buildTickGrid(trackEvents.filter((track) => track.title === title));
    return single.instruments.map((inst) => ({ ...inst, anchors: single.anchors }));
  });
  return { instruments, anchors: [] };
}

// Anchors an instrument's cells are indexed by (its own in the compact grid).
export function anchorsOf(grid: TickGrid, inst: GridInstrument) {
  return inst.anchors ?? grid.anchors;
}

// Convert the logical grid into how it must really be built in Minecraft.
// Redstone dust connects to any adjacent dust and only powers a note block it points at, so:
//   - a gap row separates every pair of rows; the vertical bus runs through it with dust
//   - an extra dust follows each split column so the branch points into its note block
export function toMinecraftBuildGrid(grid: TickGrid): TickGrid {
  const pointsRight = (cell: AnchorCell | undefined) =>
    cell?.kind === 'split-branch' || cell?.kind === 'split-pass' ? !!cell.connects.right : false;

  const withExtraDust = (row: GridRow, anchors: GridAnchor[]): GridRow => {
    const segments = row.segments.map((seg) => [...seg]);
    row.anchorCells.forEach((cell, ai) => {
      if (anchors[ai]?.kind !== 'split') return;
      if (row.isSub && !pointsRight(cell)) return;
      segments[ai + 1] = [{ kind: 'dust' }, ...(segments[ai + 1] ?? [])];
    });
    return { ...row, segments };
  };

  const gapRow = (id: string, above: GridRow | null, anchors: GridAnchor[]): GridRow => ({
    id,
    isSub: true,
    isGap: true,
    segments: anchors.length === 0 ? [] : [...Array(anchors.length + 1)].map(() => []),
    anchorCells: anchors.map((_, ai): AnchorCell => {
      const cell = above?.anchorCells[ai];
      const bus = anchors[ai].kind === 'split' && cell?.kind === 'split-branch' && cell.connects.down;
      return bus
        ? { kind: 'split-pass', connects: { left: false, right: false, up: true, down: true } }
        : { kind: 'inactive' };
    })
  });

  const instruments = grid.instruments.map((inst, ii): GridInstrument => {
    const anchors = anchorsOf(grid, inst);
    const rows: GridRow[] = [];
    inst.rows.forEach((row, ri) => {
      rows.push(withExtraDust(row, anchors));
      if (ri < inst.rows.length - 1) rows.push(gapRow(`${inst.id}-gap-${ri}`, row, anchors));
    });
    if (ii < grid.instruments.length - 1) rows.push(gapRow(`${inst.id}-gap-end`, null, anchors));
    return { ...inst, rows };
  });
  return { instruments, anchors: grid.anchors, buildMode: true };
}

// Compute the minimum real-world Minecraft block dimensions for the schematic.
//
// Layout in Minecraft space:
//   X (length) — one block per cell along a row:
//       1 connector + Σ segment widths + anchor count (note/split columns)
//   Z (width)  — one block per schematic row (each lane is 1 block deep)
//   Y (height) — always 3:
//       Y=0 slab/support  |  Y=1 repeaters/dust/note blocks  |  Y=2 redstone on top
//
// Returns { x, z, y } — each is the minimum number of blocks in that dimension.
export function computeSchematicDimensions(grid: TickGrid | null) {
  if (!grid || grid.instruments.length === 0) return { x: 0, z: 0, y: 3 };

  // All rows of an instrument are padded to the same width (all instruments, unless compact).
  let x = 0;
  for (const inst of grid.instruments) {
    const mainRow = inst.rows[0];
    const anchorCount = anchorsOf(grid, inst).length;

    // X = connector (1) + each segment's cell count + each anchor (1)
    let instX = 1; // connector
    for (let ai = 0; ai <= anchorCount; ai++) {
      const seg = mainRow.segments[ai] ?? [];
      instX += seg.length; // segment cells (repeaters + dust padding)
      if (ai < anchorCount) instX += 1; // anchor cell (note block or split indicator)
    }
    x = Math.max(x, instX);
  }

  // Z = total number of schematic rows across all instruments
  const z = grid.instruments.reduce((s, inst) => s + inst.rows.length, 0);

  return { x, z, y: 3 };
}

// Count block totals for the tick-grid model.
export function computeTickGridBlockCounts(grid: TickGrid) {
  let noteblocks = 0, repeaters = 0, dust = 0;
  const supportMap = new Map<string, number>();
  grid.instruments.forEach((inst) => {
    inst.rows.forEach((row) => {
      row.anchorCells.forEach((cell) => {
        if (grid.buildMode && cell.kind !== 'note' && cell.kind !== 'inactive') {
          const c = cell.connects;
          if (!row.isSub || c.left || c.right || c.up || c.down) dust++;
        }
        if (cell.kind === 'note' && cell.note) {
          noteblocks++;
          const b = cell.note.block ?? inst.block;
          supportMap.set(b, (supportMap.get(b) ?? 0) + 1);
        } else if (cell.kind === 'note' && !cell.note) {
          dust++; // pass-through dust at non-playing anchor
        }
      });
      row.segments.forEach((seg) => {
        seg.forEach((cell) => {
          if (cell.kind === 'repeater') repeaters++;
          else if (cell.kind === 'dust') dust++;
        });
      });
      if (!row.isGap) dust++; // connector dust per row
    });
    // Each split anchor adds vertical dust for all rows of the instrument.
    if (!grid.buildMode) {
      const splitCount = anchorsOf(grid, inst).filter((a) => a.kind === 'split').length;
      dust += splitCount * inst.rows.length;
    }
  });
  return { noteblocks, repeaters, dust, supportBlocks: noteblocks, supportMap };
}

// Build groups — one per instrument, combining all same-instrument tracks.
// Simultaneous notes are split into sub-lanes connected by a vertical redstone rail.
// Sub-lanes with large start-delays branch off earlier lanes to reduce repeater usage.
export function buildLaneGroups(trackEvents: TrackEvents[]) {
  const instrumentMap = new Map<string, NoteEvent[]>();
  trackEvents.forEach((track) => {
    if (!instrumentMap.has(track.title)) instrumentMap.set(track.title, []);
    instrumentMap.get(track.title)!.push(...track.events);
  });

  const groups: LaneGroup[] = [];
  instrumentMap.forEach((events, instrument) => {
    if (events.length === 0) return;
    const sorted = [...events].sort((a, b) => a.time - b.time || a.note - b.note);
    const subLanes: SubLane[] = splitIntoSubLanes(sorted)
      .map((evts, i) => ({ id: `inst-${instrument}-${i}`, notes: eventsToPlacements(evts) }))
      .filter((sl) => sl.notes.length > 0);

    // Annotate sublanes that can branch off another lane to reduce start-delay repeaters.
    const branches = detectBranches(subLanes);
    subLanes.forEach((sl, i) => {
      if (branches[i]) {
        const srcIdx = branches[i].sourceIndex;
        const savedTicks = branches[i].savedTicks;
        const savedCellCount = countCellsToTick(
          subLanes[srcIdx].notes,
          savedTicks,
        );
        sl.branchFrom = {
          sourceId: subLanes[srcIdx].id,
          savedTicks,
          savedCellCount,
        };
        // Annotate the source lane with the tap position (right after the last shared
        // repeater). buildCells will insert a standalone branch-tap cell there.
        const srcLane = subLanes[srcIdx];
        if (!srcLane.branchTaps) srcLane.branchTaps = [];
        srcLane.branchTaps.push({ atCellCount: savedCellCount, childId: sl.id, savedTicks });
      }
    });

    if (subLanes.length > 0)
      groups.push({ id: `inst-${instrument}`, label: instrument, sublanes: subLanes });
  });
  return groups;
}
