import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildBedrockMcpack } from '../components/SchematicPanel/exportMcpack';
import { buildTickGrid } from '../components/SchematicPanel/schematicData';
import type { NoteEvent, TrackEvents } from '../types';

const track: TrackEvents = {
  id: 'harp',
  title: 'harp',
  events: [
    {
      time: 0,
      endTime: 0.1,
      block: 'minecraft:dirt',
      pitch: 'C',
      note: 7,
      instrument: 'harp',
      trackIndex: 0,
      trackName: 'harp'
    } satisfies NoteEvent
  ]
};

describe('Bedrock mcpack export', () => {
  it('creates an importable behavior pack containing the schematic function and instructions', async () => {
    const archive = await buildBedrockMcpack(buildTickGrid([track]));
    const zip = await JSZip.loadAsync(archive);
    const manifestFile = zip.file('manifest.json');
    const functionFile = zip.file('functions/schematic.mcfunction');
    const readmeFile = zip.file('README.txt');

    expect(manifestFile).not.toBeNull();
    expect(functionFile).not.toBeNull();
    expect(readmeFile).not.toBeNull();

    const manifest = JSON.parse(await manifestFile!.async('string'));
    expect(manifest.format_version).toBe(2);
    expect(manifest.modules).toHaveLength(1);
    expect(manifest.modules[0].type).toBe('data');
    expect(manifest.header.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    expect(manifest.modules[0].uuid).toMatch(/^[0-9a-f-]{36}$/i);
    expect(manifest.header.uuid).not.toBe(manifest.modules[0].uuid);

    const buildFunction = await functionFile!.async('string');
    expect(buildFunction).toContain('minecraft:noteblock');
    expect(buildFunction).toContain('# Tune note block');
    expect(await readmeFile!.async('string')).toContain('/function schematic');
  });
});
