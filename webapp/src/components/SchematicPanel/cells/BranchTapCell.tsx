import branchTapCellSvg from '/src/assets/icons/branch-tap-cell.svg';
export const CELL = 28;

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
