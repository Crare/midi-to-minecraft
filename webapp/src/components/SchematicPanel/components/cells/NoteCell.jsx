import { CELL } from "../../../../constants";
import { blockColorFor, blockLabel } from "../../schematicData";

export function NoteCell({ block, instrument, useCount, size }) {
  const s = size ?? CELL;
  const col = blockColorFor(block);
  const label = useCount != null ? String(useCount) : "";
  // Choose a contrasting text colour: dark on light blocks, light on dark.
  const textFill = "#000000aa";
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label={`${instrument} on ${blockLabel(block)}`}
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="28" height="28" fill={col} />
      {label !== "" && (
        <text
          x="14"
          y="19"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
          fill={textFill}
        >
          {label}
        </text>
      )}
    </svg>
  );
}
