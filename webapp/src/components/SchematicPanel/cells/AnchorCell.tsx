import { DustCell } from './DustCell';
import { NoteBlockCell } from './NoteBlockCell';
import { SplitWireCell } from './SplitWireCell';

export function AnchorCell({ anchor, cell, cs, instrument, block, isLastPressed, onPress }: any) {
  if (!cell || cell.kind === 'inactive') {
    return (
      <div
        className="schematic-cell schematic-cell--empty"
        style={{ width: cs, height: cs }}
        aria-hidden="true"
      />
    );
  }
  if (cell.kind === 'split-pass') {
    const c = cell.connects ?? {};
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
  if (cell.kind === 'split-branch') {
    const c = cell.connects ?? {
      left: true,
      right: true,
      up: false,
      down: true,
    };
    return (
      <div className="schematic-cell" aria-hidden="true">
        <SplitWireCell connects={c} size={cs} />
      </div>
    );
  }
  if (cell.kind === 'note') {
    if (!cell.note) {
      return (
        <div className="schematic-cell schematic-cell--passthrough" aria-hidden="true">
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
