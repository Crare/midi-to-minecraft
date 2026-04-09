import repeaterCellSvg from '../../../assets/icons/repeater-cell.svg';
export const CELL = 28;

export function RepeaterCell({ ticks, size }: { ticks: number; size?: number }) {
  const s = size ?? CELL;
  return (
    <div
      style={{ width: s, height: s, position: 'relative', display: 'block', flexShrink: 0 }}
      aria-label={`Repeater ${ticks}t`}
    >
      <img
        src={repeaterCellSvg}
        width={s}
        height={s}
        style={{ display: 'block', width: s, height: s }}
        alt="Repeater cell"
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
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 'bold',
          fontFamily: 'monospace',
          color: '#222',
          pointerEvents: 'none',
          marginTop: 2,
        }}
      >
        {ticks}
      </span>
    </div>
  );
}
