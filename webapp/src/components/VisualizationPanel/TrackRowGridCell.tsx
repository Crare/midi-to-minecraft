import { playPlacementSound } from '@audio/noteblockAudio';
import { NoteblockIcon } from '@components/common/blocks/NoteblockIcon';
import { SupportBlock } from '@components/common/blocks/SupportBlock';
import { noteColorByStep, notePitchNames } from '@constants';
import Box from '@mui/material/Box';
import { CellComponentProps } from 'react-window';
import { Fragment } from 'react/jsx-runtime';

function supportSpriteForBlock(blockId: string) {
  const blockName = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  // Use static SVGs for each block type, fallback to dirt
  return `${import.meta.env.BASE_URL}assets/icons/support-block-${blockName}.svg`;
}
function getMinecraftTuningInfo(useCount: number) {
  const normalizedUseCount = ((useCount % 24) + 24) % 24;
  const noteStep = normalizedUseCount % 12;
  return {
    useCount: normalizedUseCount,
    pitchName: notePitchNames[noteStep],
    playsoundPitch: 2 ** ((normalizedUseCount - 12) / 12),
    color: noteColorByStep[noteStep],
  };
}
function getNoteblockTooltip(placement: any) {
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

const GRID_BLOCK_SIZE = 32;

// Cell renderer for react-window Grid
export function TrackRowGridCell({
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
  if (!cellProps) return <Box style={style} />;
  const { tracks, mutedTracks, showColor, showNumber, showSupport, trackUnitSize } = cellProps;
  if (!tracks || !mutedTracks) return <Box style={style} />;
  const track = tracks[rowIndex];
  if (!track || !track.id || !Array.isArray(track.notes)) return null;
  if (mutedTracks.has(track.id)) return null;
  const note = track.notes[columnIndex];
  if (!note) return <Box style={style} />;
  return (
    <Box style={style}>
      <Box
        sx={{
          mt: 1,
          mb: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {note.placements.map((placement: any, pi: number) => {
          const tuningInfo = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
          const tooltipLines = getNoteblockTooltip(placement).split('\n');
          return (
            <Box
              key={pi}
              tabIndex={0}
              role="button"
              aria-label={getNoteblockTooltip(placement).replace(/\n/g, ', ')}
              sx={{
                width: trackUnitSize - 6,
                height: trackUnitSize - 10,
                minWidth: 16,
                minHeight: 16,
                mx: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                outline: 'none',
                cursor: 'pointer',
                '&:focus': {
                  outline: '2px solid #3d5f22',
                },
              }}
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
            >
              {showColor && tuningInfo ? (
                <Box
                  sx={{
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
                <Box
                  aria-hidden="true"
                  sx={{ position: 'absolute', top: 2, right: 2, fontSize: 10 }}
                >
                  {tuningInfo.useCount}
                </Box>
              ) : null}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <NoteblockIcon size={GRID_BLOCK_SIZE} />
                {showSupport ? (
                  <SupportBlock
                    blockId={placement.block}
                    size={GRID_BLOCK_SIZE}
                    style={{ marginTop: GRID_BLOCK_SIZE }}
                    alt={placement.block}
                  />
                ) : null}
              </Box>
              <Box
                component="span"
                role="tooltip"
                sx={{
                  display: 'none',
                  position: 'absolute',
                  zIndex: 10,
                  background: '#222',
                  color: '#fff',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
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
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default TrackRowGridCell;
