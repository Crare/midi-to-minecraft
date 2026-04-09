// Rendered as an absolutely-positioned SVG that spans all sub-lane rows of a group.
// Draws a vertical backbone redstone line plus one horizontal branch per sub-lane.
import React from 'react';

interface HarmonicRailProps {
  count: number;
  cs: number;
}

const HarmonicRail: React.FC<HarmonicRailProps> = ({ count, cs }) => {
  const rowH = cs + 2; // each row is cs tall + 2px gap
  const totalH = count * cs + (count - 1) * 2;
  const midX = Math.round(cs / 2);

  return (
    <svg
      width={cs}
      height={totalH}
      style={{ position: 'absolute', left: cs + 2, top: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden="true"
    >
      {/* Vertical backbone */}
      <rect x={midX - 3} y={0} width={6} height={totalH} fill="#c0392b" />
      {/* Horizontal branch to each sub-lane */}
      {Array.from({ length: count }, (_, i) => {
        const branchY = i * rowH + Math.round(cs / 2) - 3;
        return (
          <rect
            key={i}
            x={midX - 3}
            y={branchY}
            width={cs - (midX - 3)}
            height={6}
            fill="#c0392b"
          />
        );
      })}
    </svg>
  );
};

export default HarmonicRail;
