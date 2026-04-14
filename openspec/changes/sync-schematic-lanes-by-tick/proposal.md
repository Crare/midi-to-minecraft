# Proposal: Synchronize schematic rendering by tick

## What & Why

The schematic rendering must ensure that all instrument lanes (notes, repeaters, dusts, splits) are perfectly synchronized, with each column representing a single tick. For every tick, each lane must have a cell (note, repeater, dust, split, or empty), and the tick header should clearly indicate the current tick. This will make the schematic easier to read, reason about, and edit, and will prevent desynchronization bugs.

Currently, the buildTracks logic does not guarantee tick-by-tick alignment, which can lead to misaligned or confusing schematics. Refactoring to a tick-major, column-by-column approach will ensure all lanes are always in sync.
