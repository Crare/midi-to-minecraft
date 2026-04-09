import { playPlacementSound } from '../../audio/noteblockAudio';
import { usePortalTooltip } from '../../hooks/usePortalTooltip';
import { blockColorFor, blockLabel, getUseCount } from './schematicData';
import { TooltipPortal } from './SchematicGrid';

export const CELL = 28;

export function NoteCell({
  block,
  instrument,
  useCount,
  size,
}: {
  block: any;
  instrument: string;
  useCount?: number;
  size?: number;
}) {
  const s = size ?? CELL;
  const col = blockColorFor(block);
  const label = useCount != null ? String(useCount) : '';
  const textFill = '#000000aa';
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label={`${instrument} on ${blockLabel(block)}`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill={col} />
      {label !== '' && (
        <text
          x="14"
          y="19"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
          fill={textFill}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

export function RepeaterCell({ ticks, size }: { ticks: number; size?: number }) {
  const s = size ?? CELL;
  const outX = 6 + (ticks - 1) * 4;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label={`Repeater ${ticks}t`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#b9b3a8" />
      <rect x="2" y="2" width="24" height="24" fill="#ddd7ca" />
      <rect x="2" y="11" width="24" height="6" fill="#b94141" />
      <rect x="18" y="5" width="4" height="4" fill="#d63737" />
      <rect x={outX} y="19" width="4" height="4" fill="#d63737" />
      <text
        x="14"
        y="10"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="13"
        fontWeight="bold"
        fill="#222"
        fontFamily="monospace"
      >
        {ticks}
      </text>
    </svg>
  );
}

export function DustCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#888" opacity="0.15" />
      <rect x="0" y="11" width="28" height="6" fill="#c0392b" />
    </svg>
  );
}

export function BranchTapCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label="Branch tap point"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#e67e22" opacity="0.2" />
      <rect x="0" y="11" width="28" height="6" fill="#e67e22" />
      <rect x="11" y="14" width="6" height="14" fill="#e67e22" />
    </svg>
  );
}

export function PhantomRepeaterCell({ ticks, size }: { ticks: number; size?: number }) {
  const s = size ?? CELL;
  const outX = 6 + (ticks - 1) * 4;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label={`Shared path ${ticks}t`}
      style={{ display: 'block', flexShrink: 0, opacity: 0.25 }}
    >
      <rect width="28" height="28" fill="#b9b3a8" />
      <rect x="2" y="2" width="24" height="24" fill="#ddd7ca" />
      <rect x="2" y="11" width="24" height="6" fill="#b94141" />
      <rect x="18" y="5" width="4" height="4" fill="#d63737" />
      <rect x={outX} y="19" width="4" height="4" fill="#d63737" />
      <text x="26" y="10" textAnchor="end" fontSize="5" fill="#333" fontFamily="monospace">
        {ticks}t
      </text>
    </svg>
  );
}

export function BranchStartCell({
  sourceId,
  savedTicks,
  size,
}: {
  sourceId: string;
  savedTicks: number;
  size?: number;
}) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-label={`Branch from ${sourceId}, saves ${savedTicks} ticks`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#e67e22" opacity="0.2" />
      <rect x="0" y="11" width="28" height="6" fill="#e67e22" />
      <rect x="11" y="0" width="6" height="14" fill="#e67e22" />
      <text x="27" y="10" textAnchor="end" fontSize="5" fill="#7f3e00" fontFamily="monospace">
        5{savedTicks}
      </text>
    </svg>
  );
}

export function SplitWireCell({
  connects = {},
  size,
}: {
  connects?: { left?: boolean; right?: boolean; up?: boolean; down?: boolean };
  size?: number;
}) {
  const s = size ?? CELL;
  const { left, right, up, down } = connects;
  const col = '#c0392b';
  const any = left || right || up || down;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill={col} opacity="0.1" />
      {left && <rect x="0" y="11" width="14" height="6" fill={col} />}
      {right && <rect x="14" y="11" width="14" height="6" fill={col} />}
      {up && <rect x="11" y="0" width="6" height="14" fill={col} />}
      {down && <rect x="11" y="14" width="6" height="14" fill={col} />}
      {any && <rect x="11" y="11" width="6" height="6" fill={col} />}
    </svg>
  );
}

export function SplitPassCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#c0392b" opacity="0.1" />
      <rect x="11" y="0" width="6" height="28" fill="#c0392b" />
    </svg>
  );
}

export function SplitBranchCell({ size }: { size?: number }) {
  const s = size ?? CELL;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 28 28"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="28" height="28" fill="#c0392b" opacity="0.1" />
      <rect x="11" y="0" width="6" height="28" fill="#c0392b" />
      <rect x="14" y="11" width="14" height="6" fill="#c0392b" />
    </svg>
  );
}

const MINI = 18;

export function MiniNoteBlock({ block, size = MINI }: { block: any; size?: number }) {
  const col = blockColorFor(block || 'minecraft:dirt');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      <rect width="18" height="18" fill={col} />
      <rect x="1" y="1" width="16" height="16" fill="#7d5221" />
      <rect x="2" y="2" width="14" height="5" fill="#9b6b2e" />
      <rect x="3" y="9" width="3" height="3" fill="#5a3a10" />
      <rect x="9" y="9" width="3" height="3" fill="#5a3a10" />
      <rect x="6" y="13" width="3" height="3" fill="#5a3a10" />
    </svg>
  );
}

export function MiniRepeater({ size = MINI }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      <rect width="18" height="18" fill="#ddd7ca" />
      <rect x="1" y="7" width="16" height="4" fill="#b94141" />
      <rect x="11" y="3" width="4" height="4" fill="#d63737" />
      <rect x="3" y="11" width="4" height="4" fill="#d63737" />
    </svg>
  );
}

export function MiniDust({ size = MINI }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      <rect width="18" height="18" fill="rgba(0,0,0,0.08)" />
      <rect x="0" y="6" width="18" height="6" fill="#c0392b" />
    </svg>
  );
}

export function MiniBlock({ color, size = MINI }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      <rect width="18" height="18" fill={color} />
      <rect x="1" y="1" width="16" height="6" fill="rgba(255,255,255,0.22)" />
      <rect x="0" y="15" width="18" height="3" fill="rgba(0,0,0,0.2)" />
    </svg>
  );
}

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

export function NoteBlockCell({ cell, cs, instrument, block, isLastPressed, onPress }: any) {
  const { ref, pos, show, hide } = usePortalTooltip();
  const note = cell.note;
  const useCount = getUseCount(note.note);
  const noteBlock = note.block ?? block;
  return (
    <div
      ref={ref}
      className={`schematic-cell schematic-cell-tip${isLastPressed ? ' schematic-cell--last-pressed' : ''}`}
      tabIndex={0}
      role="button"
      aria-label={`${note.instrument ?? instrument} - ${note.pitch || 'drum'}`}
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
    </div>
  );
}

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
