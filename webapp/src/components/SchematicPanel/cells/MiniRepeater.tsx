const MINI = 18;

export function MiniRepeater({ size = MINI }: { size?: number }) {
  return (
    <img
      src={require('../../../../public/assets/icons/mini-repeater.svg')}
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
