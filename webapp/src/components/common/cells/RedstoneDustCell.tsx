import { CELL } from '@constants';
import Box from '@mui/material/Box';

const dustCellSvg = `${import.meta.env.BASE_URL}assets/icons/dust-cell.svg`;
/**
 * RedstoneDustCell renders a single redstone dust cell as an image in the schematic grid.
 * Used for passthrough and wiring cells. Purely visual, not interactive.
 *
 * Props:
 * - size: Cell size in pixels (optional)
 */

export function RedstoneDustCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <Box
      component="img"
      src={dustCellSvg}
      alt="Dust cell"
      draggable={false}
      aria-hidden="true"
      sx={{ display: 'block', flexShrink: 0, width: s, height: s }}
    />
  );
}

// Alias for compatibility with tests and legacy imports
export const DustCell = RedstoneDustCell;
