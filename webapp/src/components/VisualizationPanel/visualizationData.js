export const playbackScopes = {
  all: 'all',
  single: 'single',
};

export const viewModes = {
  instrument: 'instrument',
  track: 'track',
};

export const redstoneTickDurationMs = 100;

export function formatInstrumentName(instrument) {
  return instrument
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getMaxTrackTick(tracks) {
  return tracks.reduce(
    (maxTick, track) => Math.max(maxTick, ...track.notes.map((note) => note.startTick ?? 0), 0),
    0
  );
}

export function findFirstNoteIndexAtOrAfter(notes, startTick) {
  let low = 0;
  let high = notes.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (notes[mid].startTick < startTick) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

export function buildVisualizationTracks(trackEvents, mode = 'instrument') {
  const groups = new Map();

  if (mode === 'track') {
    // Group by original MIDI track index.
    trackEvents.forEach((track) => {
      track.events.forEach((event) => {
        const key = String(event.trackIndex);
        if (!groups.has(key)) {
          groups.set(key, { id: `original-track-${event.trackIndex}`, title: event.trackName, events: [] });
        }
        groups.get(key).events.push(event);
      });
    });
  } else {
    // Merge all lanes for the same instrument into one visual track (default).
    trackEvents.forEach((track) => {
      const key = track.title;
      if (!groups.has(key)) {
        groups.set(key, { id: track.id, title: track.title, events: [] });
      }
      groups.get(key).events.push(...track.events);
    });
  }

  return Array.from(groups.values())
    .filter((g) => g.events.length > 0)
    .map(({ id, title, events }) => {
      // Sort all events by absolute time and group simultaneous ones by tick.
      const sorted = [...events].sort((a, b) => a.time - b.time);
      const byTick = new Map();
      sorted.forEach((event) => {
        const tick = Math.round(event.time * 10);
        if (!byTick.has(tick)) byTick.set(tick, []);
        byTick.get(tick).push(event);
      });

      let prevTick = 0;
      const notes = [...byTick.entries()]
        .sort(([a], [b]) => a - b)
        .map(([tick, tickEvents]) => {
          const redstoneTickDelay = tick - prevTick;
          prevTick = tick;
          return {
            redstoneTickDelay,
            startTick: tick,
            placements: tickEvents.map((e) => ({
              block: e.block,
              pitch: e.pitch,
              note: e.note,
              instrument: e.instrument,
            })),
          };
        });

      return {
        id,
        title: formatInstrumentName(title),
        subtitle: `${events.length} notes`,
        notes,
      };
    });
}
