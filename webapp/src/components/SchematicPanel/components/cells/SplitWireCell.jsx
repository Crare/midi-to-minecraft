import { CELL } from "../../../../constants";

// Flexible redstone wire cell — draws only the arms indicated by `connects`.
// Used for split anchor columns so each row shows the correct junction shape:
//   ━  horizontal pass-through (left+right)
//   ┬  T down  (left+right+down  — main row of a split)
//   ├  T right (up+down+right   — middle sub-row of a split)
//   └  corner  (up+right        — last sub-row of a split)
export function SplitWireCell({ connects = {}, size }) {
  const s = size ?? CELL;
  const { left, right, up, down } = connects;
  const col = "#c0392b";
  const any = left || right || up || down;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="28" height="28" fill={col} opacity="0.1" />
      {/* Arms from center (14,14) toward each edge */}
      {left && <rect x="0" y="11" width="14" height="6" fill={col} />}
      {right && <rect x="14" y="11" width="14" height="6" fill={col} />}
      {up && <rect x="11" y="0" width="6" height="14" fill={col} />}
      {down && <rect x="11" y="14" width="6" height="14" fill={col} />}
      {/* Centre square — always shown when any arm is present */}
      {any && <rect x="11" y="11" width="6" height="6" fill={col} />}
    </svg>
  );
}
