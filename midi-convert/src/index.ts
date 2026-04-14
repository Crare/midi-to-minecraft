import { Command } from 'commander';
import fs from 'fs';
import { read } from 'midifile-ts';
import path from 'path';

import generateBlockSequences from './generate-block-sequence.js';
import getBlockPallette from './instrument-blocks.js';

const program = new Command();
program
  .name('midi-to-minecraft')
  .description('Convert a MIDI file into Minecraft note block placement JSON')
  .requiredOption('-i, --input <path>', 'input midi file path')
  .requiredOption('-o, --output <path>', 'output json file path')
  .parse(process.argv);

const options = program.opts<{ input: string; output: string }>();
const parsedOutput = path.parse(options.output);
const outputDir = parsedOutput.dir || 'output';
const normalizedOutput = path.join(outputDir, parsedOutput.base);

fs.mkdirSync(outputDir, { recursive: true });

const data = fs.readFileSync(options.input);
const midi = read(data);

const blockPallette = getBlockPallette(midi);
const blockSequences = generateBlockSequences(midi, blockPallette);
if (blockSequences.length === 0) {
  console.error(`No tracks found in ${options.input}`);
  process.exit(1);
} else if (blockSequences.length === 1) {
  fs.writeFileSync(
    normalizedOutput,
    JSON.stringify(blockSequences[0], undefined, 2)
  );
  console.log(`Note block sequence written to ${normalizedOutput}`);
} else {
  const { dir, name, ext } = path.parse(normalizedOutput);
  blockSequences.forEach((blockSequence, i) => {
    const filename = path.join(dir, `${name}.${i}${ext}`);
    fs.writeFileSync(filename, JSON.stringify(blockSequence, undefined, 2));
    console.log(
      `Note block sequence for track ${i + 1} written to ${filename}`
    );
  });
}
