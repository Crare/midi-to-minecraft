# Data Flow

This document explains how data moves through the midi-to-minecraft system.

1. **Input**: User uploads a MIDI file (webapp/src/UploadPanel/).
2. **Conversion**: midi-convert/src/ parses the MIDI and generates block sequences and schematic data.
3. **Output**: Results are saved as JSON files (midi-convert/output/) and made available for download in the webapp.
4. **Visualization**: webapp/src/VisualizationPanel/ and SchematicPanel/ display the results interactively.

Refer to architecture.md for component responsibilities.
