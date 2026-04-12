import { CELL } from "../../../../constants";

// T-junction on the source/parent lane pointing downward — marks where a child lane branches off.
export function BranchTapCell({ size }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label="Branch tap point"
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#e67e22" opacity="0.2" />
      {/* Horizontal signal wire */}
      <rect x="0" y="11" width="28" height="6" fill="#e67e22" />
      {/* Vertical tap going downward (to the child lane below) */}
      <rect x="11" y="14" width="6" height="14" fill="#e67e22" />
    </svg>
  );
}
