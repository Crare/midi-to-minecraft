import { DustCell } from "./DustCell";
import { NoteBlockCell } from "./NoteBlockCell";
import { SplitWireCell } from "./SplitWireCell";

// ── Anchor cell ───────────────────────────────────────────────────────────────
export function AnchorCell({
  anchor,
  cell,
  cs,
  instrument,
  block,
  isLastPressed,
  onPress
}) {
  if (!cell || cell.kind === "inactive") {
    return (
      <div
        className="schematic-cell schematic-cell--empty"
        style={{ width: cs, height: cs }}
        aria-hidden="true"
      />
    );
  }
  if (cell.kind === "split-pass") {
    const c = cell.connects ?? {};
    // No connections at all → truly empty cell (instrument not active here).
    if (!c.left && !c.right && !c.up && !c.down) {
      return (
        <div
          className="schematic-cell schematic-cell--empty"
          style={{ width: cs, height: cs }}
          aria-hidden="true"
        />
      );
    }
    return (
      <div className="schematic-cell" aria-hidden="true">
        <SplitWireCell connects={c} size={cs} />
      </div>
    );
  }
  if (cell.kind === "split-branch") {
    const c = cell.connects ?? {
      left: true,
      right: true,
      up: false,
      down: true
    };
    return (
      <div className="schematic-cell" aria-hidden="true">
        <SplitWireCell connects={c} size={cs} />
      </div>
    );
  }
  if (cell.kind === "note") {
    if (!cell.note) {
      // No note at this tick for this instrument — show wire passing through.
      return (
        <div
          className="schematic-cell schematic-cell--passthrough"
          aria-hidden="true"
        >
          <DustCell size={cs} />
        </div>
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
