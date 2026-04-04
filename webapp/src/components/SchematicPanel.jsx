import { useRef, useMemo, useState, useEffect } from 'react';
import { playPlacementSound } from '../audio/noteblockAudio';
import DragScrollArea from './DragScrollArea';

// ─── Block colors (top-down view of the instrument support block) ──────────────
const blockColor = {
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

function blockColorFor(blockId) {
  return blockColor[blockId] || '#8a8a8a';
}

function blockLabel(blockId) {
  const name = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// How many times to right-click the noteblock to get this pitch (0-23)
function getUseCount(note) {
  return ((note % 24) + 24) % 24;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

// Split events into non-overlapping sub-lanes (handles simultaneous / harmonic notes).
// Uses best-fit (latest-ending available lane) to minimise inter-note gaps and repeater use.
function splitIntoSubLanes(events) {
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

function eventsToPlacements(events) {
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
function decomposeDelay(ticks) {
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
// - trailingTick: when set, pad the row to that absolute tick with filler repeaters
function buildCells(notes, { trailingTick = null, branchInfo = null } = {}) {
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
      // Include the initial start delay (idx=0) and all inter-note gaps
      decomposeDelay(delay).forEach((t, ti) => {
        cells.push({ type: 'repeater', ticks: t, key: `rep-${idx}-${ti}` });
      });
    } else if (idx > 0) {
      // Consecutive notes with no gap → redstone dust
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

  // Trailing filler for "align tracks" mode — pad this row to globalMaxTick
  if (trailingTick !== null && notes.length > 0) {
    const lastTick = notes[notes.length - 1].startTick;
    const trailing = trailingTick - lastTick;
    if (trailing > 0) {
      decomposeDelay(trailing).forEach((t, ti) => {
        cells.push({ type: 'repeater', ticks: t, key: `trail-${ti}` });
      });
    }
  }

  return cells;
}

// After assigning notes to sublanes, find where a sublane with a large start-delay can
// "branch off" from an earlier sublane instead of running independent start repeaters.
// Returns an array parallel to `sublanes`; entries are { sourceIndex, savedTicks } or null.
function detectBranches(sublanes, minSavings = 8) {
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
function buildLaneGroups(trackEvents, combineTracks, groupByInstrument) {
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

// ─── Cell SVG renderers ───────────────────────────────────────────────────────

const CELL = 28;

function NoteCell({ block, instrument, size }) {
  const s = size ?? CELL;
  const col = blockColorFor(block);
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-label={`${instrument} on ${blockLabel(block)}`} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill={col} />
      <rect x="4" y="4" width="20" height="20" fill="#6b4a2a" />
      <rect x="6" y="6" width="16" height="16" fill="#a97744" />
      <rect x="6" y="6" width="16" height="5" fill="#c79057" />
      <rect x="8" y="13" width="3" height="3" fill="#6b4a2a" />
      <rect x="14" y="13" width="3" height="3" fill="#6b4a2a" />
      <rect x="11" y="17" width="3" height="3" fill="#6b4a2a" />
    </svg>
  );
}

// Individual repeater — ticks is 1–4 (the repeater's delay setting).
// The output torch slides right as the delay increases, mirroring Minecraft's UI.
function RepeaterCell({ ticks, size }) {
  const s = size ?? CELL;
  const outX = 6 + (ticks - 1) * 4; // 6 / 10 / 14 / 18 for 1t – 4t
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-label={`Repeater ${ticks}t`} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill="#b9b3a8" />
      <rect x="2" y="2" width="24" height="24" fill="#ddd7ca" />
      <rect x="2" y="11" width="24" height="6" fill="#b94141" />
      {/* Fixed input torch (right side) */}
      <rect x="18" y="5" width="4" height="4" fill="#d63737" />
      {/* Output torch — position indicates delay setting */}
      <rect x={outX} y="19" width="4" height="4" fill="#d63737" />
      {/* Delay label */}
      <text x="26" y="10" textAnchor="end" fontSize="5" fill="#333" fontFamily="monospace">{ticks}t</text>
    </svg>
  );
}

function DustCell({ size }) {
  const s = size ?? CELL;
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill="#888" opacity="0.15" />
      <rect x="0" y="11" width="28" height="6" fill="#c0392b" />
    </svg>
  );
}

// ─── Branch-start cell (T-junction indicator: this lane branches off another lane) ────
function BranchStartCell({ sourceId, savedTicks, size }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s} height={s} viewBox="0 0 28 28"
      aria-label={`Branch from ${sourceId}, saves ${savedTicks} ticks`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#e67e22" opacity="0.2" />
      {/* Horizontal signal wire */}
      <rect x="0" y="11" width="28" height="6" fill="#e67e22" />
      {/* Vertical tap going upward (to the source lane above) */}
      <rect x="11" y="0" width="6" height="14" fill="#e67e22" />
      {/* Saved-ticks label */}
      <text x="27" y="10" textAnchor="end" fontSize="5" fill="#7f3e00" fontFamily="monospace">↥{savedTicks}
      </text>
    </svg>
  );
}

// ─── Harmonic rail (vertical redstone connecting parallel sub-lanes) ────────────
//
// Rendered as an absolutely-positioned SVG that spans all sub-lane rows of a group.
// Draws a vertical backbone redstone line plus one horizontal branch per sub-lane.
function HarmonicRail({ count, cs }) {
  const rowH = cs + 2; // each row is cs tall + 2px gap
  const totalH = count * cs + (count - 1) * 2;
  const midX = Math.round(cs / 2);

  return (
    <svg
      width={cs}
      height={totalH}
      style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden="true"
    >
      {/* Vertical backbone */}
      <rect x={midX - 3} y={0} width={6} height={totalH} fill="#c0392b" />
      {/* Horizontal branch to each sub-lane */}
      {Array.from({ length: count }, (_, i) => {
        const branchY = i * rowH + Math.round(cs / 2) - 3;
        return (
          <rect
            key={i}
            x={midX - 3}
            y={branchY}
            width={cs - (midX - 3)}
            height={6}
            fill="#c0392b"
          />
        );
      })}
    </svg>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

function SchematicGrid({ groups, cellSize }) {
  const cs = cellSize ?? CELL;
  if (groups.length === 0) return null;

  const multipleGroups = groups.length > 1;

  return (
    <div className="schematic-grid">
      {groups.map((group, groupIndex) => {
        const isHarmonic = group.sublanes.length > 1;
        const isFirstGroup = groupIndex === 0;

        return (
          <div key={group.id} className="schematic-group">
            {!isFirstGroup && <div className="schematic-group-separator" />}
            {multipleGroups && (
              <div className="schematic-group-label">{group.label}</div>
            )}
            {/* Sublanes wrapper — relative so the HarmonicRail SVG can be absolutely positioned */}
            <div
              className={isHarmonic ? 'schematic-sublanes' : undefined}
              style={isHarmonic ? { position: 'relative' } : undefined}
            >
              {isHarmonic && <HarmonicRail count={group.sublanes.length} cs={cs} />}
              {group.sublanes.map((sublane, sublaneIndex) => {
                const isFirstRow = isFirstGroup && sublaneIndex === 0;
                const trailingTick = null;
                const branchInfo = sublane.branchFrom
                  ? { sourceId: sublane.branchFrom.sourceId, savedTicks: sublane.branchFrom.savedTicks }
                  : null;
                const cells = buildCells(sublane.notes, { trailingTick, branchInfo });

                return (
                  <div key={sublane.id} className="schematic-row">
                    {/* Connector column — empty for harmonic rows (HarmonicRail draws here) */}
                    <div className="schematic-connector" style={{ width: cs, height: cs, flexShrink: 0 }}>
                      {!isHarmonic && <DustCell size={cs} />}
                    </div>
                    {cells.map((cell) => {
                      if (cell.type === 'note') {
                        return (
                          <div
                            key={cell.key}
                            className="schematic-cell schematic-cell-tip"
                            tabIndex={0}
                            role="button"
                            aria-label={`${cell.instrument} - ${cell.pitch || 'drum'}`}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => void playPlacementSound({ instrument: cell.instrument, note: cell.note, pitch: cell.pitch })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                void playPlacementSound({ instrument: cell.instrument, note: cell.note, pitch: cell.pitch });
                              }
                            }}
                          >
                            <NoteCell block={cell.block} instrument={cell.instrument} size={cs} />
                            <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
                              {cell.instrument}<br />
                              {cell.pitch || 'drum'}<br />
                              Use count: {cell.useCount}<br />
                              {blockLabel(cell.block)}
                            </span>
                          </div>
                        );
                      }
                      if (cell.type === 'repeater') {
                        return (
                          <div key={cell.key} className="schematic-cell schematic-cell-tip" tabIndex={0}>
                            <RepeaterCell ticks={cell.ticks} size={cs} />
                            <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
                              Repeater: {cell.ticks} tick{cell.ticks !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      }
                      if (cell.type === 'dust') {
                        return (
                          <div key={cell.key} className="schematic-cell">
                            <DustCell size={cs} />
                          </div>
                        );
                      }
                      if (cell.type === 'branch-start') {
                        return (
                          <div key={cell.key} className="schematic-cell schematic-cell-tip" tabIndex={0}>
                            <BranchStartCell sourceId={cell.sourceId} savedTicks={cell.savedTicks} size={cs} />
                            <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
                              T-junction: branch from {cell.sourceId}<br />
                              Saves {cell.savedTicks} ticks<br />
                              (~{decomposeDelay(cell.savedTicks).length} fewer repeater{decomposeDelay(cell.savedTicks).length !== 1 ? 's' : ''})
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function SchematicPanel({ trackEvents }) {
  const [open, setOpen] = useState(false);
  const [combineTracks, setCombineTracks] = useState(false);
  const [groupByInstrument, setGroupByInstrument] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const [indicatorX, setIndicatorX] = useState(0);

  const contentRef = useRef(null);
  const indicatorDragRef = useRef({ active: false, startClientX: 0, startX: 0 });

  const groups = useMemo(
    () => buildLaneGroups(trackEvents, combineTracks, groupByInstrument),
    [trackEvents, combineTracks, groupByInstrument],
  );
  const totalNotes = useMemo(
    () => groups.reduce((s, g) => s + g.sublanes.reduce((ss, sl) => ss + sl.notes.length, 0), 0),
    [groups],
  );
  const totalRows = useMemo(() => groups.reduce((s, g) => s + g.sublanes.length, 0), [groups]);
  const hasData = trackEvents.length > 0;

  useEffect(() => {
    if (hasData) setOpen(true);
  }, [hasData]);

  function onIndicatorPointerDown(e) {
    e.preventDefault();
    e.stopPropagation();
    indicatorDragRef.current = { active: true, startClientX: e.clientX, startX: indicatorX };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onIndicatorPointerMove(e) {
    if (!indicatorDragRef.current.active) return;
    const delta = e.clientX - indicatorDragRef.current.startClientX;
    const maxX = contentRef.current ? contentRef.current.scrollWidth : 999999;
    setIndicatorX(Math.max(0, Math.min(indicatorDragRef.current.startX + delta, maxX)));
  }

  function onIndicatorPointerUp() {
    indicatorDragRef.current.active = false;
  }

  return (
    <section className="panel schematic-panel">
      <button
        type="button"
        className="panel-header panel-header-toggle"
        onClick={() => { if (hasData) setOpen((o) => !o); }}
        aria-expanded={open}
        disabled={!hasData}
      >
        <h2>4) Build Schematic (Top-Down)</h2>
        <span className="panel-header-meta">
          {!hasData
            ? 'No tracks yet'
            : open
              ? 'Hide'
              : `Show ${totalRows} lane(s), ${totalNotes} note(s)`}
        </span>
      </button>

      {open ? (
        <div className="panel-body">
          <div className="schematic-controls">
            <label className="option-row">
              <input
                type="checkbox"
                checked={combineTracks}
                onChange={(e) => setCombineTracks(e.target.checked)}
              />
              <span>Combine all tracks into minimal lanes</span>
            </label>
            <label className="option-row">
              <input
                type="checkbox"
                checked={groupByInstrument}
                disabled={combineTracks}
                onChange={(e) => setGroupByInstrument(e.target.checked)}
              />
              <span>Group by instrument (show harmonics with vertical redstone)</span>
            </label>
            <label className="option-row option-row-stacked">
              <span>Cell size</span>
              <select value={cellSize} onChange={(e) => setCellSize(Number(e.target.value))}>
                <option value={20}>Small (20px)</option>
                <option value={28}>Medium (28px)</option>
                <option value={36}>Large (36px)</option>
                <option value={48}>XL (48px)</option>
              </select>
            </label>
          </div>

          <p className="hint output-summary">
            Top-down schematic. Background color = instrument block. Each repeater shows its
            individual delay setting (1–4 t). Tracks starting later include leading repeaters.
            Harmonics are connected by a vertical redstone rail on the left.
            An orange T-junction cell marks where a lane branches off another lane to save repeaters.
            Drag the gold marker to track your build progress.
          </p>

          {/* Legend */}
          <div className="schematic-legend">
            {Object.entries(blockColor).map(([blockId, color]) => (
              <div key={blockId} className="schematic-legend-item">
                <span className="schematic-legend-swatch" style={{ background: color }} />
                <span className="schematic-legend-label">{blockLabel(blockId)}</span>
              </div>
            ))}
          </div>

          <DragScrollArea className="schematic-scroll">
            <div ref={contentRef} className="schematic-content">
              {groups.length > 0 && (
                <button
                  type="button"
                  className="schematic-indicator"
                  style={{ left: `${indicatorX}px` }}
                  onPointerDown={onIndicatorPointerDown}
                  onPointerMove={onIndicatorPointerMove}
                  onPointerUp={onIndicatorPointerUp}
                  onPointerCancel={onIndicatorPointerUp}
                  aria-label="Drag to mark build progress"
                >
                  <span className="schematic-indicator-line" aria-hidden="true" />
                  <span className="schematic-indicator-head" aria-hidden="true" />
                </button>
              )}
              {groups.length === 0 ? (
                <p className="hint">No notes to display.</p>
              ) : (
                <SchematicGrid
                  groups={groups}
                  cellSize={cellSize}
                />
              )}
            </div>
          </DragScrollArea>
        </div>
      ) : null}
    </section>
  );
}
