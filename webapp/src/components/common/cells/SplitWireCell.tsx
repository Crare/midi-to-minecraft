import { CELL } from '@constants';

const splitWireCellSvg = 'assets/icons/split-wire-cell.svg';
// Map connection keys to SVG filenames, e.g. 'L', 'LR', 'LUD', etc.
function getSplitWireCellSvg(connects: {
  left?: boolean;
  right?: boolean;
  up?: boolean;
  down?: boolean;
}) {
  // Build a key string in L, R, U, D order
  let key = '';
  if (connects.left) key += 'L';
  if (connects.right) key += 'R';
  if (connects.up) key += 'U';
  if (connects.down) key += 'D';
  // Default to all if none specified
  if (!key) key = 'LRUD';
  return `assets/icons/split-wire-cell-${key}.svg`;
}

/**
 * SplitWireCell renders a split wire (T-junction or cross) cell as an image in the schematic grid.
 * Used for schematic branches and wire splits. Purely visual, not interactive.
 *
 * Props:
 * - connects: Which directions the wire connects (left, right, up, down)
 * - size: Cell size in pixels (optional)
 */
export function SplitWireCell({
  connects = {},
  size,
}: {
  connects?: { left?: boolean; right?: boolean; up?: boolean; down?: boolean };
  size?: number;
}) {
  const s = size ?? CELL;
  const svgPath = getSplitWireCellSvg(connects);
  return (
    <img
      src={svgPath}
      width={s}
      height={s}
      style={{ display: 'block', flexShrink: 0 }}
      alt={`Split wire cell (${Object.keys(connects)
        .filter((k) => connects[k as keyof typeof connects])
        .join(',')})`}
      draggable={false}
      aria-hidden="true"
    />
  );
}
