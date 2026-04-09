import { CELL } from '@components/constants';

const splitWireCellSvg = `${import.meta.env.BASE_URL}assets/icons/split-wire-cell.svg`;

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
  return (
    <img
      src={splitWireCellSvg}
      width={s}
      height={s}
      style={{ display: 'block', flexShrink: 0 }}
      alt="Split wire cell"
      draggable={false}
      aria-hidden="true"
    />
  );
}
