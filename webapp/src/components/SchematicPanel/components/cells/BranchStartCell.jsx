import { CELL } from "../../../../constants";

// T-junction indicator: this lane branches off another lane to save repeaters.
export function BranchStartCell({ sourceId, savedTicks, size }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label={`Branch from ${sourceId}, saves ${savedTicks} ticks`}
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#e67e22" opacity="0.2" />
      {/* Horizontal signal wire */}
      <rect x="0" y="11" width="28" height="6" fill="#e67e22" />
      {/* Vertical tap going upward (to the source lane above) */}
      <rect x="11" y="0" width="6" height="14" fill="#e67e22" />
      {/* Saved-ticks label */}
      <text
        x="27"
        y="10"
        textAnchor="end"
        fontSize="5"
        fill="#7f3e00"
        fontFamily="monospace"
      >
        ↥{savedTicks}
      </text>
    </svg>
  );
}
