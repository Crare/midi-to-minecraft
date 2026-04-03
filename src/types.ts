export interface Instrument {
    instrument: string;
    block: string;
}
export type InstrumentPallette = Map<number, Instrument>;

export interface Drum {
    block: string;
}
export type DrumPallette = Map<number, Drum>;

export interface BlockPallette {
    instruments: InstrumentPallette;
    drums: DrumPallette;
}