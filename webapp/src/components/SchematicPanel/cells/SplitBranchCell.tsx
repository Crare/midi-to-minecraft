import splitBranchCellSvg from '../../../../assets/icons/split-branch-cell.svg';
export const CELL = 28;

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
