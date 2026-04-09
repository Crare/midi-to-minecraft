const splitWireCellSvg = '/assets/icons/split-wire-cell.svg';
export const CELL = 28;

export function SplitWireCell({
  connects = {},
  size,
}: {
  connects?: { left?: boolean; right?: boolean; up?: boolean; down?: boolean };
  size?: number;
}) {
  const s = size ?? CELL;
  return (
    <img
      src={splitWireCellSvg}
      width={s}
      height={s}
      style={{ display: 'block', flexShrink: 0 }}
      alt="Split wire cell"
      draggable={false}
      aria-hidden="true"
    />
  );
}
