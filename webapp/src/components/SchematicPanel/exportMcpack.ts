import JSZip from 'jszip';
import type { TickGrid } from '../../types';
import { buildMinecraftFunction } from './exportMinecraft';

function createManifest() {
  return {
    format_version: 2,
    header: {
      name: 'MIDI to Minecraft Schematic',
      description: 'Builds a note-block schematic. Enable this behavior pack and run /function schematic at the build origin.',
      uuid: crypto.randomUUID(),
      version: [1, 0, 0],
      min_engine_version: [1, 20, 0]
    },
    modules: [
      {
        type: 'data',
        uuid: crypto.randomUUID(),
        version: [1, 0, 0]
      }
    ]
  };
}

/** Package the Bedrock function as an importable behavior pack. */
export async function buildBedrockMcpack(grid: TickGrid): Promise<Blob> {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(createManifest(), null, 2));
  zip.file('functions/schematic.mcfunction', buildMinecraftFunction(grid, 'bedrock'));
  zip.file(
    'README.txt',
    [
      'MIDI to Minecraft Schematic behavior pack',
      '',
      '1. Import this .mcpack into Minecraft Bedrock Edition.',
      '2. Enable the behavior pack in the target world settings.',
      '3. Stand at the ground-level build origin and run: /function schematic',
      '',
      'The function places the support blocks and schematic relative to its execution position.',
      'Bedrock commands cannot tune note blocks; set each note block to the pitch shown in the function comments.'
    ].join('\n')
  );
  return zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}
