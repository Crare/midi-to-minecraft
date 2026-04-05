import { blockColorFor, blockLabel } from './schematicData';

const CELL = 28;

export { CELL };

export function NoteCell({ block, instrument, useCount, size }) {
  const s = size ?? CELL;
  const col = blockColorFor(block);
  const label = useCount != null ? String(useCount) : '';
  // Choose a contrasting text colour: dark on light blocks, light on dark.
  const textFill = '#000000aa';
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-label={`${instrument} on ${blockLabel(block)}`} style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill={col} />
      {label !== '' && (
        <text x="14" y="19" textAnchor="middle" fontSize="11" fontWeight="bold" fontFamily="monospace" fill={textFill}>{label}</text>
      )}
    </svg>
  );
}

// Individual repeater — ticks is 1–4 (the repeater's delay setting).
// The output torch slides right as the delay increases, mirroring Minecraft's UI.
export function RepeaterCell({ ticks, size }) {
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
      <text x="14" y="10" textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="bold" fill="#222" fontFamily="monospace">{ticks}</text>
    </svg>
  );
}

export function DustCell({ size }) {
  const s = size ?? CELL;
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill="#888" opacity="0.15" />
      <rect x="0" y="11" width="28" height="6" fill="#c0392b" />
    </svg>
  );
}

// T-junction on the source/parent lane pointing downward — marks where a child lane branches off.
export function BranchTapCell({ size }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s} height={s} viewBox="0 0 28 28"
      aria-label="Branch tap point"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#e67e22" opacity="0.2" />
      {/* Horizontal signal wire */}
      <rect x="0" y="11" width="28" height="6" fill="#e67e22" />
      {/* Vertical tap going downward (to the child lane below) */}
      <rect x="11" y="14" width="6" height="14" fill="#e67e22" />
    </svg>
  );
}

// Phantom repeater — represents the portion of the signal path shared with the source lane
// before the branch tap point. Rendered faded to show it's not physically present in this lane.
export function PhantomRepeaterCell({ ticks, size }) {
  const s = size ?? CELL;
  const outX = 6 + (ticks - 1) * 4;
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-label={`Shared path ${ticks}t`} style={{ display: 'block', flexShrink: 0, opacity: 0.25 }}>
      <rect width="28" height="28" fill="#b9b3a8" />
      <rect x="2" y="2" width="24" height="24" fill="#ddd7ca" />
      <rect x="2" y="11" width="24" height="6" fill="#b94141" />
      <rect x="18" y="5" width="4" height="4" fill="#d63737" />
      <rect x={outX} y="19" width="4" height="4" fill="#d63737" />
      <text x="26" y="10" textAnchor="end" fontSize="5" fill="#333" fontFamily="monospace">{ticks}t</text>
    </svg>
  );
}

// T-junction indicator: this lane branches off another lane to save repeaters.
export function BranchStartCell({ sourceId, savedTicks, size }) {
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

// Flexible redstone wire cell — draws only the arms indicated by `connects`.
// Used for split anchor columns so each row shows the correct junction shape:
//   ━  horizontal pass-through (left+right)
//   ┬  T down  (left+right+down  — main row of a split)
//   ├  T right (up+down+right   — middle sub-row of a split)
//   └  corner  (up+right        — last sub-row of a split)
export function SplitWireCell({ connects = {}, size }) {
  const s = size ?? CELL;
  const { left, right, up, down } = connects;
  const col = '#c0392b';
  const any = left || right || up || down;
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill={col} opacity="0.1" />
      {/* Arms from center (14,14) toward each edge */}
      {left  && <rect x="0"  y="11" width="14" height="6" fill={col} />}
      {right && <rect x="14" y="11" width="14" height="6" fill={col} />}
      {up    && <rect x="11" y="0"  width="6" height="14" fill={col} />}
      {down  && <rect x="11" y="14" width="6" height="14" fill={col} />}
      {/* Centre square — always shown when any arm is present */}
      {any   && <rect x="11" y="11" width="6"  height="6"  fill={col} />}
    </svg>
  );
}

// ─── Mini icons for material / resource lists (18 × 18 px) ───────────────────

// Vertical redstone column — pass-through for rows that aren't splitting.
// Shows a full-height red bar (the shared vertical signal column).
export function SplitPassCell({ size }) {
  const s = size ?? CELL;
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill="#c0392b" opacity="0.1" />
      {/* Full vertical bar — the shared column */}
      <rect x="11" y="0" width="6" height="28" fill="#c0392b" />
    </svg>
  );
}

// Vertical split column for a row that is branching a sub-lane here.
// Shows the vertical bar plus a horizontal stub going right (to the sub-row note).
export function SplitBranchCell({ size }) {
  const s = size ?? CELL;
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect width="28" height="28" fill="#c0392b" opacity="0.1" />
      {/* Vertical bar */}
      <rect x="11" y="0" width="6" height="28" fill="#c0392b" />
      {/* Horizontal stub right — leading into the sub-row note */}
      <rect x="14" y="11" width="14" height="6" fill="#c0392b" />
    </svg>
  );
}

const MINI = 18;

export function MiniNoteBlock({ block, size = MINI }) {
  const col = blockColorFor(block || 'minecraft:dirt');
  return (
    <svg width={size} height={size} viewBox="0 0 18 18"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      {/* support block colour tint */}
      <rect width="18" height="18" fill={col} />
      {/* note block wood face */}
      <rect x="1" y="1" width="16" height="16" fill="#7d5221" />
      <rect x="2" y="2" width="14" height="5" fill="#9b6b2e" />
      {/* three dots */}
      <rect x="3" y="9" width="3" height="3" fill="#5a3a10" />
      <rect x="9" y="9" width="3" height="3" fill="#5a3a10" />
      <rect x="6" y="13" width="3" height="3" fill="#5a3a10" />
    </svg>
  );
}

export function MiniRepeater({ size = MINI }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <rect width="18" height="18" fill="#ddd7ca" />
      <rect x="1" y="7" width="16" height="4" fill="#b94141" />
      {/* input torch */}
      <rect x="11" y="3" width="4" height="4" fill="#d63737" />
      {/* output torch */}
      <rect x="3" y="11" width="4" height="4" fill="#d63737" />
    </svg>
  );
}

export function MiniDust({ size = MINI }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <rect width="18" height="18" fill="rgba(0,0,0,0.08)" />
      <rect x="0" y="6" width="18" height="6" fill="#c0392b" />
    </svg>
  );
}

export function MiniBlock({ color, size = MINI }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <rect width="18" height="18" fill={color} />
      <rect x="1" y="1" width="16" height="6" fill="rgba(255,255,255,0.22)" />
      <rect x="0" y="15" width="18" height="3" fill="rgba(0,0,0,0.2)" />
    </svg>
  );
}
