import { CELL } from "../../../../constants";

// Individual repeater — ticks is 1–4 (the repeater's delay setting).
// The output torch slides right as the delay increases, mirroring Minecraft's UI.
export function RepeaterCell({ ticks, size }) {
  const s = size ?? CELL;
  const outX = 6 + (ticks - 1) * 4; // 6 / 10 / 14 / 18 for 1t – 4t
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label={`Repeater ${ticks}t`}
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#b9b3a8" />
      <rect x="2" y="2" width="24" height="24" fill="#ddd7ca" />
      <rect x="2" y="11" width="24" height="6" fill="#b94141" />
      {/* Fixed input torch (right side) */}
      <rect x="18" y="5" width="4" height="4" fill="#d63737" />
      {/* Output torch — position indicates delay setting */}
      <rect x={outX} y="19" width="4" height="4" fill="#d63737" />
      {/* Delay label */}
      <text
        x="14"
        y="10"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="bold"
        fill="#222"
        fontFamily="monospace"
      >
        {ticks}
      </text>
    </svg>
  );
}
