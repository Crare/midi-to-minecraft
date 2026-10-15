# AGENTS.md

Guidance for AI coding agents working in this repository.

## Instructions

Code should be secure, easy to read and understand, expandable, accessible and tested. Use common good coding practices and use existing architecture decisions.

## Project

Converts MIDI files into Minecraft note block build data, entirely in the browser. It has a canvas track visualization with playback and a canvas top-down schematic.

- `webapp/` — React 19 + Vite + TypeScript (strict). This is where almost all work happens.
- `midi-convert/` — standalone TypeScript CLI converter.
- `openspec/` — OpenSpec change proposals.
- `.github/workflows/` — `ci.yml` (typecheck, tests, build, audit, outdated) and `deploy.yml` (GitHub Pages from `main`).

## Commands

Run from `webapp/` with **yarn** (not npm):

```sh
yarn install --frozen-lockfile
yarn dev          # http://127.0.0.1:5173/midi-to-minecraft/
yarn typecheck    # tsc --noEmit
yarn lint         # eslint (react-hooks rules)
yarn test         # vitest run
yarn build        # typecheck + vite build
```

Before finishing a change, `yarn typecheck`, `yarn lint`, `yarn test` and `yarn build` must pass.

TypeScript is pinned to 6.0.x because typescript-eslint does not support TS 7 yet.

## Code layout (`webapp/src`)

- `App.tsx` — page layout and state wiring.
- `utils.ts`, `types.ts`, `constants.ts` — conversion logic and shared domain types.
- `audio/` — Web Audio note scheduling and sounds.
- `components/` — `UploadPanel`, `JsonOutputPanel`, `ExamplePanel`, `VisualizationPanel`, `SchematicPanel`, plus shared `CollapsiblePanel`.
- `styles.css` — all styling (single file, CSS variables in `:root`).
- `__tests__/` — Vitest tests, fixtures and snapshots.

Domain facts: 1 redstone tick = 0.1 s (`redstoneTickDurationMs`). Chords stack from the lane top at 10px per note.

## Rules

- **Tests:** snapshots in `src/__tests__/__snapshots__/` are a refactor safety net. Never run `vitest -u` to make a failure go away; a snapshot change must be intentional and explained.
- **Vite and Vitest move together** (Vitest 5 needs a recent Vite); needs Node >= 20.19. Don't bump one without the other.
- **Licensing:** do not add MIDI files or other assets with unknown or restrictive licences. Test fixtures are `example.mid` plus synthetic MIDI built in the tests. Textures are generated SVGs.
- **Accessibility (WCAG 2.2 AA) is a requirement:**
  - Keep text contrast at 4.5:1 or better, and keep the visible focus ring.
  - Controls need accessible names and keyboard support, and touch targets are about 44px.
  - Canvases are keyboard-focusable. The playhead is a slider.
  - Respect `prefers-reduced-motion`.
  - Check UI changes with axe-core and a keyboard pass.
- **Audio timing:** notes are scheduled ahead on the Web Audio clock through a shared compressor bus. Don't move scheduling back onto `setTimeout`/animation-frame timing.
- Keep changes surgical, match the existing style, and comment only code that needs clarification.

## Git and PRs

- Never stage, commit, push or open a PR unless the user explicitly asks.
- Work on a feature branch; PRs target `main`. Include a ticket number in branch and commit text only when one is known.
- Add this trailer to commits:
  `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`
- This repo lives under `~/git/personal/`, so use Crare's GitHub account.
