import { Fragment, memo } from 'react';
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

function getRepeaterCount(redstoneTickDelay, repeaterVisualizationMode) {
  if (redstoneTickDelay <= 0) return 0;

  if (repeaterVisualizationMode === 'single') return 1;
  if (repeaterVisualizationMode === 'synchronous') return redstoneTickDelay;

  return Math.max(1, Math.ceil(redstoneTickDelay / 4));
}

function getRepeaterSettings(redstoneTickDelay, repeaterVisualizationMode) {
  if (redstoneTickDelay <= 0) return [];

  if (repeaterVisualizationMode === 'single') return [1];
  if (repeaterVisualizationMode === 'synchronous') {
    return Array.from({ length: redstoneTickDelay }, () => 1);
  }

  const settings = [];
  let remainingTicks = redstoneTickDelay;

  while (remainingTicks > 0) {
    const setting = Math.min(4, remainingTicks);
    settings.push(setting);
    remainingTicks -= setting;
  }

  return settings;
}

function formatRepeaterStates(repeaterSettings) {
  if (repeaterSettings.length === 0) return 'none';
  return repeaterSettings.join(', ');
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

function TrackRow({
  title,
  subtitle,
  notes,
  repeaterVisualizationMode,
  noteTooltipDirection = 'top',
  isPlaybackDimmed = false,
}) {
  const repeaterImages = {
    1: `${import.meta.env.BASE_URL}assets/repeater-1.svg`,
    2: `${import.meta.env.BASE_URL}assets/repeater-2.svg`,
    3: `${import.meta.env.BASE_URL}assets/repeater-3.svg`,
    4: `${import.meta.env.BASE_URL}assets/repeater-4.svg`,
  };
  const noteblockImg = `${import.meta.env.BASE_URL}assets/noteblock.svg`;
  const isEmpty = notes.length === 0;
  const rowClassName = [
    'track-row',
    isEmpty ? 'track-row-empty' : '',
    isPlaybackDimmed ? 'track-row-dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClassName}>
      <div className="track-title">
        <span className="track-index">{title}</span>
        <span className="track-count">{subtitle || `${notes.length} notes`}</span>
      </div>
      <div className="track-line">
        {notes.map((placement, noteIndex) => {
          const tuningInfo = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
          const tooltipLines = getNoteblockTooltip(placement).split('\n');
          const repeaterSettings = getRepeaterSettings(
            placement.redstoneTickDelay,
            repeaterVisualizationMode
          );
          const units = [];

          for (let i = 0; i < repeaterSettings.length; i += 1) {
            const setting = repeaterSettings[i];
            units.push(
              <div
                className="repeater repeater-with-tooltip"
                key={`rep-${noteIndex}-${i}`}
                tabIndex={0}
                aria-label={`Repeater state ${setting}, delay ${placement.redstoneTickDelay} ticks, ${repeaterSettings.length} repeater(s) total`}
              >
                <img src={repeaterImages[setting] || repeaterImages[1]} alt={`repeater setting ${setting}`} />
                {i === 0 ? (
                  <div className="delay-label">{placement.redstoneTickDelay}</div>
                ) : null}
                <span className="cell-tooltip" role="tooltip">
                  Mode: {repeaterVisualizationMode}
                  <br />
                  Delay: {placement.redstoneTickDelay} ticks
                  <br />
                  Repeaters: {repeaterSettings.length}
                  <br />
                  States: {formatRepeaterStates(repeaterSettings)}
                  <br />
                  This: state {setting}
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
              aria-label={getNoteblockTooltip(placement).replace(/\n/g, ', ')}
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
              {tuningInfo ? (
                <span
                  className="note-corner-color"
                  style={{ backgroundColor: tuningInfo.color }}
                  aria-hidden="true"
                />
              ) : null}
              {tuningInfo ? (
                <span className="note-use-count" aria-hidden="true">
                  {tuningInfo.useCount}
                </span>
              ) : null}
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
              <span
                className={
                  noteTooltipDirection === 'bottom'
                    ? 'cell-tooltip cell-tooltip-below'
                    : 'cell-tooltip'
                }
                role="tooltip"
              >
                {tooltipLines.map((line, lineIndex) => (
                  <Fragment key={`${noteIndex}-tooltip-${lineIndex}`}>
                    {lineIndex > 0 ? <br /> : null}
                    {line}
                  </Fragment>
                ))}
              </span>
            </div>
          );

          return <Fragment key={`frag-${noteIndex}`}>{units}</Fragment>;
        })}
      </div>
    </div>
  );
}

export default memo(TrackRow);