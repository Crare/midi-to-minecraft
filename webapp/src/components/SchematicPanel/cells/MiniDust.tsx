const MINI = 18;

export function MiniDust({ size = MINI }: { size?: number }) {
  return (
    <img
      src={require('../../../../public/assets/icons/mini-dust.svg')}
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
