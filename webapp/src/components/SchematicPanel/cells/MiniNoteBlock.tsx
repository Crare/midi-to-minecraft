import { blockColorFor } from '../schematicData';

const MINI = 18;

export function MiniNoteBlock({ block, size = MINI }: { block: any; size?: number }) {
  const col = blockColorFor(block || 'minecraft:dirt');
  return (
    <img
      src={require('../../../../public/assets/icons/mini-note-block.svg')}
      width={size}
      height={size}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        background: col,
      }}
      alt="Mini note block"
      draggable={false}
    />
  );
}
