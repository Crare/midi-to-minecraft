import { blockColorFor, blockLabel } from '../schematicData';
const noteCellSvg = '/assets/icons/note-cell.svg';

export const CELL = 28;

export function NoteCell({
  block,
  instrument,
  useCount,
  size,
}: {
  block: any;
  instrument: string;
  useCount?: number;
  size?: number;
}) {
  const s = size ?? CELL;
  const col = blockColorFor(block);
  const label = useCount != null ? String(useCount) : '';
  return (
    <div
      style={{ width: s, height: s, position: 'relative', display: 'block', flexShrink: 0 }}
      aria-label={`${instrument} on ${blockLabel(block)}`}
    >
      <img
        src={noteCellSvg}
        width={s}
        height={s}
        style={{ display: 'block', width: s, height: s, background: col }}
        alt="Note cell"
        draggable={false}
      />
      {label !== '' && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color: '#000000aa',
            pointerEvents: 'none',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
