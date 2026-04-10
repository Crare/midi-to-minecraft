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
  if (!grid || !Array.isArray(grid.instruments) || grid.instruments.length === 0) return null;

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
    <>
      <div className="schematic-totals">
        <div className="schematic-totals-section">
          <h3 className="schematic-totals-heading">Blocks needed</h3>
          <div className="schematic-totals-chips">
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
          </div>
        </div>
        <div className="schematic-totals-section">
          <h3 className="schematic-totals-heading">Raw resources</h3>
          <div className="schematic-totals-chips">
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
          </div>
        </div>
        <div className="schematic-totals-section">
          <h3 className="schematic-totals-heading">Minimum build area</h3>
          <div className="schematic-dimensions">
            <span className="schematic-dim-chip">
              <span className="schematic-dim-axis">X</span>
              <span className="schematic-dim-value">{dimensions.x}</span>
              <span className="schematic-dim-unit">blocks long</span>
            </span>
            <span className="schematic-dim-sep">×</span>
            <span className="schematic-dim-chip">
              <span className="schematic-dim-axis">Z</span>
              <span className="schematic-dim-value">{dimensions.z}</span>
              <span className="schematic-dim-unit">blocks wide</span>
            </span>
            <span className="schematic-dim-sep">×</span>
            <span className="schematic-dim-chip">
              <span className="schematic-dim-axis">Y</span>
              <span className="schematic-dim-value">{dimensions.y}</span>
              <span className="schematic-dim-unit">blocks tall</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
