import { MiniDust, MiniNoteBlock, MiniRepeater, SupportBlock } from './SchematicCells';
import { blockLabel } from './schematicData';
import TotalsChip from './TotalsChip';

interface BlocksNeededSummaryProps {
  grid: any;
  totalBlockCounts: any;
  dimensions: { x: number; y: number; z: number };
}

export default function BlocksNeededSummary({
  grid,
  totalBlockCounts,
  dimensions,
}: BlocksNeededSummaryProps) {
  if (!grid || !Array.isArray(grid.instruments) || grid.instruments.length === 0) return null;
  const { noteblocks, repeaters, dust, raw, supportMap } = totalBlockCounts;
  const supportEntries = [...(supportMap?.entries?.() ?? [])];
  return (
    <>
      <div className="schematic-totals">
        <div className="schematic-totals-section">
          <h3 className="schematic-totals-heading">Blocks needed</h3>
          <div className="schematic-totals-chips">
            <TotalsChip
              icon={<MiniNoteBlock block="minecraft:dirt" size={18} />}
              count={noteblocks}
              label="note blocks"
            />
            <TotalsChip icon={<MiniRepeater size={18} />} count={repeaters} label="repeaters" />
            <TotalsChip icon={<MiniDust size={18} />} count={dust} label="redstone dust" />
            {supportEntries.map(([bid, n]: [string, number]) => (
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
              icon={<SupportBlock blockId="minecraft:acacia_log" size={18} />}
              count={raw?.logs}
              label={`logs (${raw?.planks?.toLocaleString()} planks)`}
            />
            <TotalsChip
              icon={<MiniDust size={18} />}
              count={raw?.redstoneDust}
              label={
                raw?.redstoneBlocks > 0
                  ? `redstone dust = ${raw.redstoneBlocks} block${raw.redstoneBlocks !== 1 ? 's' : ''}${raw.redstoneRemainder > 0 ? ` + ${raw.redstoneRemainder}` : ''}`
                  : 'redstone dust'
              }
            />
            <TotalsChip
              icon={<SupportBlock blockId="minecraft:stone" size={18} />}
              count={raw?.stone}
              label="stone"
            />
            {supportEntries.map(([bid, n]: [string, number]) => (
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
