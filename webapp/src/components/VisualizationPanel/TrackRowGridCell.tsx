import { playPlacementSound } from '@audio/noteblockAudio';
import { SupportBlock } from '@components/common/SupportBlock';
import { noteColorByStep, notePitchNames } from '@constants';
import { CellComponentProps } from 'react-window';
import { Fragment } from 'react/jsx-runtime';

function supportSpriteForBlock(blockId) {
  const blockName = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  // Use static SVGs for each block type, fallback to dirt
  return `${import.meta.env.BASE_URL}assets/icons/support-block-${blockName}.svg`;
}
function getMinecraftTuningInfo(useCount) {
  const normalizedUseCount = ((useCount % 24) + 24) % 24;
  const noteStep = normalizedUseCount % 12;
  return {
    useCount: normalizedUseCount,
    pitchName: notePitchNames[noteStep],
    playsoundPitch: 2 ** ((normalizedUseCount - 12) / 12),
    color: noteColorByStep[noteStep],
  };
}
function getNoteblockTooltip(placement) {
  const tuningInfo = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
  return [
    `Instrument: ${placement.instrument}`,
    `Pitch: ${placement.pitch || 'drum'}`,
    `Note: ${placement.note}`,
    tuningInfo ? `Use count: ${tuningInfo.useCount}` : null,
    tuningInfo ? `Minecraft pitch: ${tuningInfo.pitchName}` : null,
    tuningInfo ? `Playsound pitch: ${tuningInfo.playsoundPitch.toFixed(6)}` : null,
    tuningInfo ? `Color: ${tuningInfo.color}` : null,
    `Block: ${placement.block}`,
  ]
    .filter(Boolean)
    .join('\n');
}
const noteblockImg = `${import.meta.env.BASE_URL}assets/icons/noteblock.svg`;

const GRID_BLOCK_SIZE = 32;

// Cell renderer for react-window Grid
export default function TrackRowGridCell({
  columnIndex,
  rowIndex,
  style,
  cellProps,
}: CellComponentProps<{
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  cellProps: any;
}>) {
  // console.log('here0', 'rowIndex:', rowIndex, 'columnIndex:', columnIndex, 'cellProps:', cellProps);
  if (!cellProps) return <div style={style} />;
  const { tracks, mutedTracks, showColor, showNumber, showSupport, trackUnitSize } = cellProps;
  if (!tracks || !mutedTracks) return <div style={style} />;
  const track = tracks[rowIndex];
  if (!track || !track.id || !Array.isArray(track.notes)) return null;
  if (mutedTracks.has(track.id)) return null;
  const note = track.notes[columnIndex];
  if (!note) return <div style={style} />;
  return (
    <div style={style}>
      <div className="note-unit" style={{ marginTop: 8, marginBottom: 8 }}>
        {note.placements.map((placement: any, pi: number) => {
          const tuningInfo = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
          const tooltipLines = getNoteblockTooltip(placement).split('\n');
          return (
            <div
              key={pi}
              className="note-stack-item note-unit-button"
              role="button"
              tabIndex={0}
              aria-label={getNoteblockTooltip(placement).replace(/\n/g, ', ')}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                void playPlacementSound(placement);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void playPlacementSound(placement);
                }
              }}
              style={{
                width: trackUnitSize - 6,
                height: trackUnitSize - 10,
                minWidth: 16,
                minHeight: 16,
                margin: '0 1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {showColor && tuningInfo ? (
                <span
                  className="note-corner-color"
                  style={{
                    backgroundColor: tuningInfo.color,
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                  }}
                  aria-hidden="true"
                />
              ) : null}
              {showNumber && tuningInfo ? (
                <span
                  className="note-use-count"
                  aria-hidden="true"
                  style={{ position: 'absolute', top: 2, right: 2, fontSize: 10 }}
                >
                  {tuningInfo.useCount}
                </span>
              ) : null}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  className="note-img"
                  src={noteblockImg}
                  alt="noteblock"
                  style={{ width: GRID_BLOCK_SIZE, height: GRID_BLOCK_SIZE, marginBottom: 0 }}
                />
                {showSupport ? (
                  <SupportBlock
                    blockId={placement.block}
                    size={GRID_BLOCK_SIZE}
                    className="support-img"
                    style={{ marginTop: GRID_BLOCK_SIZE }}
                    alt={placement.block}
                  />
                ) : null}
              </div>
              <span
                className="cell-tooltip"
                role="tooltip"
                style={{
                  display: 'none',
                  position: 'absolute',
                  zIndex: 10,
                  background: '#222',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                  left: '100%',
                  top: 0,
                }}
              >
                {tooltipLines.map((line: string, lineIndex: number) => (
                  <Fragment key={`${columnIndex}-${pi}-tooltip-${lineIndex}`}>
                    {lineIndex > 0 ? <br /> : null}
                    {line}
                  </Fragment>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// export default memo(TrackRowGridCell);
