# midi-to-minecraft

> Note: This project is based on the original midi-to-minecraft repository by colinthesealion: https://github.com/colinthesealion/midi-to-minecraft/tree/master

Convert `.midi` files into Minecraft note block JSON build data, and visualize each track as a horizontal noteblock lane.

## Project Layout

- `midi-convert/`: TypeScript MIDI-to-JSON converter CLI.
- `webapp/`: Static React website for in-browser conversion and visualization.

## Requirements
- Node.js >= 18

## Use The Website (Static React App)

The web app is in `webapp/` and is now a Vite React app that builds to a static SPA.

### Local

```bash
cd webapp
yarn
yarn dev
```

Then open the local Vite URL shown in terminal.

### Static Build Output

```bash
cd webapp
yarn build
```

The static SPA files are generated in `webapp/dist/`.

### GitHub Pages

1. Push this repo.
2. Build the web app (`cd webapp && yarn build`).
3. Deploy `webapp/dist/` as a static site.
4. Open your `github.io` URL.

### Web App Workflow

1. Upload a `.mid` or `.midi` file.
2. Click `Convert`.
3. Download generated JSON files (one per track when multi-track).
4. View per-track horizontal visualization:
   - each track has its own line,
   - repeaters are inserted before notes based on `redstoneTickDelay`,
   - support block is shown under each noteblock.

## CLI Usage (Optional)

If you want terminal conversion:

```bash
cd midi-convert
yarn
yarn convert -i <input.mid> -o <output.json>
```

`yarn convert` automatically runs a build before conversion, so you can use it directly after `yarn`.

Output behavior:
- If `-o` is just a filename (no directory), files are written to `output/` inside `midi-convert/`.
- Single-track MIDI: writes to the resolved output path.
- Multi-track MIDI: writes one file per track using `<name>.<track-index><ext>`.

## Known Issue

- MIDI files can have up to 16 simultaneous sounds; currently only 2 of them will play at once, the others are ignored.
