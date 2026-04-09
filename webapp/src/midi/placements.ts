import { NoteEvent, Placement } from './types';

export function eventsToPlacements(events: NoteEvent[]): Placement[] {
  let lastTime = 0;
  let lastTick = 0;

  return events.map((event) => {
    const redstoneTickDelay = Math.round(Math.max(0, event.time - lastTime) * 10);
    const startTick = lastTick + redstoneTickDelay;
    lastTime = event.time;
    lastTick = startTick;

    return {
      redstoneTickDelay,
      startTick,
      block: event.block,
      pitch: event.pitch,
      note: event.note,
      instrument: event.instrument,
      trackIndex: event.trackIndex,
      trackName: event.trackName,
    };
  });
}
