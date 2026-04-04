// ─── Block colors (top-down view of the instrument support block) ──────────────
export const blockColor = {
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

export function blockColorFor(blockId) {
  return blockColor[blockId] || '#8a8a8a';
}

export function blockLabel(blockId) {
  const name = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// How many times to right-click the noteblock to get this pitch (0-23)
export function getUseCount(note) {
  return ((note % 24) + 24) % 24;
}

// ─── Lane splitting ────────────────────────────────────────────────────────────

// Split events into non-overlapping sub-lanes (handles simultaneous / harmonic notes).
// Uses best-fit (latest-ending available lane) to minimise inter-note gaps and repeater use.
export function splitIntoSubLanes(events) {
  const sorted = [...events].sort((a, b) => a.time - b.time || a.note - b.note);
  const lanes = [];
  const epsilon = 1e-6;
  sorted.forEach((event) => {
    // Best-fit: prefer the lane whose lastEndTime is closest (but still ≤) event.time.
    // This minimises gaps, reducing total repeater usage.
    let best = null;
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

export function eventsToPlacements(events) {
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
export function decomposeDelay(ticks) {
  const result = [];
  for (let rem = ticks; rem > 0; rem -= 4) {
    result.push(Math.min(rem, 4));
  }
  return result;
}

// Count how many cells the source lane renders from its start up to the signal point at tapTick.
// The tap occurs on the last repeater (or dust) of the delay chain reaching tapTick, so we
// exclude the note cell at tapTick itself — the T-junction lives on the wire, not the note block.
export function countCellsToTick(notes, tapTick) {
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
export function buildCells(notes, { branchInfo = null, branchTaps = [] } = {}) {
  const cells = [];
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
export function detectBranches(sublanes, minSavings = 0) {
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
export function getGroupSupportBlock(group) {
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
export function computeGroupBlockCounts(group) {
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
export function computeRawResources({ noteblocks, repeaters, dust }) {
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
// Build a synchronized multi-instrument tick grid.
//
// All instrument lanes share the same X-axis column layout so that every tick
// fires at the exact same horizontal position across all rows.
//
// Returned structure:
// {
//   instruments: [{ id, label, block, rows: [ rowDef, ... ] }],
//   columns:     [ colDef, ... ],   // flat ordered list of display columns
// }
//
// colDef kinds:
//   { kind: 'repeater', ticks }   — one repeater cell (1–4 t)
//   { kind: 'spacer' }            — empty alignment cell (instrument doesn't need
//                                   a repeater here but another instrument does)
//   { kind: 'split' }             — vertical redstone column (some instrument has
//                                   ≥2 simultaneous notes at the upcoming tick)
//   { kind: 'note' }              — note column (each row renders its note or empty)
//
// rowDef (per instrument row): { id, isSub, cells: [ cellEntry, ... ] }
// cellEntry mirrors colDef kind, plus note-specific info:
//   { kind: 'spacer' | 'repeater' | 'split-pass' | 'note', ... }

export function buildTickGrid(trackEvents) {
  // ── 1. Gather events per instrument ─────────────────────────────────────────
  const instrumentMap = new Map(); // instrument → [event, ...]
  trackEvents.forEach((track) => {
    if (!instrumentMap.has(track.title)) instrumentMap.set(track.title, []);
    instrumentMap.get(track.title).push(...track.events);
  });

  // ── 2. Convert each instrument's events to absolute ticks ──────────────────
  // Each event: { absoluteTick, block, instrument, note, pitch }
  const instrumentTicks = new Map(); // instrument → sorted [{absoluteTick, ...}]
  instrumentMap.forEach((events, instrument) => {
    if (events.length === 0) return;
    const sorted = [...events].sort((a, b) => a.time - b.time || a.note - b.note);
    const withTicks = sorted.map((ev) => ({
      absoluteTick: Math.round(ev.time * 10),
      block: ev.block,
      instrument: ev.instrument,
      note: ev.note,
      pitch: ev.pitch,
    }));
    instrumentTicks.set(instrument, withTicks);
  });

  if (instrumentTicks.size === 0) return { instruments: [], columns: [] };

  // ── 3. Build sorted list of unique global ticks ────────────────────────────
  const tickSet = new Set();
  instrumentTicks.forEach((evts) => evts.forEach((e) => tickSet.add(e.absoluteTick)));
  const globalTicks = [...tickSet].sort((a, b) => a - b);

  // ── 4. For each instrument and each global tick: collect simultaneous notes ─
  // instAtTick[instrument][tick] = [event, ...]
  const instAtTick = new Map();
  instrumentTicks.forEach((evts, instrument) => {
    const byTick = new Map();
    evts.forEach((e) => {
      if (!byTick.has(e.absoluteTick)) byTick.set(e.absoluteTick, []);
      byTick.get(e.absoluteTick).push(e);
    });
    instAtTick.set(instrument, byTick);
  });

  // ── 5. Build column sequence ───────────────────────────────────────────────
  // For each consecutive (prevTick → curTick) interval:
  //   a) compute tick gap
  //   b) decompose into repeater delays
  //   c) pad shorter repeater chains with spacers so all rows align
  //   d) if any instrument has ≥2 notes at curTick → append a 'split' column
  //   e) append a 'note' column

  // We track, per instrument, the "last tick" played so we can compute gaps.
  // If an instrument has no note at a global tick it just gets spacers.
  const instrLastTick = new Map(); // instrument → last played absolute tick (-1 = not yet)
  instrumentTicks.forEach((_, instrument) => instrLastTick.set(instrument, -1));

  const columns = []; // global column definitions

  // Per-instrument per-column cell assignments.
  // We'll build rowCells[instrument] = [cellEntry, ...]
  const rowCells = new Map();
  instrumentTicks.forEach((_, instrument) => rowCells.set(instrument, []));

  globalTicks.forEach((tick) => {
    // For every instrument: compute gap (in ticks) from its last-played tick to this tick.
    // Instruments that don't play at this tick still need to stay aligned.
    const gapRepeaters = new Map(); // instrument → decomposeDelay result (or [])

    instrumentTicks.forEach((_, instrument) => {
      const last = instrLastTick.get(instrument);
      const plays = instAtTick.get(instrument)?.has(tick) ?? false;
      if (plays) {
        const gap = last < 0 ? tick : tick - last;
        gapRepeaters.set(instrument, gap > 0 ? decomposeDelay(gap) : []);
      } else {
        gapRepeaters.set(instrument, null); // not playing at this tick
      }
    });

    // Maximum repeater count across all playing instruments for this gap.
    let maxRepCount = 0;
    gapRepeaters.forEach((reps) => {
      if (reps != null) maxRepCount = Math.max(maxRepCount, reps.length);
    });

    // Emit repeater / spacer columns.
    for (let ci = 0; ci < maxRepCount; ci++) {
      columns.push({ kind: 'repeater', colIndex: columns.length });
      instrumentTicks.forEach((_, instrument) => {
        const reps = gapRepeaters.get(instrument);
        if (reps != null && ci < reps.length) {
          rowCells.get(instrument).push({ kind: 'repeater', ticks: reps[ci] });
        } else {
          rowCells.get(instrument).push({ kind: 'spacer' });
        }
      });
    }

    // Determine if this tick is a "split" tick (any instrument has ≥2 simultaneous notes).
    let isSplitTick = false;
    instAtTick.forEach((byTick) => {
      if ((byTick.get(tick)?.length ?? 0) >= 2) isSplitTick = true;
    });

    if (isSplitTick) {
      columns.push({ kind: 'split', tick, colIndex: columns.length });
      instrumentTicks.forEach((_, instrument) => {
        const instNoteCount = instAtTick.get(instrument)?.get(tick)?.length ?? 0;
        // The splitting instrument's main row shows a branch-out; others just pass through.
        rowCells.get(instrument).push(instNoteCount >= 2 ? { kind: 'split-branch' } : { kind: 'split-pass' });
      });
    }

    // Emit note column.
    columns.push({ kind: 'note', tick, isSplit: isSplitTick, colIndex: columns.length });
    instrumentTicks.forEach((_, instrument) => {
      const notes = instAtTick.get(instrument)?.get(tick) ?? [];
      rowCells.get(instrument).push({ kind: 'note', notes, tick });
      if (notes.length > 0) instrLastTick.set(instrument, tick);
    });
  });

  // ── 6. Build instrument rows with sub-lane splitting ───────────────────────
  // For each instrument: the main row carries notes[0] at each tick.
  // Sub-rows carry notes[1], notes[2], ... and are active only while needed.
  //
  // A sub-row for simultaneous note[k] (k≥1) starts at the 'split' column before
  // its note and ends at the column after its last consecutive split participation.
  // "Kill" rule: a sub-row terminates when the next gap from its note to the next
  // note of main lane is ≤ the gap the main lane already has — meaning the sub-row
  // has no further independent notes to carry.
  //
  // For simplicity: each sub-row is active from its first split-note column to the
  // column just after its last note (it plays only simultaneous notes, never carrying
  // independent inter-note gaps).

  const instruments = [];
  instrumentTicks.forEach((_, instrument) => {
    const byTick = instAtTick.get(instrument);
    const mainCells = rowCells.get(instrument);

    // Maximum simultaneous notes at any tick for this instrument.
    let maxSimul = 1;
    byTick?.forEach((notes) => { maxSimul = Math.max(maxSimul, notes.length); });

    // Build the main row and sub-rows.
    const rows = [];

    // Main row: note[0] at each tick (or empty if instrument doesn't play that tick).
    const mainRowCells = mainCells.map((cell) => {
      if (cell.kind !== 'note') return { ...cell };
      const note = cell.notes[0] ?? null;
      return { kind: 'note', note, tick: cell.tick, isMain: true };
    });
    rows.push({ id: `${instrument}-main`, isSub: false, cells: mainRowCells });

    // Sub-rows for notes[1], notes[2], etc.
    // Each sub-row is "active" (visible) only from the split column before its note
    // through the note column; outside that range the cell is type 'inactive'.
    for (let subIdx = 1; subIdx < maxSimul; subIdx++) {
      // Determine which ticks this sub-row has a note.
      const activeTicks = new Set(
        [...(byTick?.entries() ?? [])].filter(([, notes]) => notes.length > subIdx).map(([t]) => t),
      );
      if (activeTicks.size === 0) continue;

      // Build cells: inactive everywhere, active at split-pass and note columns within activeTicks.
      // To determine activity per column, we walk columns and track whether we're "active".
      const subCells = [];
      columns.forEach((col, ci) => {
        if (col.kind === 'split' && activeTicks.has(col.tick)) {
          subCells.push({ kind: 'split-branch' }); // T-junction going to sub-row
        } else if (col.kind === 'note' && activeTicks.has(col.tick)) {
          const note = instAtTick.get(instrument)?.get(col.tick)?.[subIdx] ?? null;
          subCells.push({ kind: 'note', note, tick: col.tick, isMain: false });
        } else {
          subCells.push({ kind: 'inactive' });
        }
      });

      rows.push({ id: `${instrument}-sub-${subIdx}`, isSub: true, cells: subCells });
    }

    // Pick support block from first event with a block.
    const firstBlock = [...(byTick?.values() ?? [])].flat().find((e) => e.block)?.block ?? 'minecraft:dirt';

    instruments.push({ id: `inst-${instrument}`, label: instrument, block: firstBlock, rows });
  });

  return { instruments, columns };
}

// Count block totals for the tick-grid model.
export function computeTickGridBlockCounts(grid) {
  let noteblocks = 0, repeaters = 0, dust = 0;
  const supportMap = new Map();
  grid.instruments.forEach((inst) => {
    inst.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell.kind === 'note' && cell.note) {
          noteblocks++;
          const b = cell.note.block ?? inst.block;
          supportMap.set(b, (supportMap.get(b) ?? 0) + 1);
        } else if (cell.kind === 'repeater') {
          repeaters++;
        } else if (cell.kind === 'spacer' || cell.kind === 'split-pass' || cell.kind === 'split-branch' || cell.kind === 'inactive') {
          // pass — no placed block
        }
      });
      dust++; // connector dust per row
    });
    // split-pass columns count as vertical dust
    grid.columns.forEach((col) => {
      if (col.kind === 'split') dust += inst.rows.length;
    });
  });
  const supportBlocks = noteblocks;
  return { noteblocks, repeaters, dust, supportBlocks, supportMap };
}

// Build groups — one per instrument, combining all same-instrument tracks.
// Simultaneous notes are split into sub-lanes connected by a vertical redstone rail.
// Sub-lanes with large start-delays branch off earlier lanes to reduce repeater usage.
export function buildLaneGroups(trackEvents) {
  const instrumentMap = new Map();
  trackEvents.forEach((track) => {
    if (!instrumentMap.has(track.title)) instrumentMap.set(track.title, []);
    instrumentMap.get(track.title).push(...track.events);
  });

  const groups = [];
  instrumentMap.forEach((events, instrument) => {
    if (events.length === 0) return;
    const sorted = [...events].sort((a, b) => a.time - b.time || a.note - b.note);
    const subLanes = splitIntoSubLanes(sorted)
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
