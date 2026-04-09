import { blockColorFor } from '../schematicData';
import miniNoteBlockSvg from '/src/assets/icons/mini-note-block.svg';

const MINI = 18;

export function MiniNoteBlock({ block, size = MINI }: { block: any; size?: number }) {
  const col = blockColorFor(block || 'minecraft:dirt');
  return (
    <img
      src={miniNoteBlockSvg}
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
