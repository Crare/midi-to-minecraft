import { Fragment } from 'react';
import { playPlacementSound } from '../audio/noteblockAudio';

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

function getRepeaterCount(redstoneTickDelay, repeaterVisualizationMode) {
  if (redstoneTickDelay <= 0) return 0;

  if (repeaterVisualizationMode === 'single') return 1;
  if (repeaterVisualizationMode === 'synchronous') return redstoneTickDelay;

  return Math.max(1, Math.ceil(redstoneTickDelay / 4));
}

function getRepeaterTooltip(placement, repeaterVisualizationMode) {
  const modeLabel =
    repeaterVisualizationMode === 'single'
      ? 'Single repeater'
      : repeaterVisualizationMode === 'synchronous'
        ? 'Synchronous alignment'
        : 'Accurate amount needed';

  return `${modeLabel}\nDelay: ${placement.redstoneTickDelay} redstone ticks`;
}

function getNoteblockTooltip(placement) {
  return [
    `Instrument: ${placement.instrument}`,
    `Pitch: ${placement.pitch || 'drum'}`,
    `Note: ${placement.note}`,
    `Block: ${placement.block}`,
  ].join('\n');
}

export default function TrackRow({ title, subtitle, notes, repeaterVisualizationMode }) {
  const repeaterImg = `${import.meta.env.BASE_URL}assets/repeater.svg`;
  const noteblockImg = `${import.meta.env.BASE_URL}assets/noteblock.svg`;
  const isEmpty = notes.length === 0;

  return (
    <div className={isEmpty ? 'track-row track-row-empty' : 'track-row'}>
      <div className="track-title">
        <span className="track-index">{title}</span>
        <span className="track-count">{subtitle || `${notes.length} notes`}</span>
      </div>
      <div className="track-line">
        {notes.map((placement, noteIndex) => {
          const repeaterCount = getRepeaterCount(
            placement.redstoneTickDelay,
            repeaterVisualizationMode
          );
          const units = [];

          for (let i = 0; i < repeaterCount; i += 1) {
            units.push(
              <div
                className="repeater repeater-with-tooltip"
                key={`rep-${noteIndex}-${i}`}
                tabIndex={0}
                title={getRepeaterTooltip(placement, repeaterVisualizationMode)}
              >
                <img src={repeaterImg} alt="repeater" />
                {i === 0 ? (
                  <div className="delay-label">{placement.redstoneTickDelay}</div>
                ) : null}
                <span className="cell-tooltip" role="tooltip">
                  Mode: {repeaterVisualizationMode}
                  <br />
                  Delay: {placement.redstoneTickDelay} ticks
                </span>
              </div>
            );
          }

          units.push(
            <div
              className="note-unit note-unit-button"
              key={`note-${noteIndex}`}
              role="button"
              tabIndex={0}
              title={getNoteblockTooltip(placement)}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                void playPlacementSound(placement);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void playPlacementSound(placement);
                }
              }}
            >
              <img className="note-img" src={noteblockImg} alt="noteblock" />
              <img
                className="support-img"
                src={supportSpriteForBlock(placement.block)}
                alt={placement.block}
              />
              <div className="note-meta">
                {placement.instrument}
                <br />
                {placement.pitch || 'drum'} {placement.note}
              </div>
              <span className="cell-tooltip" role="tooltip">
                {placement.instrument}
                <br />
                {placement.pitch || 'drum'} {placement.note}
                <br />
                {placement.block}
              </span>
            </div>
          );

          return <Fragment key={`frag-${noteIndex}`}>{units}</Fragment>;
        })}
      </div>
    </div>
  );
}