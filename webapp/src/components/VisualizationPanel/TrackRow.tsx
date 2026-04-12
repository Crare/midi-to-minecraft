// import { playPlacementSound } from '@audio/noteblockAudio';
// import { noteColorByStep, notePitchNames, supportColorByBlock } from '@constants';
// import { Fragment, memo, useMemo } from 'react';

// const supportSpriteCache = new Map<string, string>();

// function supportSpriteForBlock(blockId: string) {
//   if (supportSpriteCache.has(blockId)) return supportSpriteCache.get(blockId);
//   const blockName = (blockId || 'minecraft:dirt').replace('minecraft:', '');
//   const color = supportColorByBlock[blockName] || '#8a8a8a';
//   const dark = '#4c4c4c';
//   const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' shape-rendering='crispEdges'>
//     <rect width='64' height='64' fill='${color}'/>
//     <rect x='2' y='2' width='60' height='10' fill='rgba(255,255,255,0.25)'/>
//     <rect x='2' y='54' width='60' height='8' fill='rgba(0,0,0,0.2)'/>
//     <rect x='0' y='0' width='64' height='64' fill='none' stroke='${dark}' stroke-width='2'/>
//   </svg>`;
//   const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
//   supportSpriteCache.set(blockId, uri);
//   return uri;
// }

// function getMinecraftTuningInfo(useCount: number) {
//   const normalizedUseCount = ((useCount % 24) + 24) % 24;
//   const noteStep = normalizedUseCount % 12;
//   return {
//     useCount: normalizedUseCount,
//     pitchName: notePitchNames[noteStep],
//     playsoundPitch: 2 ** ((normalizedUseCount - 12) / 12),
//     color: noteColorByStep[noteStep],
//   };
// }

// function getNoteblockTooltip(placement: any) {
//   const tuningInfo = placement.pitch ? getMinecraftTuningInfo(placement.note) : null;
//   return [
//     `Instrument: ${placement.instrument}`,
//     `Pitch: ${placement.pitch || 'drum'}`,
//     `Note: ${placement.note}`,
//     tuningInfo ? `Use count: ${tuningInfo.useCount}` : null,
//     tuningInfo ? `Minecraft pitch: ${tuningInfo.pitchName}` : null,
//     tuningInfo ? `Playsound pitch: ${tuningInfo.playsoundPitch.toFixed(6)}` : null,
//     tuningInfo ? `Color: ${tuningInfo.color}` : null,
//     `Block: ${placement.block}`,
//   ]
//     .filter(Boolean)
//     .join('\n');
// }

// const noteblockImg = `${import.meta.env.BASE_URL}assets/noteblock.svg`;

// interface Placement {
//   pitch?: string;
//   note: number;
//   instrument: string;
//   block: string;
// }

// interface Note {
//   placements: Placement[];
//   redstoneTickDelay: number;
// }

// interface TrackRowProps {
//   notes: Note[];
//   showColor?: boolean;
//   showNumber?: boolean;
//   showSupport?: boolean;
//   noteTooltipDirection?: 'top' | 'bottom';
//   isPlaybackDimmed?: boolean;
//   unitSize?: number;
//   scrollLeft?: number;
//   containerWidth?: number;
// }

