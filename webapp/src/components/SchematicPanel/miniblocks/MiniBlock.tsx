import { MINI } from '@constants';

const miniBlockSvg = 'assets/icons/mini-block.svg';

export function MiniBlock({ color, size = MINI }: { color: string; size?: number }) {
  return (
    <img
      src={miniBlockSvg}
      width={size}
      height={size}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        background: color,
      }}
      alt="Mini block"
      draggable={false}
    />
  );
}
