const branchStartCellSvg = '/assets/icons/branch-start-cell.svg';
export const CELL = 28;

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
