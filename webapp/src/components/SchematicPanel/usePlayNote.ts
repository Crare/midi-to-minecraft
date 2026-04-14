import { playPlacementSound } from '../../audio/noteblockAudio';

export function playNoteCell(cell: any) {
  console.log('playNoteCell', { cell: cell });
  if (!cell || cell.type !== 'note') return;
  // Use cell.note for note value, instrument from row
  playPlacementSound({
    instrument: cell.instrument,
    note: cell.note ?? (cell.event && cell.event.note) ?? 0,
    pitch: cell.pitch, // may be undefined, handled by playPlacementSound
  });
}
