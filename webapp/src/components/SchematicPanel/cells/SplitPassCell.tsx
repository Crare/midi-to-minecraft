import splitPassCellSvg from '../../../assets/icons/split-pass-cell.svg';
export const CELL = 28;

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
