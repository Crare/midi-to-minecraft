# Tasks: Tick-synchronized schematic rendering

- Refactor buildTracks logic to construct schematic data column-by-column, tick-by-tick.
- Update schematic data types and interfaces to support the new structure.
- Refactor schematic rendering components to consume the new data format.
- Update tick header rendering to match the new tick-based columns.
- Ensure all cell types (note, repeater, dust, split, empty) are handled for every lane and tick.
- Add/adjust unit and integration tests for schematic synchronization and rendering.
- Update documentation/specs as needed to reflect the new schematic structure.
