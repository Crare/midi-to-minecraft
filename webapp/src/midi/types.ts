export type Placement = {
  redstoneTickDelay: number;
  startTick: number;
  block: string;
  pitch?: string;
  note: number;
  instrument: string;
  trackIndex: number;
  trackName: string;
};

export type NoteEvent = {
  time: number;
  endTime: number;
  block: string;
  pitch?: string;
  note: number;
  instrument: string;
  trackIndex: number;
  trackName: string;
};
