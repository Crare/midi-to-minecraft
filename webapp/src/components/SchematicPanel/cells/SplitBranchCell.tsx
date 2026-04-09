import { CELL } from '../../../constants';

const splitBranchCellSvg = `${import.meta.env.BASE_URL}assets/icons/split-branch-cell.svg`;

/**
 * SplitBranchCell renders a split branch (T-junction) cell as an image in the schematic grid.
 * Used to visually indicate where a schematic lane branches off. Purely visual, not interactive.
 *
 * Props:
 * - size: Cell size in pixels (optional)
 */
export function SplitBranchCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <img
      src={splitBranchCellSvg}
      width={s}
      height={s}
      style={{ display: 'block', flexShrink: 0 }}
      alt="Split branch cell"
      draggable={false}
      aria-hidden="true"
    />
  );
}
