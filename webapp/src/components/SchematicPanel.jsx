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

// Split events into non-overlapping sub-lanes (handles simultaneous / harmonic notes)
function splitIntoSubLanes(events) {
  const sorted = [...events].sort((a, b) => a.time - b.time || a.note - b.note);
  const lanes = [];
  const epsilon = 1e-6;
  sorted.forEach((event) => {
    let lane = lanes.find((l) => event.time + epsilon >= l.lastEndTime);
    if (!lane) {
      lane = { lastEndTime: -Infinity, events: [] };
      lanes.push(lane);
    }
    lane.events.push(event);
    lane.lastEndTime = Math.max(lane.lastEndTime, event.endTime);
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

function buildCells(notes) {
  const cells = [];
  notes.forEach((p, idx) => {
    if (idx > 0) {
      if (p.delay > 0) {
        cells.push({ type: 'repeater', count: Math.max(1, Math.ceil(p.delay / 4)), delay: p.delay, key: `rep-${idx}` });
      } else {
        cells.push({ type: 'dust', key: `dust-${idx}` });
      }
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

// Build groups (one per MIDI track, each with sub-lanes for harmonics)
function buildLaneGroups(trackEvents, combineTracks) {
  if (combineTracks) {
    const allEvents = trackEvents
      .flatMap((t) => t.events)
      .sort((a, b) => a.time - b.time || a.note - b.note);
    if (allEvents.length === 0) return [];
    const subLanes = splitIntoSubLanes(allEvents)
      .map((evts, i) => ({ id: `combined-${i}`, notes: eventsToPlacements(evts) }))
      .filter((sl) => sl.notes.length > 0);
    return subLanes.length > 0 ? [{ id: 'combined', label: 'All Tracks', sublanes: subLanes }] : [];
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

function RepeaterCell({ count, size }) {
  const s = size ?? CELL;
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-label={`${count} repeater(s)`} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill="#b9b3a8" />
      <rect x="2" y="2" width="24" height="24" fill="#ddd7ca" />
      <rect x="2" y="11" width="24" height="6" fill="#b94141" />
      <rect x="6" y="6" width="4" height="4" fill="#d63737" />
      <rect x="18" y="6" width="4" height="4" fill="#d63737" />
      {count > 1 && <text x="14" y="22" textAnchor="middle" fontSize="7" fill="#333" fontFamily="monospace">×{count}</text>}
    </svg>
  );
}

// direction: 'h' | 'v' | 'cross' | 'tee-down' | 'tee-up' | 'corner-up'
function DustCell({ direction = 'h', size }) {
  const s = size ?? CELL;
  const showH   = ['h', 'cross', 'tee-down', 'tee-up'].includes(direction);
  const showRightOnly = direction === 'corner-up';
  const showV   = direction === 'v';
  const showDown = ['tee-down', 'cross'].includes(direction);
  const showUp   = ['tee-up', 'cross', 'corner-up'].includes(direction);
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill="#888" opacity="0.15" />
      {showH         && <rect x="0"  y="11" width="28" height="6" fill="#c0392b" />}
      {showRightOnly && <rect x="14" y="11" width="14" height="6" fill="#c0392b" />}
      {showV         && <rect x="11" y="0"  width="6" height="28" fill="#c0392b" />}
      {showDown      && <rect x="11" y="14" width="6" height="14" fill="#c0392b" />}
      {showUp        && <rect x="11" y="0"  width="6" height="14" fill="#c0392b" />}
    </svg>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

function SchematicGrid({ groups, cellSize }) {
  const cs = cellSize ?? CELL;
  if (groups.length === 0) return null;

  const multipleGroups = groups.length > 1;

  // Flatten to a list of rows so we can track absolute row index for tooltip direction
  const flatRows = [];
  groups.forEach((group, groupIndex) => {
    group.sublanes.forEach((sublane, sublaneIndex) => {
      flatRows.push({
        sublane,
        sublaneIndex,
        sublaneCount: group.sublanes.length,
        groupId: group.id,
        groupLabel: group.label,
        groupIndex,
        showGroupSeparator: groupIndex > 0 && sublaneIndex === 0,
        showGroupLabel: multipleGroups && sublaneIndex === 0,
      });
    });
  });

  return (
    <div className="schematic-grid">
      {flatRows.map((row, flatIndex) => {
        const { sublane, sublaneIndex, sublaneCount, showGroupSeparator, showGroupLabel, groupLabel, groupIndex } = row;
        const isFirstRow = flatIndex === 0;
        const cells = buildCells(sublane.notes);

        let connectorDir = 'h';
        if (sublaneCount > 1) {
          if (sublaneIndex === 0) connectorDir = 'tee-down';
          else if (sublaneIndex === sublaneCount - 1) connectorDir = 'corner-up';
          else connectorDir = 'cross';
        }

        return (
          <div key={sublane.id}>
            {showGroupSeparator && <div className="schematic-group-separator" />}
            {showGroupLabel && (
              <div className="schematic-group-label">{groupLabel}</div>
            )}
            <div className="schematic-row">
              <div className="schematic-connector" style={{ width: cs, height: cs, flexShrink: 0 }}>
                <DustCell direction={connectorDir} size={cs} />
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
                      <RepeaterCell count={cell.count} size={cs} />
                      <span className={`cell-tooltip${isFirstRow ? ' cell-tooltip-below' : ''}`} role="tooltip">
                        Delay: {cell.delay} ticks<br />
                        Repeaters: ~{cell.count}
                      </span>
                    </div>
                  );
                }
                if (cell.type === 'dust') {
                  return (
                    <div key={cell.key} className="schematic-cell">
                      <DustCell direction="h" size={cs} />
                    </div>
                  );
                }
                return null;
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
  const [cellSize, setCellSize] = useState(28);
  const [indicatorX, setIndicatorX] = useState(0);

  const contentRef = useRef(null);
  const indicatorDragRef = useRef({ active: false, startClientX: 0, startX: 0 });

  const groups = useMemo(() => buildLaneGroups(trackEvents, combineTracks), [trackEvents, combineTracks]);
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
            Top-down schematic. Background color = instrument block. Tracks with simultaneous notes
            branch into parallel lanes connected by redstone dust.
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
                <SchematicGrid groups={groups} cellSize={cellSize} />
              )}
            </div>
          </DragScrollArea>
        </div>
      ) : null}
    </section>
  );
}
