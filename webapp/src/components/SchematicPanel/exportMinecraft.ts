import { instrumentByBlock } from '../../constants';
import type { AnchorCell, GridAnchor, GridInstrument, GridNote, GridRow, TickGrid } from '../../types';
import { anchorsOf, toMinecraftBuildGrid } from './schematicData';

export type MinecraftEdition = 'java' | 'bedrock';

interface BlockPlacement {
  x: number;
  y: number;
  z: number;
  block: string;
  note?: GridNote;
  repeaterDelay?: number;
}

function hasWireConnection(cell: Exclude<AnchorCell, { kind: 'note' | 'inactive' }>) {
  const { left, right, up, down } = cell.connects;
  return left || right || up || down;
}

function bedrockBlock(placement: BlockPlacement) {
  if (placement.block === 'minecraft:white_wool') {
    return 'minecraft:wool ["color"="white"]';
  }
  if (placement.block === 'minecraft:acacia_log') {
    return 'minecraft:log2 ["new_log_type"="acacia"]';
  }
  return placement.block;
}

function rowPlacements(
  instrument: GridInstrument,
  row: GridRow,
  anchors: GridAnchor[],
  z: number,
  supports: BlockPlacement[],
  blocks: BlockPlacement[]
) {
  if (!row.isGap) {
    supports.push({ x: 0, y: 0, z, block: 'minecraft:stone' });
    blocks.push({ x: 0, y: 1, z, block: 'minecraft:redstone_wire' });
  }

  let x = 1;
  for (let ai = 0; ai <= anchors.length; ai++) {
    for (const cell of row.segments[ai] ?? []) {
      if (cell.kind === 'repeater') {
        supports.push({ x, y: 0, z, block: 'minecraft:stone' });
        blocks.push({ x, y: 1, z, block: 'minecraft:repeater', repeaterDelay: cell.ticks });
      } else {
        supports.push({ x, y: 0, z, block: 'minecraft:stone' });
        blocks.push({ x, y: 1, z, block: 'minecraft:redstone_wire' });
      }
      x++;
    }

    if (ai >= anchors.length) continue;
    const cell = row.anchorCells[ai];
    if (cell?.kind === 'note' && cell.note) {
      const supportBlock = cell.note.block ?? instrument.block;
      supports.push({ x, y: 0, z, block: supportBlock });
      blocks.push({ x, y: 1, z, block: 'minecraft:note_block', note: cell.note });
    } else if (
      cell?.kind === 'note' ||
      (cell && cell.kind !== 'inactive' && (!row.isSub || hasWireConnection(cell)))
    ) {
      supports.push({ x, y: 0, z, block: 'minecraft:stone' });
      blocks.push({ x, y: 1, z, block: 'minecraft:redstone_wire' });
    }
    x++;
  }
}

function setblockLine(placement: BlockPlacement, edition: MinecraftEdition): string {
  const { x, y, z } = placement;
  const position = `~${x} ~${y} ~${z}`;

  if (placement.block === 'minecraft:repeater') {
    const delay = placement.repeaterDelay ?? 1;
    return edition === 'java'
      ? `setblock ${position} minecraft:repeater[facing=east,delay=${delay}]`
      : `setblock ${position} minecraft:unpowered_repeater ["direction"=3,"repeater_delay"=${delay - 1}]`;
  }

  if (placement.block === 'minecraft:note_block' && placement.note) {
    const note = placement.note;
    if (edition === 'java') {
      const block = note.block ?? 'minecraft:dirt';
      const instrument = instrumentByBlock[block] ?? 'harp';
      return `setblock ${position} minecraft:note_block[instrument=${instrument},note=${note.note}]`;
    }
    return `setblock ${position} minecraft:noteblock`;
  }

  if (edition === 'bedrock' && placement.block === 'minecraft:redstone_wire') {
    return `setblock ${position} minecraft:redstone_wire`;
  }

  return `setblock ${position} ${edition === 'bedrock' ? bedrockBlock(placement) : placement.block}`;
}

/** Build a Java- or Bedrock-compatible function for the full or compact build grid. */
export function buildMinecraftFunction(grid: TickGrid, edition: MinecraftEdition): string {
  const buildGrid = grid.buildMode ? grid : toMinecraftBuildGrid(grid);
  const supports: BlockPlacement[] = [];
  const blocks: BlockPlacement[] = [];
  let z = 0;

  buildGrid.instruments.forEach((instrument) => {
    const anchors = anchorsOf(buildGrid, instrument);
    instrument.rows.forEach((row) => {
      rowPlacements(instrument, row, anchors, z, supports, blocks);
      z++;
    });
  });

  const lines = [
    `# Minecraft ${edition === 'java' ? 'Java' : 'Bedrock'} Edition function; X=east, Z=south.`,
    '# Relative origin is the ground-level block at ~ ~ ~; supports are placed there.',
    ...(edition === 'bedrock'
      ? ['# Bedrock commands cannot set note-block pitch. Tune each note block manually; target pitches are listed below.']
      : []),
    ...supports.map((placement) => setblockLine(placement, edition)),
    ...blocks.flatMap((placement) => {
      if (edition !== 'bedrock' || !placement.note) return [setblockLine(placement, edition)];
      const { x, z: row } = placement;
      return [
        `# Tune note block at ~${x} ~1 ~${row} to pitch ${placement.note.note} (0-23).`,
        setblockLine(placement, edition)
      ];
    })
  ];

  return `${lines.join('\n')}\n`;
}
