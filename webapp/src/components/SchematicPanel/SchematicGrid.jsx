import { Fragment, useState } from "react";
import { CELL } from "./../../constants";
import {
  AnchorCell,
  DustCell,
  SegRepCell
} from "./components/cells/SchematicCells";
import { blockLabel } from "./schematicData";

// ── Main grid component ───────────────────────────────────────────────────────
// All instruments share ONE <table> so every tick column aligns across instruments.
// The <thead> shows absolute tick numbers. Instrument groups are separated by
// label rows that span all columns. Segments are padded with dust so all note
// columns land at the same x position.
export default function SchematicGrid({
  grid,
  cellSize,
  onColumnClick,
  onRowClick
}) {
  const cs = cellSize ?? CELL;
  const [lastPressed, setLastPressed] = useState(null);
  if (!grid || grid.instruments.length === 0) return null;

  const { instruments, anchors } = grid;
  const totalCols = 1 + anchors.length * 2; // connector + (seg + anchor) × N

  return (
    <table className="schematic-table">
      <thead>
        <tr>
          <th
            className="schematic-th-corner"
            style={{ width: cs, minWidth: cs }}
          />
          {anchors.map((anchor, ai) => (
            <Fragment key={ai}>
              <th className="schematic-th-seg" />
              <th
                className="schematic-th-anchor"
                style={{ width: cs, minWidth: cs }}
              >
                {anchor.kind === "note" && (
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
      <tbody>
        {instruments.map((inst) => (
          <Fragment key={inst.id}>
            {/* Instrument label row — spans all columns */}
            <tr className="schematic-instrument-label-row">
              <td
                colSpan={totalCols}
                className="schematic-instrument-label-cell"
              >
                {inst.label} — {blockLabel(inst.block)}
              </td>
            </tr>

            {/* Data rows */}
            {inst.rows.map((row) => (
              <tr key={row.id}>
                {/* Connector dust — sticky first column */}
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

                {anchors.map((anchor, ai) => {
                  const seg = row.segments[ai] ?? [];
                  return (
                    <Fragment key={ai}>
                      {/* Segment cell — repeaters + dust padding */}
                      <td className="schematic-td-seg">
                        <div className="schematic-segment">
                          {seg.map((cell, ri) =>
                            cell.kind === "dust" ? (
                              <DustCell key={ri} size={cs} />
                            ) : (
                              <SegRepCell key={ri} cell={cell} cs={cs} />
                            )
                          )}
                        </div>
                      </td>
                      {/* Anchor cell — note block or pass-through */}
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
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
