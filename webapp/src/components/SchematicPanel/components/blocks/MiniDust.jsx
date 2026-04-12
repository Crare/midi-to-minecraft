import { MINI } from "../../../../constants";

export function MiniDust({ size = MINI }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0
      }}
    >
      <rect width="18" height="18" fill="rgba(0,0,0,0.08)" />
      <rect x="0" y="6" width="18" height="6" fill="#c0392b" />
    </svg>
  );
}
