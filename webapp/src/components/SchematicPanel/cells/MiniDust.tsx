const miniDustSvg = '/src/assets/icons/mini-dust.svg';
const MINI = 18;

export function MiniDust({ size = MINI }: { size?: number }) {
  return (
    <img
      src={miniDustSvg}
      width={size}
      height={size}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
      alt="Mini dust"
      draggable={false}
    />
  );
}
