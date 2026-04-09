const MINI = 18;

export function MiniBlock({ color, size = MINI }: { color: string; size?: number }) {
  return (
    <img
      src={require('../../../../public/assets/icons/mini-block.svg')}
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
