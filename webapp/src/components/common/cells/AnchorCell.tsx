import Box from '@mui/material/Box';
import { NoteBlockCell } from './NoteBlockCell';
import { RedstoneDustCell } from './RedstoneDustCell';
import { SplitWireCell } from './SplitWireCell';
/**
 * AnchorCell is a schematic grid cell component responsible for rendering the main cell types
 * that appear at anchor positions in the schematic grid. These include note blocks, split wires,
 * passthrough dust, and empty cells. It determines the correct cell type to render based on the
 * cell's kind and props, and handles visual state for selection and interaction.
 *
 * Props:
 * - anchor: Anchor metadata for the column
 * - cell: Cell data (kind, note, connects, etc.)
 * - cs: Cell size in pixels
 * - instrument: Instrument label for the cell (if note)
 * - block: Block type for the cell (if note)
 * - isLastPressed: Whether this cell is the last pressed/selected
 * - onPress: Callback when the cell is pressed/selected
 */
export function AnchorCell({ anchor, cell, cs, instrument, block, isLastPressed, onPress }: any) {
  if (!cell || cell.kind === 'inactive') {
    return (
      <Box
        sx={{ width: cs, height: cs, background: 'transparent', display: 'inline-block' }}
        aria-hidden="true"
      />
    );
  }
  if (cell.kind === 'split-pass') {
    const c = cell.connects ?? {};
    if (!c.left && !c.right && !c.up && !c.down) {
      return (
        <Box
          sx={{ width: cs, height: cs, background: 'transparent', display: 'inline-block' }}
          aria-hidden="true"
        />
      );
    }
    return (
      <Box
        sx={{
          width: cs,
          height: cs,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <SplitWireCell connects={c} size={cs} />
      </Box>
    );
  }
  if (cell.kind === 'split-branch') {
    const c = cell.connects ?? {
      left: true,
      right: true,
      up: false,
      down: true,
    };
    return (
      <Box
        sx={{
          width: cs,
          height: cs,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <SplitWireCell connects={c} size={cs} />
      </Box>
    );
  }
  if (cell.kind === 'note') {
    if (!cell.note) {
      return (
        <Box
          sx={{
            width: cs,
            height: cs,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <RedstoneDustCell size={cs} />
        </Box>
      );
    }
    return (
      <NoteBlockCell
        cell={cell}
        cs={cs}
        instrument={instrument}
        block={block}
        isLastPressed={isLastPressed}
        onPress={onPress}
      />
    );
  }
  return null;
}
