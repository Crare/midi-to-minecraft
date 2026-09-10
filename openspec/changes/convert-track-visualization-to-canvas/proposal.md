## Why

The current HTML-based track visualization creates performance issues during MIDI playback. The virtualization system generates large numbers of DOM elements, causing jitter and freezing when playing longer tracks. This degrades the user experience and makes the visualization difficult to use as a real-time playback tool. Converting to Canvas rendering will dramatically reduce DOM overhead, enable stable 60fps animation, and provide smooth, responsive playback visualization.

## What Changes

- Replace virtualized HTML rendering (flex containers, binary search, DOM spacers) with Canvas-based rendering pipeline
- Canvas renders note blocks, grid lines, track backgrounds, color indicators, and badges directly
- Keep HTML layer for track headers, mute buttons, playhead control, and tooltip overlays
- Eliminate TrackRow virtualization component and binary search culling logic (no longer needed with Canvas)
- Preserve all playback audio logic, timing, and interaction behavior
- Add Canvas hit detection for note clicking and playhead dragging
- Support same track data structure and visualization modes (instrument vs. track grouping)

## Capabilities

### New Capabilities

- `visualization/canvas-track-renderer`: Canvas-based rendering pipeline for MIDI track visualization with 60fps smooth animation, supporting note blocks with colors, grid lines, badges, and corner indicators. Includes hit detection for note clicking and playhead position tracking.

### Modified Capabilities

<!-- No existing capability specs are changing; this is a new visualization approach -->

## Impact

**Affected Components:**

- `webapp/src/components/VisualizationPanel/` — Main component refactored to use Canvas instead of virtualized HTML
- `webapp/src/components/VisualizationPanel/TrackRow.jsx` — Removed (no longer needed)
- `webapp/src/utils.jsx` — Audio playback logic reused (no changes)

**No Breaking Changes:**

- User-facing API and interactions remain the same (play/stop, scrubbing, muting, clicking notes)
- Audio playback timing and accuracy unchanged
- View modes (instrument/track grouping) preserved
- Mobile/responsive behavior maintained

**Performance Impact:**

- Eliminates DOM-heavy virtualization (hundreds of elements → single Canvas element)
- Target: 60fps smooth playback without jitter or freezing
- Reduced memory footprint during playback
- Faster scroll/pan interactions
