import { MINI } from "../../../../constants";
import { blockColorFor } from "../../schematicData";

export function MiniNoteBlock({ block, size = MINI }) {
  const col = blockColorFor(block || "minecraft:dirt");
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
      {/* support block colour tint */}
      <rect width="18" height="18" fill={col} />
      {/* note block wood face */}
      <rect x="1" y="1" width="16" height="16" fill="#7d5221" />
      <rect x="2" y="2" width="14" height="5" fill="#9b6b2e" />
      {/* three dots */}
      <rect x="3" y="9" width="3" height="3" fill="#5a3a10" />
      <rect x="9" y="9" width="3" height="3" fill="#5a3a10" />
      <rect x="6" y="13" width="3" height="3" fill="#5a3a10" />
    </svg>
  );
}
