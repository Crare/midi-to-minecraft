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

// Build the flat cell list for one sub-lane row.
// - idx=0 with branchInfo: show a branch-start cell, then only the remaining delay repeaters
// - idx=0 with delay>0 (no branch): initial start-delay repeaters
// - idx>0 with delay>0: inter-note gap repeaters
// - idx>0 with delay=0: redstone dust (consecutive notes)
export function buildCells(notes, { branchInfo = null } = {}) {
  const cells = [];
  notes.forEach((p, idx) => {
    const isBranching = idx === 0 && branchInfo != null;
    const delay = isBranching ? Math.max(0, p.delay - branchInfo.savedTicks) : p.delay;

    if (isBranching) {
      // Show a branch-start indicator, then any residual delay after the tap point.
      cells.push({ type: 'branch-start', sourceId: branchInfo.sourceId, savedTicks: branchInfo.savedTicks, key: 'branch-start' });
      if (delay > 0) {
        decomposeDelay(delay).forEach((t, ti) => {
          cells.push({ type: 'repeater', ticks: t, key: `rep-0-${ti}` });
        });
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
  return cells;
}

// After assigning notes to sublanes, find where a sublane with a large start-delay can
// "branch off" from an earlier sublane instead of running independent start repeaters.
// Returns an array parallel to `sublanes`; entries are { sourceIndex, savedTicks } or null.
export function detectBranches(sublanes, minSavings = 8) {
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
    if (bestSaved < minSavings) return null;
    return { sourceIndex: bestSrcIdx, savedTicks: bestSaved };
  });
}

// Build groups (one per MIDI track, each with sub-lanes for harmonics).
// groupByInstrument: merge all same-instrument tracks into one group with harmonic sublanes.
export function buildLaneGroups(trackEvents, combineTracks, groupByInstrument) {
  if (combineTracks) {
    const allEvents = trackEvents
      .flatMap((t) => t.events)
      .sort((a, b) => a.time - b.time || a.note - b.note);
    if (allEvents.length === 0) return [];
    const subLanes = splitIntoSubLanes(allEvents)
      .map((evts, i) => ({ id: `combined-${i}`, notes: eventsToPlacements(evts) }))
      .filter((sl) => sl.notes.length > 0);

    // Annotate sublanes that can branch off another lane to reduce start-delay repeaters.
    const branches = detectBranches(subLanes);
    subLanes.forEach((sl, i) => {
      if (branches[i]) {
        sl.branchFrom = {
          sourceId: subLanes[branches[i].sourceIndex].id,
          savedTicks: branches[i].savedTicks,
        };
      }
    });

    return subLanes.length > 0 ? [{ id: 'combined', label: 'All Tracks', sublanes: subLanes }] : [];
  }

  if (groupByInstrument) {
    // Collect all events per instrument across all tracks, then re-split into sublanes.
    const instrumentMap = new Map();
    trackEvents.forEach((track) => {
      if (!instrumentMap.has(track.title)) instrumentMap.set(track.title, []);
      instrumentMap.get(track.title).push(...track.events);
    });
    const groups = [];
    instrumentMap.forEach((events, instrument) => {
      if (events.length === 0) return;
      const sorted = [...events].sort((a, b) => a.time - b.time);
      const subLanes = splitIntoSubLanes(sorted)
        .map((evts, i) => ({ id: `inst-${instrument}-${i}`, notes: eventsToPlacements(evts) }))
        .filter((sl) => sl.notes.length > 0);
      if (subLanes.length > 0)
        groups.push({ id: `inst-${instrument}`, label: instrument, sublanes: subLanes });
    });
    return groups;
  }

  return trackEvents
    .filter((t) => t.events.length > 0)
    .map((track) => {
      const subLanes = splitIntoSubLanes(track.events)
        .map((evts, i) => ({ id: `${track.id}-${i}`, notes: eventsToPlacements(evts) }))
        .filter((sl) => sl.notes.length > 0);
      return { id: track.id, label: track.title, sublanes: subLanes };
    })
    .filter((g) => g.sublanes.length > 0);
}
