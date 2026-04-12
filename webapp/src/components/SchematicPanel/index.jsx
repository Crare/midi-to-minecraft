import { useEffect, useMemo, useRef, useState } from "react";
import CollapsiblePanel from "../CollapsiblePanel";
import DragScrollArea from "../DragScrollArea";
import {
  MiniBlock,
  MiniDust,
  MiniNoteBlock,
  MiniRepeater
} from "./components/blocks/MiniBlocks";
import { TotalsChip } from "./components/TotalsChip";
import {
  blockColor,
  blockColorFor,
  blockLabel,
  buildTickGrid,
  computeRawResources,
  computeSchematicDimensions,
  computeTickGridBlockCounts
} from "./schematicData";
import SchematicGrid from "./SchematicGrid";

export default function SchematicPanel({ trackEvents }) {
  const [open, setOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [cellSize, setCellSize] = useState(28);
  const [indicatorX, setIndicatorX] = useState(15);
  const [indicatorY, setIndicatorY] = useState(30);

  const contentRef = useRef(null);
  const indicatorDragRef = useRef({
    active: false,
    startClientX: 0,
    startX: 0
  });
  const hIndicatorDragRef = useRef({
    active: false,
    startClientY: 0,
    startY: 0
  });

  const grid = useMemo(() => buildTickGrid(trackEvents), [trackEvents]);
  const totalNotes = useMemo(
    () =>
      grid.instruments.reduce(
        (s, inst) =>
          s +
          inst.rows.reduce(
            (rs, row) =>
              rs +
              row.anchorCells.filter((c) => c.kind === "note" && c.note).length,
            0
          ),
        0
      ),
    [grid]
  );
  const totalRows = useMemo(
    () => grid.instruments.reduce((s, inst) => s + inst.rows.length, 0),
    [grid]
  );

  const totalBlockCounts = useMemo(() => {
    const c = computeTickGridBlockCounts(grid);
    const raw = computeRawResources(c);
    return { ...c, raw };
  }, [grid]);

  const dimensions = useMemo(() => computeSchematicDimensions(grid), [grid]);
  const hasData = trackEvents.length > 0;

  useEffect(() => {
    if (hasData) setOpen(true);
  }, [hasData]);

  function onIndicatorPointerDown(e) {
    e.preventDefault();
    e.stopPropagation();
    indicatorDragRef.current = {
      active: true,
      startClientX: e.clientX,
      startX: indicatorX
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onIndicatorPointerMove(e) {
    if (!indicatorDragRef.current.active) return;
    const delta = e.clientX - indicatorDragRef.current.startClientX;
    const maxX = contentRef.current ? contentRef.current.scrollWidth : 999999;
    setIndicatorX(
      Math.max(0, Math.min(indicatorDragRef.current.startX + delta, maxX))
    );
  }

  function onIndicatorPointerUp() {
    indicatorDragRef.current.active = false;
  }

  function onHIndicatorPointerDown(e) {
    e.preventDefault();
    e.stopPropagation();
    hIndicatorDragRef.current = {
      active: true,
      startClientY: e.clientY,
      startY: indicatorY
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onHIndicatorPointerMove(e) {
    if (!hIndicatorDragRef.current.active) return;
    const delta = e.clientY - hIndicatorDragRef.current.startClientY;
    const maxY = contentRef.current ? contentRef.current.offsetHeight : 999999;
    setIndicatorY(
      Math.max(0, Math.min(hIndicatorDragRef.current.startY + delta, maxY))
    );
  }

  function onHIndicatorPointerUp() {
    hIndicatorDragRef.current.active = false;
  }

  function onColumnClick(el) {
    const content = contentRef.current;
    if (!content) return;
    const x =
      el.getBoundingClientRect().left -
      content.getBoundingClientRect().left +
      el.offsetWidth / 2;
    setIndicatorX(Math.max(0, x));
  }

  function onRowClick(el) {
    const content = contentRef.current;
    if (!content) return;
    const y =
      el.getBoundingClientRect().top -
      content.getBoundingClientRect().top +
      el.offsetHeight / 2;
    setIndicatorY(Math.max(0, y));
  }

  return (
    <CollapsiblePanel
      title="4) Build Schematic (Top-Down)"
      meta={
        !hasData
          ? "No tracks yet"
          : open
            ? "Hide"
            : `Show ${totalRows} lane(s), ${totalNotes} note(s)`
      }
      open={open}
      onOpenChange={(v) => {
        if (hasData) setOpen(v);
      }}
      disabled={!hasData}
      className="schematic-panel"
    >
      <div className="schematic-controls">
        <label className="option-row option-row-stacked">
          <span>Cell size</span>
          <select
            value={cellSize}
            onChange={(e) => setCellSize(Number(e.target.value))}
          >
            <option value={20}>Small (20px)</option>
            <option value={28}>Medium (28px)</option>
            <option value={36}>Large (36px)</option>
            <option value={48}>XL (48px)</option>
          </select>
        </label>
      </div>

      <p className="hint output-summary">
        Top-down schematic. Background color = instrument block. Each repeater
        shows its individual delay setting (1–4 t). Tracks starting later
        include leading repeaters. Harmonics are connected by a vertical
        redstone rail on the left. An orange T-junction cell marks where a lane
        branches off another lane to save repeaters. Drag the gold vertical
        marker to track column progress; drag the blue horizontal marker to
        track row progress. Click any note block to highlight it as your
        last-placed position.
      </p>

      {/* Tutorial */}
      <div className="schematic-tutorial">
        <button
          type="button"
          className="schematic-tutorial-toggle"
          onClick={() => setTutorialOpen((o) => !o)}
          aria-expanded={tutorialOpen}
        >
          <span className="schematic-tutorial-toggle-label">
            How to wire it in Minecraft
          </span>
          <span className="schematic-tutorial-toggle-arrow">
            {tutorialOpen ? "▲" : "▼"}
          </span>
        </button>
        {tutorialOpen && (
          <div className="schematic-tutorial-body">
            <p className="schematic-tutorial-note">
              <strong>Note:</strong> The schematic is not an exact
              representation of how the redstone needs to be wired. It shows
              only the timeline and repeater delays. Wiring multiple note blocks
              to play at the same time requires more redstone, as shown in the
              example pictures below.
            </p>
            <div className="schematic-tutorial-images">
              <figure className="schematic-tutorial-figure">
                <img
                  src={`${import.meta.env.BASE_URL}assets/example_schematic.png`}
                  alt="Example schematic view"
                />
                <figcaption>Schematic view (top-down)</figcaption>
              </figure>
              <figure className="schematic-tutorial-figure">
                <img
                  src={`${import.meta.env.BASE_URL}assets/example_minecraft1.png`}
                  alt="Example Minecraft wiring 1"
                />
                <figcaption>In-game wiring example 1</figcaption>
              </figure>
              <figure className="schematic-tutorial-figure">
                <img
                  src={`${import.meta.env.BASE_URL}assets/example_minecraft2.png`}
                  alt="Example Minecraft wiring 2"
                />
                <figcaption>In-game wiring example 2</figcaption>
              </figure>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="schematic-legend">
        {Object.entries(blockColor).map(([blockId, color]) => (
          <div key={blockId} className="schematic-legend-item">
            <span
              className="schematic-legend-swatch"
              style={{ background: color }}
            />
            <span className="schematic-legend-label">
              {blockLabel(blockId)}
            </span>
          </div>
        ))}
      </div>

      {/* Block totals and raw resource summary */}
      {grid.instruments.length > 0 &&
        (() => {
          const { noteblocks, repeaters, dust, raw, supportMap } =
            totalBlockCounts;
          const supportEntries = [...supportMap.entries()];
          return (
            <div className="schematic-totals">
              <div className="schematic-totals-section">
                <h3 className="schematic-totals-heading">Blocks needed</h3>
                <div className="schematic-totals-chips">
                  <TotalsChip
                    icon={<MiniNoteBlock size={18} />}
                    count={noteblocks}
                    label="note blocks"
                  />
                  <TotalsChip
                    icon={<MiniRepeater size={18} />}
                    count={repeaters}
                    label="repeaters"
                  />
                  <TotalsChip
                    icon={<MiniDust size={18} />}
                    count={dust}
                    label="redstone dust"
                  />
                  {supportEntries.map(([bid, n]) => (
                    <TotalsChip
                      key={bid}
                      icon={<MiniBlock color={blockColorFor(bid)} size={18} />}
                      count={n}
                      label={blockLabel(bid)}
                    />
                  ))}
                </div>
              </div>
              <div className="schematic-totals-section">
                <h3 className="schematic-totals-heading">Raw resources</h3>
                <div className="schematic-totals-chips">
                  <TotalsChip
                    icon={<MiniBlock color="#6b4a1e" size={18} />}
                    count={raw.logs}
                    label={`logs (${raw.planks.toLocaleString()} planks)`}
                  />
                  <TotalsChip
                    icon={<MiniDust size={18} />}
                    count={raw.redstoneDust}
                    label={
                      raw.redstoneBlocks > 0
                        ? `redstone dust = ${raw.redstoneBlocks} block${raw.redstoneBlocks !== 1 ? "s" : ""}${raw.redstoneRemainder > 0 ? ` + ${raw.redstoneRemainder}` : ""}`
                        : "redstone dust"
                    }
                  />
                  <TotalsChip
                    icon={<MiniBlock color="#8f9497" size={18} />}
                    count={raw.stone}
                    label="stone"
                  />
                  {supportEntries.map(([bid, n]) => (
                    <TotalsChip
                      key={bid}
                      icon={<MiniBlock color={blockColorFor(bid)} size={18} />}
                      count={n}
                      label={`${blockLabel(bid)} (support)`}
                    />
                  ))}
                </div>
              </div>
              <div className="schematic-totals-section">
                <h3 className="schematic-totals-heading">Minimum build area</h3>
                <div className="schematic-dimensions">
                  <span className="schematic-dim-chip">
                    <span className="schematic-dim-axis">X</span>
                    <span className="schematic-dim-value">{dimensions.x}</span>
                    <span className="schematic-dim-unit">blocks long</span>
                  </span>
                  <span className="schematic-dim-sep">×</span>
                  <span className="schematic-dim-chip">
                    <span className="schematic-dim-axis">Z</span>
                    <span className="schematic-dim-value">{dimensions.z}</span>
                    <span className="schematic-dim-unit">blocks wide</span>
                  </span>
                  <span className="schematic-dim-sep">×</span>
                  <span className="schematic-dim-chip">
                    <span className="schematic-dim-axis">Y</span>
                    <span className="schematic-dim-value">{dimensions.y}</span>
                    <span className="schematic-dim-unit">blocks tall</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

      <DragScrollArea className="schematic-scroll">
        <div ref={contentRef} className="schematic-content">
          {grid.instruments.length > 0 && (
            <>
              <button
                type="button"
                className="schematic-indicator"
                style={{ left: `${indicatorX}px` }}
                onPointerDown={onIndicatorPointerDown}
                onPointerMove={onIndicatorPointerMove}
                onPointerUp={onIndicatorPointerUp}
                onPointerCancel={onIndicatorPointerUp}
                aria-label="Drag to mark column build progress"
              >
                <span className="schematic-indicator-line" aria-hidden="true" />
                <span className="schematic-indicator-head" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="schematic-h-indicator"
                style={{ top: `${indicatorY}px` }}
                onPointerDown={onHIndicatorPointerDown}
                onPointerMove={onHIndicatorPointerMove}
                onPointerUp={onHIndicatorPointerUp}
                onPointerCancel={onHIndicatorPointerUp}
                aria-label="Drag to mark row build progress"
              >
                <span
                  className="schematic-h-indicator-line"
                  aria-hidden="true"
                />
                <span
                  className="schematic-h-indicator-head"
                  aria-hidden="true"
                />
              </button>
            </>
          )}
          {grid.instruments.length === 0 ? (
            <p className="hint">No notes to display.</p>
          ) : (
            <SchematicGrid
              grid={grid}
              cellSize={cellSize}
              onColumnClick={onColumnClick}
              onRowClick={onRowClick}
            />
          )}
        </div>
      </DragScrollArea>
    </CollapsiblePanel>
  );
}
