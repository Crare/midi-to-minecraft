import { describe, expect, it } from 'vitest';
import { buildMinecraftFunction } from '../components/SchematicPanel/exportMinecraft';
import { buildCompactGrid, buildTickGrid, toMinecraftBuildGrid } from '../components/SchematicPanel/schematicData';
import type { NoteEvent, TrackEvents } from '../types';

const event = (time: number, note: number): NoteEvent => ({
  time,
  endTime: time + 0.1,
  block: 'minecraft:dirt',
  pitch: 'C',
  note,
  instrument: 'harp',
  trackIndex: 0,
  trackName: 'harp'
});

const tracks: TrackEvents[] = [
  { id: 'harp', title: 'harp', events: [event(0, 0), event(0.2, 7)] }
];

describe('Minecraft function export', () => {
  it('exports full Java builds with supports, tuned notes, and east-facing delays', () => {
    const output = buildMinecraftFunction(toMinecraftBuildGrid(buildTickGrid(tracks)), 'java');

    expect(output).toContain('minecraft:note_block[instrument=harp,note=0]');
    expect(output).toContain('minecraft:note_block[instrument=harp,note=7]');
    expect(output).toContain('minecraft:repeater[facing=east,delay=2]');
    expect(output).toContain('setblock ~1 ~0 ~0 minecraft:dirt');
  });

  it('exports Bedrock placements with repeater states and manual pitch notes', () => {
    const output = buildMinecraftFunction(toMinecraftBuildGrid(buildTickGrid(tracks)), 'bedrock');

    expect(output).toContain('minecraft:noteblock');
    expect(output).toContain('minecraft:unpowered_repeater ["direction"=3,"repeater_delay"=1]');
    expect(output).toContain('# Tune note block at ~3 ~1 ~0 to pitch 7 (0-23).');
    expect(output).toContain('Bedrock commands cannot set note-block pitch');
  });

  it('converts Java support block IDs to Bedrock block states', () => {
    const woolTracks: TrackEvents[] = [
      { id: 'guitar', title: 'guitar', events: [{ ...event(0, 4), block: 'minecraft:white_wool', instrument: 'guitar' }] }
    ];
    const output = buildMinecraftFunction(buildTickGrid(woolTracks), 'bedrock');

    expect(output).toContain('minecraft:wool ["color"="white"]');
  });

  it('uses the compact grid when compact output is requested', () => {
    const full = buildMinecraftFunction(buildTickGrid(tracks), 'java');
    const compact = buildMinecraftFunction(buildCompactGrid(tracks), 'java');

    expect(compact.split('\n').filter((line) => line.startsWith('setblock ')).length).toBeLessThanOrEqual(
      full.split('\n').filter((line) => line.startsWith('setblock ')).length
    );
    expect(compact).toContain('minecraft:note_block[instrument=harp,note=7]');
  });
});
