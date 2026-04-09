export type Track = {
  id: any;
  title: any;
  subtitle: string;
  notes: Note[];
};

export type Note = {
  redstoneTickDelay: number;
  startTick: any;
  placements: any;
};
