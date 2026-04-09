import { CELL } from '@components/constants';

const splitPassCellSvg = `${import.meta.env.BASE_URL}assets/icons/split-pass-cell.svg`;

/**
 * SplitPassCell renders a split pass (straight-through) cell as an image in the schematic grid.
 * Used to visually indicate a passthrough at a schematic split. Purely visual, not interactive.
 *
 * Props:
 * - size: Cell size in pixels (optional)
 */
export function SplitPassCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <img
      src={splitPassCellSvg}
      width={s}
      height={s}
      style={{ display: 'block', flexShrink: 0 }}
      alt="Split pass cell"
      draggable={false}
      aria-hidden="true"
    />
  );
}
