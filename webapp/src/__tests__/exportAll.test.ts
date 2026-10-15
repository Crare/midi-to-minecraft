import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildExportAllArchive } from '../components/JsonOutputPanel/buildExportAll';
import { buildCompactGrid, buildTickGrid } from '../components/SchematicPanel/schematicData';
import type { NoteEvent, TrackEvents } from '../types';

const tracks: TrackEvents[] = [
  {
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
  }
];

describe('Export all archive', () => {
  it('contains JSON, all spreadsheet formats, both editions and views, and both Bedrock packs', async () => {
    const archive = await buildExportAllArchive({
      outputPrefix: 'song',
      jsonFiles: [{ name: 'output/song.json', data: [] }],
      spreadsheetGrid: buildTickGrid(tracks),
      fullGrid: buildTickGrid(tracks),
      compactGrid: buildCompactGrid(tracks)
    });
    const zip = await JSZip.loadAsync(archive);
    const names = Object.keys(zip.files);

    expect(names).toContain('song.json');
    expect(names).toContain('song-schematic.xlsx');
    expect(names).toContain('song-schematic.ods');
    expect(names).toContain('song-schematic.csv');
    expect(names).toContain('song-function-java-full.mcfunction');
    expect(names).toContain('song-function-java-compact.mcfunction');
    expect(names).toContain('song-function-bedrock-full.mcfunction');
    expect(names).toContain('song-function-bedrock-compact.mcfunction');
    expect(names).toContain('song-schematic-bedrock-full.mcpack');
    expect(names).toContain('song-schematic-bedrock-compact.mcpack');

    const functionText = await zip
      .file('song-function-java-full.mcfunction')!
      .async('string');
    expect(functionText).toContain('minecraft:note_block[instrument=harp,note=7]');

    const mcpack = await JSZip.loadAsync(
      await zip.file('song-schematic-bedrock-full.mcpack')!.async('blob')
    );
    expect(mcpack.file('manifest.json')).not.toBeNull();
    expect(mcpack.file('functions/schematic.mcfunction')).not.toBeNull();
  });
});
