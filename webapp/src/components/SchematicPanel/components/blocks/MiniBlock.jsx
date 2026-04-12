import { MINI } from "../../../../constants";

export function MiniBlock({ color, size = MINI }) {
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
      <rect width="18" height="18" fill={color} />
      <rect x="1" y="1" width="16" height="6" fill="rgba(255,255,255,0.22)" />
      <rect x="0" y="15" width="18" height="3" fill="rgba(0,0,0,0.2)" />
    </svg>
  );
}
