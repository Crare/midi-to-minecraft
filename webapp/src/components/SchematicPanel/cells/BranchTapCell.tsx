import { CELL } from '@components/constants';

const branchTapCellSvg = `${import.meta.env.BASE_URL}assets/icons/branch-tap-cell.svg`;

/**
 * BranchTapCell renders a tap point on a schematic branch, indicating where a branch connects to the main lane.
 * Purely visual, not interactive.
 *
 * Props:
 * - size: Cell size in pixels (optional)
 */
export function BranchTapCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <img
      src={branchTapCellSvg}
      width={s}
      height={s}
      style={{ display: 'block', flexShrink: 0 }}
      alt="Branch tap cell"
      draggable={false}
      aria-label="Branch tap point"
    />
  );
}
