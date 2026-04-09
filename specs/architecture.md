# Architecture Overview

This document describes the high-level architecture of the midi-to-minecraft project.

## Main Components

- **midi-convert/**: Handles MIDI file parsing and conversion to Minecraft-compatible formats.
- **webapp/**: Provides the user interface for uploading MIDI files, visualizing, and downloading results.
- **agents/**: (planned) Specialized modules for automation, code generation, or data transformation.

## Data Flow

1. User uploads a MIDI file via the webapp.
2. The file is processed by scripts in midi-convert/ to generate Minecraft schematic data.
3. Results are visualized and made available for download in the webapp.

See data-flow.md for more details.
