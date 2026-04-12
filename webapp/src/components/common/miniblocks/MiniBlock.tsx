export function MiniBlock({ color = '#fff', size = 16 }: { color?: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: color,
        display: 'inline-block',
        border: '1px solid #888',
        borderRadius: 2,
      }}
      aria-label="Mini block"
    />
  );
}
