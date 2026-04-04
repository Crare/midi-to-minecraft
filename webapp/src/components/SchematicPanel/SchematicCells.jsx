import { blockColorFor, blockLabel } from './schematicData';

const CELL = 28;

export { CELL };

export function NoteCell({ block, instrument, size }) {
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
      <text x="26" y="10" textAnchor="end" fontSize="5" fill="#333" fontFamily="monospace">{ticks}t</text>
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
