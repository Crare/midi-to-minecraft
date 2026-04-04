import { MidiFile } from 'midifile-ts';

import { Instrument, Drum, BlockPallette } from './types.js';

export { instrumentByPatchId };

const instrumentByPatchId: Record<number, string> = {};

function applyDefaultNamespaceToValue([key, block]: [number, string]): [number, string] {
    return [key, `minecraft:${block}`];
}

function applyDefaultNamespaceToKey([key, value]: [string, string]): [string, string] {
    return [`minecraft:${key}`, value];
}

export const instrumentByBlock = new Map(([
    ['acacia_log', 'bass'],
    ['sand', 'snare'],
    ['glass', 'hat'],
    ['stone', 'basedrum'],
    ['gold_block', 'bell'],
    ['clay', 'flute'],
    ['packed_ice', 'chime'],
    ['white_wool', 'guitar'],
    ['bone_block', 'xylophone'],
    ['iron_block', 'iron_xylophone'],
    ['soul_sand', 'cow_bell'],
    ['pumpkin', 'didgeridoo'],
    ['emerald_block', 'bit'],
    ['hay_block', 'banjo'],
    ['glowstone', 'pling'],
    ['copper_block', 'trumpet'],
    ['exposed_copper', 'trumpet_exposed'],
    ['weathered_copper', 'trumpet_weathered'],
    ['oxidized_copper', 'trumpet_oxidized'],
    ['dirt', 'harp'],
] as [string, string][]).map(applyDefaultNamespaceToKey));

export const defaultInstrumentBlock = 'minecraft:dirt';
export const blockByPatchId = new Map(([
    // electric pianos
    [  2, 'glowstone'],
    [  4, 'glowstone'],
    [  5, 'glowstone'],
    // celesta
    [  8, 'iron_block'],
    // glockenspiel
    [  9, 'gold_block'],
    // music box
    [ 10, 'iron_block'],
    // vibraphone
    [ 11, 'iron_block'],
    // marimba
    [ 12, 'iron_block'],
    // xylophone
    [ 13, 'bone_block'],
    // tubular bells
    [ 14, 'gold_block'],
    // Guitars
    [ 24, 'white_wool'],
    [ 25, 'white_wool'],
    [ 26, 'white_wool'],
    [ 27, 'white_wool'],
    [ 28, 'white_wool'],
    [ 29, 'white_wool'],
    [ 30, 'white_wool'],
    [ 31, 'white_wool'],
    // Basses
    [ 32, 'acacia_log'],
    [ 33, 'acacia_log'],
    [ 34, 'acacia_log'],
    [ 35, 'acacia_log'],
    [ 36, 'acacia_log'],
    [ 37, 'acacia_log'],
    [ 38, 'acacia_log'],
    [ 39, 'acacia_log'],
    // Brass
    [ 56, 'copper_block'],
    [ 57, 'weathered_copper'],
    [ 58, 'weathered_copper'],
    [ 59, 'exposed_copper'],
    [ 60, 'copper_block'],
    [ 61, 'copper_block'],
    [ 62, 'exposed_copper'],
    [ 63, 'exposed_copper'],
    // Pipes
    [ 72, 'clay'],
    [ 73, 'clay'],
    [ 74, 'clay'],
    [ 75, 'clay'],
    [ 76, 'clay'],
    [ 77, 'clay'],
    [ 78, 'clay'],
    [ 79, 'clay'],
    // square wave
    [ 80, 'emerald_block'],
    // banjo
    [105, 'hay_block'],
    // tinkle bell
    [112, 'packed_ice'],
] as [number, string][]).map(applyDefaultNamespaceToValue));

export const defaultPercussiveBlock = 'minecraft:sand';
export const blockByPercussiveNote = new Map(([
    // bass drums
    [35, 'stone'],
    [36, 'stone'],
    // snare drums
    [38, 'sand'],
    [40, 'sand'],
    // hi-hats
    [42, 'glass'],
    [44, 'glass'],
    [46, 'glass'],
    // cowbell
    [56, 'soul_sand'],
] as [number, string][]).map(applyDefaultNamespaceToValue));

export default function getBlockPallette(midi: MidiFile): BlockPallette {
    const instruments = new Map<number, Instrument>();
    const drums = new Map<number, Drum>();
    midi.tracks.forEach(track => {
        track.forEach(event => {
            if (
                event.type === 'channel'
                && event.subtype === 'programChange'
            ) {
                const patchId = event.value;
                if (!instruments.has(patchId)) {
                    const instrument = instrumentByPatchId[patchId];
                    const block = blockByPatchId.get(patchId) || defaultInstrumentBlock;
                    instruments.set(patchId, { instrument, block });
                }
            }
            else if (
                event.type === 'channel'
                && event.channel === 9
                && event.subtype === 'noteOn'
            ) {
                const note = event.noteNumber;
                if (!drums.has(note)) {
                    drums.set(
                        note,
                        {
                            block: blockByPercussiveNote.get(note) || defaultPercussiveBlock,
                        }
                    );
                }
            }
        });
    });
    return {
        instruments,
        drums,
    };
}
