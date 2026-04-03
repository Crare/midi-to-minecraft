# midi-to-minecraft

> Note: This project is based on the original midi-to-minecraft repository by colinthesealion: https://github.com/colinthesealion/midi-to-minecraft/tree/master

Convert a `.midi` file into a series of note blocks.

## Requirements
- [fabric-carpet](https://github.com/gnembon/fabric-carpet) >= 1.4.22
- Node.js >= 18

## Build

```bash
npm install
npm run build
```

## Usage

The first stage is a Node CLI that converts a `.midi` file into JSON-encoded note block placement data:
```bash
npm run convert -- -i <input.mid> -o <output.json>

Usage: dist/index.js [options]

Options:
  -i, --input <path>   input midi file path (required)
  -o, --output <path>  output json file path (required)
  -h, --help           display help for command
```

`npm run convert` automatically runs a build before conversion, so you can use it directly after `npm install`.

Output behavior:
- If `-o` is just a filename (no directory), files are written to `output/`.
- Single-track MIDI: writes to the resolved output path.
- Multi-track MIDI: writes one file per track using `<name>.<track-index><ext>`.

The second stage uses [scarpet](https://github.com/gnembon/scarpet) to place a series of blocks in your world to execute the series of note blocks as a redstone contraption. To complete this stage, you will need to [install](https://github.com/gnembon/fabric-carpet/wiki/Installing-carpet-scripts-in-your-world) the `scripts/build_song.sc` scarpet app in your world. You will also need to move the JSON file into `.minecraft/config/carpet/scripts/shared/`.

Once the script is installed, in your minecraft world, with OP:
```
\script load build_song
\script invokepoint build_song ~ ~ ~ [filename] [y-offset]
```
Where `filename` is the name of the JSON file without the `.json` extension and `y-offset` is how far from the player vertically you would like to build the contraption (negative values for beneath the player are typical). This value is useful in order to ensure that the player can hear a contraption built underground.

## Known Issues
* MIDI files can have up to 16 simultaneous sounds; currently only 2 of them will play at once, the others will be ignored.
* The shape of the redstone contraption should be more or less the lower half of a sphere, but currently the starting point is not accurately calculated.
* The repeat mode lever does not work without adding some redstone wire between the end and the start of the song. These blocks should also be placed by the scarpet app.
* We use 45 as the radius that the player can hear a note block, rather than the actual value of 48. This radius should be parameterized.
* JSON filenames do not support the space character. This is a limitation in fabric-carpet.
