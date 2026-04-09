import { CELL } from '../../../constants';

const splitPassCellSvg = '/midi-to-minecraft/assets/icons/split-pass-cell.svg';

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
