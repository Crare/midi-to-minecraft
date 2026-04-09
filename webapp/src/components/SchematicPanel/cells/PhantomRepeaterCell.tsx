import phantomRepeaterCellSvg from '/src/assets/icons/phantom-repeater-cell.svg';
export const CELL = 28;

export function PhantomRepeaterCell({ ticks, size }: { ticks: number; size?: number }) {
  const s = size ?? CELL;
  return (
    <div
      style={{
        width: s,
        height: s,
        position: 'relative',
        display: 'block',
        flexShrink: 0,
        opacity: 0.25,
      }}
      aria-label={`Shared path ${ticks}t`}
    >
      <img
        src={phantomRepeaterCellSvg}
        width={s}
        height={s}
        style={{ display: 'block', width: s, height: s }}
        alt="Phantom repeater cell"
        draggable={false}
      />
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          fontSize: 5,
          fontFamily: 'monospace',
          color: '#333',
          pointerEvents: 'none',
          marginTop: 2,
          marginRight: 2,
        }}
      >
        {ticks}t
      </span>
    </div>
  );
}
