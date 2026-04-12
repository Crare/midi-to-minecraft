import {
  blockByPatchId,
  blockByPercussiveNote,
  defaultInstrumentBlock,
  defaultPercussiveBlock,
  instrumentByBlock
} from "./constants";

export function midiToPitchClass(noteNumber) {
  const scale = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
  ];
  return scale[noteNumber % 12];
}

export function midiToMinecraftNote(noteNumber) {
  return (((noteNumber - 6) % 24) + 24) % 24;
}

export function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function splitOutputTarget(inputName, outputName) {
  const safeInput = sanitizeFilename(
    inputName.replace(/\.[^.]+$/, "") || "song"
  );
  const fallback = `${safeInput}.json`;
  const target = (outputName || fallback).trim() || fallback;

  const slash = Math.max(target.lastIndexOf("/"), target.lastIndexOf("\\"));
  const hasDir = slash !== -1;
  const dir = hasDir ? target.slice(0, slash) : "output";
  const base = hasDir ? target.slice(slash + 1) : target;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : ".json";
  return { dir, stem, ext };
}

export function getZipFilename(outputName, inputName) {
  const target = splitOutputTarget(inputName, outputName);
  return `${target.stem}.zip`;
}

export function getSongStartTime(midi) {
  let earliestTime = Infinity;

  midi.tracks.forEach((track) => {
    track.notes.forEach((note) => {
      if (note.time < earliestTime) earliestTime = note.time;
    });
  });

  return Number.isFinite(earliestTime) ? earliestTime : 0;
}

// Builds a single flat list of all notes across all MIDI tracks, sorted by absolute start time.
export function buildNoteList(midi, { trimLeadingSilence = false } = {}) {
  const songStartTime = trimLeadingSilence ? getSongStartTime(midi) : 0;
  const notes = [];

  midi.tracks.forEach((track, trackIndex) => {
    const channel = typeof track.channel === "number" ? track.channel : 0;
    const patch = track.instrument?.number ?? 0;
    const defaultTrackBlock = blockByPatchId[patch] || defaultInstrumentBlock;
    const trackName = track.name || `Track ${trackIndex + 1}`;

    track.notes.forEach((note) => {
      const startTime = Math.max(0, note.time - songStartTime);
      const duration = Math.max(note.duration ?? 0.05, 0.05);
      const endTime = startTime + duration;
      const isDrum = channel === 9;
      const block = isDrum
        ? blockByPercussiveNote[note.midi] || defaultPercussiveBlock
        : defaultTrackBlock;
      const pitch = isDrum ? undefined : midiToPitchClass(note.midi);
      const mcNote = isDrum ? 0 : midiToMinecraftNote(note.midi);

      notes.push({
        time: startTime,
        endTime,
        block,
        pitch,
        note: mcNote,
        instrument: instrumentByBlock[block] || "harp",
        trackIndex,
        trackName
      });
    });
  });

  return notes.sort((a, b) => a.time - b.time);
}

// Groups the unified note list by instrument, splitting into lanes when notes overlap in time.
export function buildTrackEvents(midi, { trimLeadingSilence = false } = {}) {
  const noteList = buildNoteList(midi, { trimLeadingSilence });
  const instrumentMap = new Map();

  noteList.forEach((note) => {
    if (!instrumentMap.has(note.instrument))
      instrumentMap.set(note.instrument, []);
    instrumentMap.get(note.instrument).push(note);
  });

  const tracks = [];
  const epsilon = 1e-6;

  instrumentMap.forEach((events, instrument) => {
    const lanes = [];

    events.forEach((event) => {
      let lane = lanes.find((l) => event.time + epsilon >= l.lastEndTime);
      if (!lane) {
        lane = { lastEndTime: -Infinity, events: [] };
        lanes.push(lane);
      }
      lane.events.push(event);
      lane.lastEndTime = Math.max(lane.lastEndTime, event.endTime);
    });

    lanes.forEach((lane, laneIndex) => {
      tracks.push({
        id: `instrument-${instrument}-${laneIndex}`,
        title: instrument,
        events: lane.events
      });
    });
  });

  return tracks;
}

export function eventsToPlacements(events) {
  let lastTime = 0;
  let lastTick = 0;

  return events.map((event) => {
    const redstoneTickDelay = Math.round(
      Math.max(0, event.time - lastTime) * 10
    );
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
      trackName: event.trackName
    };
  });
}
