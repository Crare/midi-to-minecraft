import dustCellSvg from '/src/assets/icons/dust-cell.svg';
export const CELL = 28;

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
