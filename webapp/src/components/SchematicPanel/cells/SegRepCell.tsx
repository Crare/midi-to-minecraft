import { usePortalTooltip } from '../../../hooks/usePortalTooltip';
import { TooltipPortal } from '../SchematicGrid';
import { RepeaterCell } from './RepeaterCell';

/**
 * SegRepCell renders a repeater cell within a schematic segment, including a tooltip showing the tick delay.
 * It wraps a RepeaterCell and provides accessible hover/focus tooltips for the delay value.
 *
 * Props:
 * - cell: Cell data (must have .ticks property)
 * - cs: Cell size in pixels
 */
export function SegRepCell({ cell, cs }: { cell: any; cs: number }) {
  const { ref, pos, show, hide } = usePortalTooltip();
  return (
    <div
      ref={ref}
      className="schematic-cell schematic-cell-tip"
      tabIndex={0}
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
    </div>
  );
}
