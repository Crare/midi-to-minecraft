import { TooltipPortal, usePortalTooltip } from "../PortalTooltip";
import { RepeaterCell } from "./RepeaterCell";

// ── Segment repeater cell with portal tooltip ─────────────────────────────────
export function SegRepCell({ cell, cs }) {
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
          Repeater: {cell.ticks} tick{cell.ticks !== 1 ? "s" : ""}
        </TooltipPortal>
      )}
    </div>
  );
}
