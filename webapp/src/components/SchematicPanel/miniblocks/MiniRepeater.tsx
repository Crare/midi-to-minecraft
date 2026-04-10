import { MINI } from '@constants';

const miniRepeaterSvg = 'assets/icons/mini-repeater.svg';

export function MiniRepeater({ size = MINI }: { size?: number }) {
  return (
    <img
      src={miniRepeaterSvg}
      width={size}
      height={size}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
      alt="Mini repeater"
      draggable={false}
    />
  );
}
