import { CELL } from '../../../constants';

const dustCellSvg = '/midi-to-minecraft/assets/icons/dust-cell.svg';

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
