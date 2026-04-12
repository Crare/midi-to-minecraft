import { TooltipPortal, usePortalTooltip } from '@hooks/usePortalTooltip';
import Box from '@mui/material/Box';
import { RepeaterCell } from './RepeaterCell';

/**
 * SegmentRepeaterCell renders a repeater cell within a schematic segment, including a tooltip showing the tick delay.
 * It wraps a RepeaterCell and provides accessible hover/focus tooltips for the delay value.
 *
 * Props:
 * - cell: Cell data (must have .ticks property)
 * - cs: Cell size in pixels
 */
export function SegmentRepeaterCell({ cell, cs }: { cell: any; cs: number }) {
  const { ref, pos, show, hide } = usePortalTooltip();
  return (
    <Box
      ref={ref}
      tabIndex={0}
      sx={{
        width: cs,
        height: cs,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        cursor: 'pointer',
        p: 0,
        m: 0,
        '&:focus': {
          outline: '2px solid #3d5f22',
        },
      }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <RepeaterCell ticks={cell.ticks} size={cs} />
      {pos && (
        <TooltipPortal pos={pos}>
          Repeater: {cell.ticks} tick{cell.ticks !== 1 ? 's' : ''}
        </TooltipPortal>
      )}
    </Box>
  );
}
