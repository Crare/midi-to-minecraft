import { Fragment, memo, useMemo } from 'react';
import { playPlacementSound } from '../audio/noteblockAudio';

const notePitchNames = [
  'F#/Gb',
  'G',
  'G#/Ab',
  'A',
  'A#/Bb',
  'B',
  'C',
  'C#/Db',
  'D',
  'D#/Eb',
  'E',
  'F',
];

const noteColorByStep = [
  '#77D700',
  '#95C000',
  '#B2A500',
  '#CC8600',
  '#E26500',
  '#F34100',
  '#FC1E00',
  '#FE000F',
  '#F70033',
  '#E8005A',
  '#CF0083',
  '#AE00A9',
];

const supportColorByBlock = {
  acacia_log: '#8b5a2b',
  sand: '#d4be7d',
  glass: '#8cd9e9',
  stone: '#8f9497',
  gold_block: '#f3cf3f',
  clay: '#b9a6a2',
  packed_ice: '#bce8ff',
  white_wool: '#f4f2e9',
  bone_block: '#e3dcc2',
  iron_block: '#c4cbd0',
  soul_sand: '#6f5b45',
  pumpkin: '#d27720',
  emerald_block: '#3cc76f',
  hay_block: '#d6c66a',
  glowstone: '#f2cb6c',
  dirt: '#7f5a34',
};

const supportSpriteCache = new Map();

