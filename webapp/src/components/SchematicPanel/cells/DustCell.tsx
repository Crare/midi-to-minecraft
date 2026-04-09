import { CELL } from '@components/constants';

const dustCellSvg = `${import.meta.env.BASE_URL}assets/icons/dust-cell.svg`;
/**
 * DustCell renders a single redstone dust cell as an image in the schematic grid.
 * Used for passthrough and wiring cells. Purely visual, not interactive.
 *
 * Props:
 * - size: Cell size in pixels (optional)
 */
export function DustCell({ size }: { size?: number }) {
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
