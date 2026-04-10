import { CELL } from '@constants';

const dustCellSvg = `${import.meta.env.BASE_URL}assets/icons/dust-cell.svg`;
/**
 * RedstoneDustCell renders a single redstone dust cell as an image in the schematic grid.
 * Used for passthrough and wiring cells. Purely visual, not interactive.
 *
 * Props:
 * - size: Cell size in pixels (optional)
 */
export function RedstoneDustCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <img
      src={dustCellSvg}
      width={s}
      height={s}
      style={{ display: 'block', flexShrink: 0 }}
      alt="Dust cell"
      draggable={false}
      aria-hidden="true"
    />
  );
}