function supportSpriteForBlock(blockId) {
  if (supportSpriteCache.has(blockId)) return supportSpriteCache.get(blockId);

  const blockName = (blockId || 'minecraft:dirt').replace('minecraft:', '');
  const color = supportColorByBlock[blockName] || '#8a8a8a';
  const dark = '#4c4c4c';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' shape-rendering='crispEdges'>
    <rect width='64' height='64' fill='${color}'/>
    <rect x='2' y='2' width='60' height='10' fill='rgba(255,255,255,0.25)'/>
    <rect x='2' y='54' width='60' height='8' fill='rgba(0,0,0,0.2)'/>
    <rect x='0' y='0' width='64' height='64' fill='none' stroke='${dark}' stroke-width='2'/>
  </svg>`;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  supportSpriteCache.set(blockId, uri);
  return uri;
}



function getMinecraftTuningInfo(useCount) {
  const normalizedUseCount = ((useCount % 24) + 24) % 24;
  const noteStep = normalizedUseCount % 12;
  return {
    useCount: normalizedUseCount,
    pitchName: notePitchNames[noteStep],
    playsoundPitch: 2 ** ((normalizedUseCount - 12) / 12),
    color: noteColorByStep[noteStep],
  };
}

function getNoteblockTooltip(placement) {
  const tuningInfo = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
  return [
    `Instrument: ${placement.instrument}`,
    `Pitch: ${placement.pitch || 'drum'}`,
    `Note: ${placement.note}`,
    tuningInfo ? `Use count: ${tuningInfo.useCount}` : null,
    tuningInfo ? `Minecraft pitch: ${tuningInfo.pitchName}` : null,
    tuningInfo ? `Playsound pitch: ${tuningInfo.playsoundPitch.toFixed(6)}` : null,
    tuningInfo ? `Color: ${tuningInfo.color}` : null,
    `Block: ${placement.block}`,
  ]
    .filter(Boolean)
    .join('\n');
}

const noteblockImg = `${import.meta.env.BASE_URL}assets/noteblock.svg`;

function TrackRow({
  notes,
  showColor = true,
  showNumber = true,
  showSupport = true,
  noteTooltipDirection = 'top',
  isPlaybackDimmed = false,
  // Virtualization props — VisualizationPanel supplies these.
  // containerWidth = Infinity renders all notes (no virtualization).
  unitSize = 34,
  scrollLeft = 0,
  containerWidth = Infinity,
}) {
  // Each visual unit is unitSize wide with a 2px flex-gap between units.
  const CELL = unitSize + 2;

  // Pre-compute the cumulative unit-start index for every note.
  // spacerUnits = redstoneTickDelay (synchronous: 1 unit = 1 tick)
  const noteLayout = useMemo(() => {
    let cum = 0;
    return notes.map((note) => {
      const spacerUnits = Math.max(0, note.redstoneTickDelay);
      const unitStart = cum;
      cum += spacerUnits + 1; // delay spacer units + 1 noteblock unit
      return { unitStart, spacerUnits, unitEnd: cum };
    });
  }, [notes]);

  const totalUnits = noteLayout.length > 0 ? noteLayout[noteLayout.length - 1].unitEnd : 0;

  // --- Determine the visible slice ---
  // Overscan: one full container width on each side for smooth scrolling.
  const overscan = Number.isFinite(containerWidth) ? containerWidth : 0;
  const visStart = scrollLeft - overscan;
  const visEnd = scrollLeft + (Number.isFinite(containerWidth) ? containerWidth : 1e9) + overscan;

  // Binary search: first note whose pixel-end (unitEnd * CELL - 2) is past visStart.
  // unitEnd * CELL - 2 > visStart  →  unitEnd > (visStart + 2) / CELL
  const threshStart = (visStart + 2) / CELL;
  let startIdx = 0;
  {
    let lo = 0;
    let hi = noteLayout.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (noteLayout[mid].unitEnd <= threshStart) lo = mid + 1;
      else hi = mid;
    }
    startIdx = lo;
  }

  // Binary search: first note whose pixel-start (unitStart * CELL) is at or past visEnd.
  const threshEnd = visEnd / CELL;
  let endIdx = noteLayout.length;
  {
    let lo = startIdx;
    let hi = noteLayout.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (noteLayout[mid].unitStart < threshEnd) lo = mid + 1;
      else hi = mid;
    }
    endIdx = lo;
  }

  // Spacer widths.  The flex gap is 2px between every pair of adjacent items.
  // A spacer of N units has width = N * CELL - 2  (so the gap after it positions
  // the next real element at exactly N * CELL pixels from the track start).
  const beforeUnitCount = noteLayout[startIdx]?.unitStart ?? totalUnits;
  const afterUnitStart = noteLayout[endIdx]?.unitStart ?? totalUnits;
  const afterUnitCount = totalUnits - afterUnitStart;

  const beforeSpacerWidth = beforeUnitCount > 0 ? beforeUnitCount * CELL - 2 : 0;
  const afterSpacerWidth = afterUnitCount > 0 ? afterUnitCount * CELL - 2 : 0;

  const rowClassName = [
    'track-row',
    isPlaybackDimmed ? 'track-row-dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClassName}>
      <div className="track-line">
        {beforeSpacerWidth > 0 && (
          <div style={{ width: `${beforeSpacerWidth}px`, flexShrink: 0 }} aria-hidden="true" />
        )}
        {noteLayout.slice(startIdx, endIdx).map((layout, i) => {
          const noteIndex = startIdx + i;
          const note = notes[noteIndex];
          const spacerWidth = layout.spacerUnits > 0 ? layout.spacerUnits * CELL - 2 : 0;

          return (
            <Fragment key={`frag-${noteIndex}`}>
              {spacerWidth > 0 && (
                <div style={{ width: `${spacerWidth}px`, flexShrink: 0 }} aria-hidden="true" />
              )}
              <div className="note-unit">
                {note.placements.map((placement, pi) => {
                  const tuningInfo = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
                  const tooltipLines = getNoteblockTooltip(placement).split('\n');
                  return (
                    <div
                      key={pi}
                      className="note-stack-item note-unit-button"
                      role="button"
                      tabIndex={0}
                      aria-label={getNoteblockTooltip(placement).replace(/\n/g, ', ')}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => { void playPlacementSound(placement); }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          void playPlacementSound(placement);
                        }
                      }}
                    >
                      {showColor && tuningInfo ? (
                        <span
                          className="note-corner-color"
                          style={{ backgroundColor: tuningInfo.color }}
                          aria-hidden="true"
                        />
                      ) : null}
                      {showNumber && tuningInfo ? (
                        <span className="note-use-count" aria-hidden="true">
                          {tuningInfo.useCount}
                        </span>
                      ) : null}
                      <img className="note-img" src={noteblockImg} alt="noteblock" />
                      {showSupport ? (
                        <img
                          className="support-img"
                          src={supportSpriteForBlock(placement.block)}
                          alt={placement.block}
                        />
                      ) : null}
                      <span
                        className={
                          noteTooltipDirection === 'bottom'
                            ? 'cell-tooltip cell-tooltip-below'
                            : 'cell-tooltip'
                        }
                        role="tooltip"
                      >
                        {tooltipLines.map((line, lineIndex) => (
                          <Fragment key={`${noteIndex}-${pi}-tooltip-${lineIndex}`}>
                            {lineIndex > 0 ? <br /> : null}
                            {line}
                          </Fragment>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Fragment>
          );
        })}
        {afterSpacerWidth > 0 && (
          <div style={{ width: `${afterSpacerWidth}px`, flexShrink: 0 }} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

export default memo(TrackRow);
