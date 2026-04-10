import { blockColorFor } from '@components/SchematicPanel/schematicData';
import { MINI } from '@constants';
const miniNoteBlockSvg = 'assets/icons/mini-note-block.svg';

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
