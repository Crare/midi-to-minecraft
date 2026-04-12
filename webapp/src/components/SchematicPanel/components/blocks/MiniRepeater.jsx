import { MINI } from "../../../../constants";

export function MiniRepeater({ size = MINI }) {
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
      <rect width="18" height="18" fill="#ddd7ca" />
      <rect x="1" y="7" width="16" height="4" fill="#b94141" />
      {/* input torch */}
      <rect x="11" y="3" width="4" height="4" fill="#d63737" />
      {/* output torch */}
      <rect x="3" y="11" width="4" height="4" fill="#d63737" />
    </svg>
  );
}
