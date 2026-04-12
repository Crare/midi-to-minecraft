import { CELL } from "../../../../constants";

// Vertical split column for a row that is branching a sub-lane here.
// Shows the vertical bar plus a horizontal stub going right (to the sub-row note).
export function SplitBranchCell({ size }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#c0392b" opacity="0.1" />
      {/* Vertical bar */}
      <rect x="11" y="0" width="6" height="28" fill="#c0392b" />
      {/* Horizontal stub right — leading into the sub-row note */}
      <rect x="14" y="11" width="14" height="6" fill="#c0392b" />
    </svg>
  );
}
