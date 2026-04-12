import { CELL } from "../../../../constants";

// Phantom repeater — represents the portion of the signal path shared with the source lane
// before the branch tap point. Rendered faded to show it's not physically present in this lane.
export function PhantomRepeaterCell({ ticks, size }) {
  const s = size ?? CELL;
  const outX = 6 + (ticks - 1) * 4;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label={`Shared path ${ticks}t`}
      style={{ display: "block", flexShrink: 0, opacity: 0.25 }}
    >
      <rect width="28" height="28" fill="#b9b3a8" />
      <rect x="2" y="2" width="24" height="24" fill="#ddd7ca" />
      <rect x="2" y="11" width="24" height="6" fill="#b94141" />
      <rect x="18" y="5" width="4" height="4" fill="#d63737" />
      <rect x={outX} y="19" width="4" height="4" fill="#d63737" />
      <text
        x="26"
        y="10"
        textAnchor="end"
        fontSize="5"
        fill="#333"
        fontFamily="monospace"
      >
        {ticks}t
      </text>
    </svg>
  );
}
