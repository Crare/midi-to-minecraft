import { CELL } from '../../../constants';

const phantomRepeaterCellSvg = '/midi-to-minecraft/assets/icons/phantom-repeater-cell.svg';

/**
 * PhantomRepeaterCell renders a semi-transparent repeater cell for shared/phantom paths in the schematic grid.
 * Used to indicate timing paths that are not physically built. Purely visual, not interactive.
 *
 * Props:
 * - ticks: Number of ticks the repeater represents
 * - size: Cell size in pixels (optional)
 */
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
