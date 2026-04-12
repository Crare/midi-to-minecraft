import Box from '@mui/material/Box';
import { useMemo } from 'react';
import { MiniDust, MiniNoteBlock, MiniRepeater, SupportBlock } from './SchematicCells';
import {
  blockLabel,
  computeRawResources,
  computeSchematicDimensions,
  computeTickGridBlockCounts,
} from './schematicData';
import TotalsChip from './TotalsChip';

interface BlocksNeededSummaryProps {
  grid: any;
}

export default function BlocksNeededSummary({ grid }: BlocksNeededSummaryProps) {
  if (
    !grid ||
    !grid.instruments ||
    !Array.isArray(grid.instruments) ||
    grid.instruments.length === 0
  )
    return null;

  const dimensions = useMemo(() => computeSchematicDimensions(grid), [grid]);

  const totalBlockCounts = useMemo((): {
    noteblocks: number;
    repeaters: number;
    dust: number;
    supportMap: Map<string, number>;
    raw: {
      logs: number;
      planks: number;
      redstoneDust: number;
      redstoneBlocks: number;
      redstoneRemainder: number;
      stone: number;
    };
    supportEntries: [string, number][];
  } => {
    if (!grid || !Array.isArray(grid.instruments)) return {} as any;
    const c = computeTickGridBlockCounts(grid);
    const raw = computeRawResources(c);
    const supportEntries = [...(c.supportMap?.entries?.() ?? [])];
    return { ...c, raw, supportEntries };
  }, [grid]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, my: 2 }}>
      <Box>
        <Box component="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 1 }}>
          Blocks needed
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <TotalsChip
            icon={<MiniNoteBlock block="minecraft:dirt" size={18} />}
            count={totalBlockCounts?.noteblocks}
            label="note blocks"
          />
          <TotalsChip
            icon={<MiniRepeater size={18} />}
            count={totalBlockCounts?.repeaters}
            label="repeaters"
          />
          <TotalsChip
            icon={<MiniDust size={18} />}
            count={totalBlockCounts?.dust}
            label="redstone dust"
          />
          {totalBlockCounts?.supportEntries.map(([bid, n]: [string, number]) => (
            <TotalsChip
              key={bid}
              icon={<SupportBlock blockId={bid} size={18} />}
              count={n}
              label={blockLabel(bid)}
            />
          ))}
        </Box>
      </Box>
      <Box>
        <Box component="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 1 }}>
          Raw resources
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <TotalsChip
            icon={<SupportBlock blockId="minecraft:wood_log" size={18} />}
            count={totalBlockCounts?.raw?.logs}
            label={`wood logs (${totalBlockCounts?.raw?.planks?.toLocaleString()} planks)`}
          />
          <TotalsChip
            icon={<MiniDust size={18} />}
            count={totalBlockCounts?.raw?.redstoneDust}
            label={
              totalBlockCounts?.raw?.redstoneBlocks > 0
                ? `redstone dust = ${totalBlockCounts.raw.redstoneBlocks} block${totalBlockCounts.raw.redstoneBlocks !== 1 ? 's' : ''}${totalBlockCounts.raw.redstoneRemainder > 0 ? ` + ${totalBlockCounts.raw.redstoneRemainder}` : ''}`
                : 'redstone dust'
            }
          />
          <TotalsChip
            icon={<SupportBlock blockId="minecraft:stone" size={18} />}
            count={totalBlockCounts?.raw?.stone}
            label="stone"
          />
          {totalBlockCounts?.supportEntries.map(([bid, n]: [string, number]) => (
            <TotalsChip
              key={bid}
              icon={<SupportBlock blockId={bid} size={18} />}
              count={n}
              label={`${blockLabel(bid)} (support)`}
            />
          ))}
        </Box>
      </Box>
      <Box>
        <Box component="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 1 }}>
          Minimum build area
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: 'grey.100',
              fontWeight: 500,
            }}
          >
            <span style={{ color: '#3d5f22', fontWeight: 700 }}>X</span>
            <span>{dimensions.x}</span>
            <span style={{ fontSize: '0.9em', color: '#666' }}>blocks long</span>
          </Box>
          <span style={{ fontWeight: 700, fontSize: '1.2em' }}>×</span>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: 'grey.100',
              fontWeight: 500,
            }}
          >
            <span style={{ color: '#3d5f22', fontWeight: 700 }}>Z</span>
            <span>{dimensions.z}</span>
            <span style={{ fontSize: '0.9em', color: '#666' }}>blocks wide</span>
          </Box>
          <span style={{ fontWeight: 700, fontSize: '1.2em' }}>×</span>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: 'grey.100',
              fontWeight: 500,
            }}
          >
            <span style={{ color: '#3d5f22', fontWeight: 700 }}>Y</span>
            <span>{dimensions.y}</span>
            <span style={{ fontSize: '0.9em', color: '#666' }}>blocks tall</span>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