// function TrackRow({
//   notes,
//   showColor = true,
//   showNumber = true,
//   showSupport = true,
//   noteTooltipDirection = 'top',
//   isPlaybackDimmed = false,
//   unitSize = 34,
//   scrollLeft = 0,
//   containerWidth = Infinity,
// }: TrackRowProps) {
//   const CELL = unitSize + 2;
//   const noteLayout = useMemo(() => {
//     let cum = 0;
//     return notes.map((note) => {
//       const spacerUnits = Math.max(0, note.redstoneTickDelay);
//       const unitStart = cum;
//       cum += spacerUnits + 1;
//       return { unitStart, spacerUnits, unitEnd: cum };
//     });
//   }, [notes]);
//   const totalUnits = noteLayout.length > 0 ? noteLayout[noteLayout.length - 1].unitEnd : 0;
//   const overscan = Number.isFinite(containerWidth) ? containerWidth : 0;
//   const visStart = scrollLeft - overscan;
//   const visEnd = scrollLeft + (Number.isFinite(containerWidth) ? containerWidth : 1e9) + overscan;
//   const threshStart = (visStart + 2) / CELL;
//   let startIdx = 0;
//   {
//     let lo = 0;
//     let hi = noteLayout.length;
//     while (lo < hi) {
//       const mid = (lo + hi) >> 1;
//       if (noteLayout[mid].unitEnd <= threshStart) lo = mid + 1;
//       else hi = mid;
//     }
//     startIdx = lo;
//   }
//   const threshEnd = visEnd / CELL;
//   let endIdx = noteLayout.length;
//   {
//     let lo = startIdx;
//                       <SupportBlock blockId={placement.block} size={32} className="support-img" alt={placement.block} />
//     while (lo < hi) {
//       const mid = (lo + hi) >> 1;
//       if (noteLayout[mid].unitStart < threshEnd) lo = mid + 1;
//       else hi = mid;
//     }
//     endIdx = lo;
//   }
//   const beforeUnitCount = noteLayout[startIdx]?.unitStart ?? totalUnits;
//   const afterUnitStart = noteLayout[endIdx]?.unitStart ?? totalUnits;
//   const afterUnitCount = totalUnits - afterUnitStart;
//   const beforeSpacerWidth = beforeUnitCount > 0 ? beforeUnitCount * CELL - 2 : 0;
//   const afterSpacerWidth = afterUnitCount > 0 ? afterUnitCount * CELL - 2 : 0;
//   const rowClassName = ['track-row', isPlaybackDimmed ? 'track-row-dimmed' : '']
//     .filter(Boolean)
//     .join(' ');
//   return (
//     <div className={rowClassName}>
//       <div className="track-line">
//         {beforeSpacerWidth > 0 && (
//           <div style={{ width: `${beforeSpacerWidth}px`, flexShrink: 0 }} aria-hidden="true" />
//         )}
//         {noteLayout.slice(startIdx, endIdx).map((layout, i) => {
//           const noteIndex = startIdx + i;
//           const note = notes[noteIndex];
//           const spacerWidth = layout.spacerUnits > 0 ? layout.spacerUnits * CELL - 2 : 0;
//           return (
//             <Fragment key={`frag-${noteIndex}`}>
//               {spacerWidth > 0 && (
//                 <div style={{ width: `${spacerWidth}px`, flexShrink: 0 }} aria-hidden="true" />
//               )}
//               <div className="note-unit">
//                 {note.placements.map((placement, pi) => {
//                   const tuningInfo = placement.pitch
//                     ? getMinecraftTuningInfo(placement.note)
//                     : null;
//                   const tooltipLines = getNoteblockTooltip(placement).split('\n');
//                   return (
//                     <div
//                       key={pi}
//                       className="note-stack-item note-unit-button"
//                       role="button"
//                       tabIndex={0}
//                       aria-label={getNoteblockTooltip(placement).replace(/\n/g, ', ')}
//                       onPointerDown={(event) => event.stopPropagation()}
//                       onClick={() => {
//                         void playPlacementSound(placement);
//                       }}
//                       onKeyDown={(event) => {
//                         if (event.key === 'Enter' || event.key === ' ') {
//                           event.preventDefault();
//                           void playPlacementSound(placement);
//                         }
//                       }}
//                     >
//                       {showColor && tuningInfo ? (
//                         <span
//                           className="note-corner-color"
//                           style={{ backgroundColor: tuningInfo.color }}
//                           aria-hidden="true"
//                         />
//                       ) : null}
//                       {showNumber && tuningInfo ? (
//                         <span className="note-use-count" aria-hidden="true">
//                           {tuningInfo.useCount}
//                         </span>
//                       ) : null}
//                       <img className="note-img"
//                           src={noteblockImg}
//                           alt="noteblock"
//                           draggable={false}
//                         />
//                       {showSupport ? (
//                         <img
//                           className="support-img"
//                           src={supportSpriteForBlock(placement.block)}
//                           alt={placement.block}
//                           draggable={false}
//                         />
//                       ) : null}
//                       <span
//                         className={
//                           noteTooltipDirection === 'bottom'
//                             ? 'cell-tooltip cell-tooltip-below'
//                             : 'cell-tooltip'
//                         }
//                         role="tooltip"
//                       >
//                         {tooltipLines.map((line, lineIndex) => (
//                           <Fragment key={`${noteIndex}-${pi}-tooltip-${lineIndex}`}>
//                             {lineIndex > 0 ? <br /> : null}
//                             {line}
//                           </Fragment>
//                         ))}
//                       </span>
//                     </div>
//                   );
//                 })}
//               </div>
//             </Fragment>
//           );
//         })}
//         {afterSpacerWidth > 0 && (
//           <div style={{ width: `${afterSpacerWidth}px`, flexShrink: 0 }} aria-hidden="true" />
//         )}
//       </div>
//     </div>
//   );
// }

// export default memo(TrackRow);
