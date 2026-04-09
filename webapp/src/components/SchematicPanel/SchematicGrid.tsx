import { Fragment, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
// import type { ListChildComponentProps } from 'react-window';
// import { List } from 'react-window';
import { AnchorCell, CELL, DustCell, SegRepCell } from './SchematicCells';
import { blockLabel } from './schematicData';

// Portal tooltip hook

export function TooltipPortal({
  pos,
  children,
}: {
  pos: { x: number; y: number; below: boolean };
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      className={`cell-tooltip-portal${pos.below ? ' cell-tooltip-portal-below' : ''}`}
      style={{
        left: `${pos.x}px`,
        top: pos.below ? `${pos.y + 8}px` : `${pos.y - 8}px`,
      }}
      role="tooltip"
    >
      {children}
    </div>,
    document.body,
  );
}

interface SchematicGridProps {
  grid: any;
  cellSize?: number;
  onColumnClick?: (el: HTMLElement) => void;
  onRowClick?: (el: HTMLElement) => void;
}

export default function SchematicGrid({
  grid,
  cellSize,
  onColumnClick,
  onRowClick,
}: SchematicGridProps) {
  const cs = cellSize ?? CELL;
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  if (!grid || !Array.isArray(grid.instruments) || grid.instruments.length === 0) return null;

  const { instruments, anchors } = grid;
  const totalCols = 1 + anchors.length * 2;

  const virtualRows = useMemo(() => {
    if (!Array.isArray(instruments)) return [];
    const rows: any[] = [];
    instruments.forEach((inst: any) => {
      rows.push({ type: 'label', inst });
      if (Array.isArray(inst.rows)) {
        inst.rows.forEach((row: any) => {
          rows.push({ type: 'data', inst, row });
        });
      }
    });
    return rows;
  }, [instruments]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = virtualRows[index];
    if (item.type === 'label') {
      return (
        <tr key={index} style={style} className="schematic-instrument-label-row">
          <td colSpan={totalCols} className="schematic-instrument-label-cell">
            {item.inst.label} — {blockLabel(item.inst.block)}
          </td>
        </tr>
      );
    }
    const { inst, row } = item;
    return (
      <tr style={style} key={row.id}>
        <td className="schematic-td-connector" style={{ width: cs }}>
          <button
            type="button"
            className="schematic-connector schematic-connector--sticky"
            style={{ width: cs, height: cs }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRowClick?.(e.currentTarget);
            }}
            aria-label="Move row marker here"
          >
            <DustCell size={cs} />
          </button>
        </td>
        {anchors.map((anchor: any, ai: number) => {
          const seg = row.segments[ai] ?? [];
          return (
            <Fragment key={ai}>
              <td className="schematic-td-seg">
                <div className="schematic-segment">
                  {seg.map((cell: any, ri: number) =>
                    cell.kind === 'dust' ? (
                      <DustCell key={ri} size={cs} />
                    ) : (
                      <SegRepCell key={ri} cell={cell} cs={cs} />
                    ),
                  )}
                </div>
              </td>
              <td className="schematic-td-anchor" style={{ width: cs }}>
                <AnchorCell
                  anchor={anchor}
                  cell={row.anchorCells[ai]}
                  cs={cs}
                  instrument={inst.label}
                  block={inst.block}
                  isLastPressed={lastPressed === `${row.id}:${ai}`}
                  onPress={() => setLastPressed(`${row.id}:${ai}`)}
                />
              </td>
            </Fragment>
          );
        })}
      </tr>
    );
  };

  const rowHeight = cs + 8;

  // Non-virtualized fallback: render all rows directly
  function VirtualizedRows({
    virtualRows,
    rowHeight,
    Row,
  }: {
    virtualRows: any[];
    rowHeight: number;
    Row: (props: { index: number; style: React.CSSProperties }) => JSX.Element;
  }) {
    if (!Array.isArray(virtualRows) || virtualRows.length === 0) return null;
    return <>{virtualRows.map((_, idx) => Row({ index: idx, style: { height: rowHeight } }))}</>;
  }

  return (
    <div style={{ overflow: 'auto', maxHeight: '70vh' }}>
      <table className="schematic-table">
        <thead>
          <tr>
            <th className="schematic-th-corner" style={{ width: cs, minWidth: cs }} />
            {anchors.map((anchor: any, ai: number) => (
              <Fragment key={ai}>
                <th className="schematic-th-seg" />
                <th className="schematic-th-anchor" style={{ width: cs, minWidth: cs }}>
                  {anchor.kind === 'note' && (
                    <button
                      type="button"
                      className="schematic-tick-btn"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onColumnClick?.(e.currentTarget);
                      }}
                      aria-label={`Tick ${anchor.tick} — click to move column marker`}
                    >
                      {anchor.tick}
                    </button>
                  )}
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
      </table>
      <div style={{ overflow: 'auto' }}>
        <table className="schematic-table">
          <tbody>
            <VirtualizedRows virtualRows={virtualRows} rowHeight={rowHeight} Row={Row} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
