import { playPlacementSound } from '@audio/noteblockAudio';
import { blockLabel, getUseCount } from '@components/SchematicPanel/schematicData';
import { TooltipPortal, usePortalTooltip } from '@hooks/usePortalTooltip';
import Box from '@mui/material/Box';
import { NoteCell } from './NoteCell';

/**
 * NoteBlockCell renders a note block cell in the schematic grid, including tooltip and interaction.
 * Handles playing the note sound, selection, and displays instrument/block info.
 *
 * Props:
 * - cell: Cell data (must be kind 'note')
 * - cs: Cell size in pixels
 * - instrument: Instrument label
 * - block: Block type
 * - isLastPressed: Whether this cell is the last pressed/selected
 * - onPress: Callback when the cell is pressed/selected
 */
export function NoteBlockCell({ cell, cs, instrument, block, isLastPressed, onPress }: any) {
  const { ref, pos, show, hide } = usePortalTooltip();
  const note = cell.note;
  const useCount = getUseCount(note.note);
  const noteBlock = note.block ?? block;
  return (
    <Box
      ref={ref}
      tabIndex={0}
      role="button"
      aria-label={`${note.instrument ?? instrument} - ${note.pitch || 'drum'}`}
      sx={{
        width: cs,
        height: cs,
        outline: isLastPressed ? '2px solid #3d5f22' : 'none',
        borderRadius: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isLastPressed ? '0 0 0 2px #ffe066' : undefined,
        background: 'transparent',
        cursor: 'pointer',
        p: 0,
        m: 0,
        '&:focus': {
          outline: '2px solid #3d5f22',
        },
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={() => {
        void playPlacementSound({
          instrument: note.instrument ?? instrument,
          note: note.note,
          pitch: note.pitch,
        });
        onPress?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          void playPlacementSound({
            instrument: note.instrument ?? instrument,
            note: note.note,
            pitch: note.pitch,
          });
          onPress?.();
        }
      }}
    >
      <NoteCell
        block={noteBlock}
        instrument={note.instrument ?? instrument}
        useCount={useCount}
        size={cs}
      />
      {pos && (
        <TooltipPortal pos={pos}>
          {note.instrument ?? instrument}
          <br />
          {note.pitch || 'drum'}
          <br />
          Use count: {useCount}
          <br />
          {blockLabel(noteBlock)}
        </TooltipPortal>
      )}
    </Box>
  );
}
