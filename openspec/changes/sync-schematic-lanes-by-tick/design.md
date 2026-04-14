# Design: Tick-synchronized schematic rendering

## Data Structure

- The schematic will be represented as an array of columns, each column representing a tick.
- Each column contains an array of cells, one per lane (instrument), where each cell is a note, repeater, dust, split, or empty.
- The tick header row is generated directly from the tick indices.

## Algorithm

- Refactor buildTracks (and related) logic to iterate from tick 0 to lastTick.
- For each tick, for each lane, determine the correct cell type:
  - If a note is played at this tick, cell is a note (with split if needed).
  - If a delay is needed, cell is a repeater.
  - If the lane has no event at this tick: add dust if it's the first lane of the instrument, otherwise add an empty cell, to keep all lanes in sync.
  - If multiple lanes have notes at the same tick, mark as split.
  - Otherwise, cell is empty.
- Output is a 2D array: columns (ticks) × rows (lanes), with cell type and tick info.

## Rendering

- Update schematic rendering components to consume the new column-major, tick-synchronized data structure.
- The tick header is simply the tick index.

## Testing

- Add/adjust tests to verify that all lanes are always synchronized and that the schematic renders correctly for various MIDI inputs.
