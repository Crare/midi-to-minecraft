import { CELL } from '../../../constants';

const branchStartCellSvg = `${import.meta.env.BASE_URL}assets/icons/branch-start-cell.svg`;

/**
 * BranchStartCell renders the start of a schematic branch, showing where a lane splits off to save repeaters.
 * Displays the number of ticks saved. Purely visual, not interactive.
 *
 * Props:
 * - sourceId: ID of the source lane/track
 * - savedTicks: Number of ticks saved by branching
 * - size: Cell size in pixels (optional)
 */
export function BranchStartCell({
  sourceId,
  savedTicks,
  size,
}: {
  sourceId: string;
  savedTicks: number;
  size?: number;
}) {
  const s = size ?? CELL;
  return (
    <div
      style={{ width: s, height: s, position: 'relative', display: 'block', flexShrink: 0 }}
      aria-label={`Branch from ${sourceId}, saves ${savedTicks} ticks`}
    >
      <img
        src={branchStartCellSvg}
        width={s}
        height={s}
        style={{ display: 'block', width: s, height: s }}
        alt="Branch start cell"
        draggable={false}
      />
      <span
        style={{
          position: 'absolute',
          right: 2,
          top: 2,
          fontSize: 5,
          fontFamily: 'monospace',
          color: '#7f3e00',
          pointerEvents: 'none',
        }}
      >
        {savedTicks}
      </span>
    </div>
  );
}
