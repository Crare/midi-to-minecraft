import { CELL } from '../../../constants';

const repeaterCellSvg = '/midi-to-minecraft/assets/icons/repeater-cell.svg';

/**
 * RepeaterCell renders a repeater cell in the schematic grid, displaying the tick delay value.
 * Used for timing and delay visualization in schematic segments. Purely visual, not interactive.
 *
 * Props:
 * - ticks: Number of ticks the repeater represents
 * - size: Cell size in pixels (optional)
 */
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
