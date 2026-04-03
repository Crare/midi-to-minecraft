import { ProgramChangeEvent, MidiFile, NoteOnEvent, ChannelEvent } from 'midifile-ts';
import { BlockPallette, InstrumentPallette, DrumPallette } from "./types.js";
import { midiToPitchClass, midiToMinecraftNote } from './utils.js';
import { defaultInstrumentBlock, instrumentByBlock } from './instrument-blocks.js';

const MSPT = 50;
//const EAST = '+X';
//const SOUTH = '+Z';

export interface NoteBlockPlacement {
    redstoneTickDelay: number;
    block: string;
    pitch?: string;
    note: number;
    instrument: string;
}

class MidiToBlockTranslator {
    private midi: MidiFile;
    private instruments: InstrumentPallette;
    private drums: DrumPallette;
    private ticksPerBeat: number = 1;
    private microsecondsPerBeat: number = 1;
    private blockByChannel: Map<number, string> = new Map();
    private blockSequences: NoteBlockPlacement[][] = [];
    private microseconds: number = 0;

    constructor(midi: MidiFile, { instruments, drums }: BlockPallette) {
        this.midi = midi;
        this.ticksPerBeat = midi.header.ticksPerBeat;
        this.instruments = instruments;
        this.drums = drums;
    }

    private setChannelBlock(event: ProgramChangeEvent) {
        if (event.channel !== 9) {
            this.blockByChannel.set(
                event.channel,
                this.instruments.get(event.value)!.block
            );
        }
    }

    private getRedstoneTicks() {
        const milliseconds = this.microseconds / 1000;
        const gameTicks = milliseconds / MSPT;
        const redstoneTicks = gameTicks / 2;
        return Math.round(redstoneTicks);
    }

    private advanceTimer(event: ChannelEvent<any>) {
        const ticks = event.deltaTime;
        const beats = ticks / this.ticksPerBeat;
        const microseconds = beats * this.microsecondsPerBeat;
        this.microseconds += microseconds;
    }

    private addPlacement(event: NoteOnEvent, index: number) {
        if (event.velocity === 0) {
            return;
        }

        const block = (event.channel === 9)
            ? this.drums.get(event.noteNumber)!.block
            : this.blockByChannel.get(event.channel) || defaultInstrumentBlock;
        const pitch = (event.channel === 9)
            ? undefined
            : midiToPitchClass(event.noteNumber);
        const note = (event.channel === 9)
            ? 0
            : midiToMinecraftNote(event.noteNumber);
        this.blockSequences[index].push({
            redstoneTickDelay: this.getRedstoneTicks(),
            block,
            pitch,
            note,
            instrument: instrumentByBlock.get(block)!,
        });
        this.microseconds = 0;
    }

    translate(): NoteBlockPlacement[][] {
        this.midi.tracks.forEach((track, index) => {
            this.blockSequences.push([]);
            track.forEach(event => {
                switch (event.type) {
                    case 'meta':
                        switch (event.subtype) {
                            case 'setTempo':
                                this.microsecondsPerBeat = event.microsecondsPerBeat;
                                break;
                        }
                        break;
                    case 'channel':
                        this.advanceTimer(event);
                        switch (event.subtype) {
                            case 'programChange':
                               this.setChannelBlock(event);
                               break;
                            case 'noteOn':
                                this.addPlacement(event, index);
                                break;
                        }
                        break;
                }
            });
        });

        return this.blockSequences;
    }
}

export default function generateBlockSequences(midi: MidiFile, blockPallette: BlockPallette): NoteBlockPlacement[][] {
    const translator = new MidiToBlockTranslator(midi, blockPallette);
    return translator.translate();
}