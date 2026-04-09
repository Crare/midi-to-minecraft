export const CELL = 28;

export function DustCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <img
      src={require('../../../../public/assets/icons/dust-cell.svg')}
      width={s}
      height={s}
      style={{ display: 'block', flexShrink: 0 }}
      alt="Dust cell"
      draggable={false}
      aria-hidden="true"
    />
  );
}
