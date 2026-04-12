import { CELL } from "../../../../constants";

export function DustCell({ size }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#888" opacity="0.15" />
      <rect x="0" y="11" width="28" height="6" fill="#c0392b" />
    </svg>
  );
}
