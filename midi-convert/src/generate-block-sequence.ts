import { ProgramChangeEvent, MidiFile, NoteOnEvent } from 'midifile-ts';
import { BlockPallette, InstrumentPallette, DrumPallette } from './types.js';
import { midiToPitchClass, midiToMinecraftNote } from './utils.js';
import {
  defaultInstrumentBlock,
  instrumentByBlock,
} from './instrument-blocks.js';

const MSPT = 50;

export interface NoteBlockPlacement {
  redstoneTickDelay: number;
  block: string;
  pitch?: string;
  note: number;
  instrument: string;
  trackIndex: number;
  trackName: string;
}

interface UnifiedNoteEvent {
  absoluteMicroseconds: number;
  block: string;
  pitch?: string;
  note: number;
  instrument: string;
  trackIndex: number;
  trackName: string;
}

class MidiToBlockTranslator {
  private midi: MidiFile;
  private instruments: InstrumentPallette;
  private drums: DrumPallette;
  private ticksPerBeat: number = 1;
  private microsecondsPerBeat: number = 500000;
  private blockByChannel: Map<number, string> = new Map();
  private blockSequences: NoteBlockPlacement[][] = [];

  constructor(midi: MidiFile, { instruments, drums }: BlockPallette) {
    this.midi = midi;
    this.ticksPerBeat = midi.header.ticksPerBeat;
    this.instruments = instruments;
    this.drums = drums;
  }

  private redstoneTicks(microseconds: number): number {
    const milliseconds = microseconds / 1000;
    const gameTicks = milliseconds / MSPT;
    const redstoneTicks = gameTicks / 2;
    return Math.round(redstoneTicks);
  }

  translate(): NoteBlockPlacement[][] {
    // Collect all note events from all tracks with absolute timing.
    const allNoteEvents: UnifiedNoteEvent[] = [];

    this.midi.tracks.forEach((track, trackIndex) => {
      let absoluteMicroseconds = 0;
      const trackName = (track as any).name || `Track ${trackIndex + 1}`;

      track.forEach((event) => {
        switch (event.type) {
          case 'meta':
            if (event.subtype === 'setTempo') {
              this.microsecondsPerBeat = event.microsecondsPerBeat;
            }
            break;
          case 'channel': {
            absoluteMicroseconds +=
              (event.deltaTime / this.ticksPerBeat) * this.microsecondsPerBeat;

            if (event.subtype === 'programChange' && event.channel !== 9) {
              this.blockByChannel.set(
                event.channel,
                this.instruments.get((event as ProgramChangeEvent).value)!.block
              );
            }

            if (
              event.subtype === 'noteOn' &&
              (event as NoteOnEvent).velocity > 0
            ) {
              const noteEvent = event as NoteOnEvent;
              const block =
                noteEvent.channel === 9
                  ? this.drums.get(noteEvent.noteNumber)!.block
                  : this.blockByChannel.get(noteEvent.channel) ||
                    defaultInstrumentBlock;
              const pitch =
                noteEvent.channel === 9
                  ? undefined
                  : midiToPitchClass(noteEvent.noteNumber);
              const note =
                noteEvent.channel === 9
                  ? 0
                  : midiToMinecraftNote(noteEvent.noteNumber);

              allNoteEvents.push({
                absoluteMicroseconds,
                block,
                pitch,
                note,
                instrument: instrumentByBlock.get(block)!,
                trackIndex,
                trackName,
              });
            }
            break;
          }
        }
      });
    });

    // Sort the unified list by absolute time (ascending).
    allNoteEvents.sort(
      (a, b) => a.absoluteMicroseconds - b.absoluteMicroseconds
    );

    // Group by instrument.
    const instrumentMap = new Map<string, UnifiedNoteEvent[]>();
    allNoteEvents.forEach((noteEvent) => {
      if (!instrumentMap.has(noteEvent.instrument)) {
        instrumentMap.set(noteEvent.instrument, []);
      }
      instrumentMap.get(noteEvent.instrument)!.push(noteEvent);
    });

    // Split each instrument into lanes for notes that would collide (0 redstone-tick gap),
    // then convert each lane to relative-delay placements.
    instrumentMap.forEach((events) => {
      const lanes: {
        lastAbsoluteMicroseconds: number;
        events: UnifiedNoteEvent[];
      }[] = [];

      events.forEach((event) => {
        // Find a lane where this note would have at least 1 redstone tick of delay.
        let lane = lanes.find((l) => {
          const delta = event.absoluteMicroseconds - l.lastAbsoluteMicroseconds;
          return this.redstoneTicks(delta) > 0;
        });
        if (!lane) {
          lane = { lastAbsoluteMicroseconds: -Infinity, events: [] };
          lanes.push(lane);
        }
        lane.events.push(event);
        lane.lastAbsoluteMicroseconds = event.absoluteMicroseconds;
      });

      lanes.forEach((lane) => {
        let lastAbsoluteMicroseconds = 0;
        const placements: NoteBlockPlacement[] = [];

        lane.events.forEach((event) => {
          const delta = event.absoluteMicroseconds - lastAbsoluteMicroseconds;
          placements.push({
            redstoneTickDelay: this.redstoneTicks(delta),
            block: event.block,
            pitch: event.pitch,
            note: event.note,
            instrument: event.instrument,
            trackIndex: event.trackIndex,
            trackName: event.trackName,
          });
          lastAbsoluteMicroseconds = event.absoluteMicroseconds;
        });

        this.blockSequences.push(placements);
      });
    });

    return this.blockSequences;
  }
}

export default function generateBlockSequences(
  midi: MidiFile,
  blockPallette: BlockPallette
): NoteBlockPlacement[][] {
  const translator = new MidiToBlockTranslator(midi, blockPallette);
  return translator.translate();
}
