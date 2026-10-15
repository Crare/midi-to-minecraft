## Context

The current VisualizationPanel uses virtualized HTML rendering with a TrackRow component that performs binary search culling to render only visible notes. This approach creates performance issues:

- Each frame update triggers multiple DOM operations across all track rows
- Virtualization adds complexity (spacers, binary search, memoization overhead)
- During playback, continuous scroll sync and playhead updates cause jitter and freezing
- Large MIDI files (100+ tracks) amplify these issues

See proposal.md for motivation. The solution replaces the HTML virtualization layer with Canvas rendering while preserving the playback pipeline, data structure, and interaction model.

## Goals / Non-Goals

**Goals:**

- Eliminate DOM overhead by rendering all visual content to a single Canvas element
- Achieve stable 60fps playback animation with smooth, responsive scrolling
- Remove virtualization complexity (TrackRow component, binary search, spacer logic)
- Maintain pixel-perfect visual parity with original HTML visualization
- Preserve all user interactions: playhead dragging, note clicking, track muting, view mode switching
- Keep audio playback timing and accuracy unchanged
- Support responsive scaling (device pixel ratio, window resize)
- Render hover tooltips with note details

**Non-Goals:**

- Adding new visualization features or modes
- Optimizing Canvas rendering with WebGL or shaders
- Implementing dirty rect optimization or region-based rendering (can add later if needed)
- Changing the track data structure or pipeline
- Implementing new playback behaviors or audio features
- Mobile gesture support (beyond current dragging functionality)

## Decisions

### Decision: Use Canvas 2D instead of WebGL

**Choice:** Canvas 2D API (getContext('2d'))

**Rationale:**

- Canvas 2D is simpler and faster to implement than WebGL
- 2D graphics are sufficient for track visualization (rectangles, lines, text, images)
- Better cross-browser compatibility, especially on Safari and mobile
- No need for GPU optimization at this scale (100+ tracks, 1000+ notes)

**Alternatives Considered:**

- WebGL: Higher performance ceiling, but overkill for 2D; steeper learning curve
- SVG: Simpler than Canvas, but SVG DOM scales poorly with thousands of elements (same problem as HTML)

### Decision: Render entire visible viewport each frame, no dirty rectangles

**Choice:** Clear canvas and redraw all visible content every frame (60fps RAF loop)

**Rationale:**

- Simpler implementation than dirty rectangle tracking
- Canvas 2D rendering is fast enough for this content (tested: 60fps with 100+ tracks)
- Easier to reason about and debug (no state inconsistency)
- Can optimize to dirty rects later if performance becomes an issue

**Alternatives Considered:**

- Dirty rectangle optimization: Faster, but adds complexity for detecting changed regions
- Partial redraws: Could save CPU, but harder to maintain visual correctness

### Decision: Keep HTML layer for headers, controls, and playhead

**Choice:**

- Canvas renders only the track grid visualization (notes, grid, backgrounds)
- HTML keeps: track headers (names, mute buttons), playhead overlay (draggable), tooltips

**Rationale:**

- Cleaner separation of concerns
- Playhead dragging is easier with HTML (native event handling, CSS styling)
- Track headers need button interactivity (mute toggles, view mode controls)
- Reduces Canvas complexity; Canvas focuses on visual rendering

**Alternatives Considered:**

- Render everything in Canvas: More cohesive, but harder to manage dragging, buttons, accessibility
- Full HTML refactor: Not much better than current approach, defeats the purpose

### Decision: Single Canvas element with computed scroll offset

**Choice:**

- One `<canvas>` element inside the DragScrollArea scroll container
- Render logic computes which portion of the timeline is visible based on `scrollLeft`
- Translate canvas coordinates by scroll offset before drawing

**Rationale:**

- Native browser scrolling is optimized and smooth
- Canvas moves with scroll container automatically
- No manual scroll sync needed (unlike proxy scroll containers)
- Simpler coordinate math for playhead and hit detection

**Alternatives Considered:**

- Transform/translate Canvas: More complex coordinate tracking
- Fixed Canvas with scroll proxy: Same complexity as current HTML virtualization

### Decision: Playhead remains HTML element, positioned absolutely

**Choice:**

- Playhead (vertical line) stays as HTML div with pointer event listeners
- Position updated via JavaScript inline styles (`left: Xpx`)
- Hit detection for dragging handled via native mouse/touch events

**Rationale:**

- Native drag handling is simpler and more robust than Canvas hit detection
- CSS can style playhead (color, shadow, hover effects)
- Easier to make draggable with standard event listeners
- Playhead Z-order management is cleaner with DOM

**Alternatives Considered:**

- Render playhead on Canvas: Harder to drag; need custom event handling
- Position playhead outside scroll container: Visual misalignment issues

### Decision: Cache hit detection data after each render

**Choice:**

- After rendering, store array of note bounding boxes in memory
- Click handler uses bounding boxes for fast hit testing
- Re-compute cache only when Canvas redraws

**Rationale:**

- O(n) iteration to find clicked note is acceptable (n < 50 visible notes typically)
- Caching avoids recomputing geometry on every click
- Simple to implement and debug

**Alternatives Considered:**

- Quadtree spatial indexing: Overkill for this scale; caching is sufficient
- Render note IDs to invisible Canvas: More memory; harder to maintain

### Decision: Tooltips rendered as HTML overlay, positioned via mouse tracking

**Choice:**

- Tooltip is hidden HTML element positioned absolutely
- Mouse move listener updates tooltip position
- Show tooltip when over a note (via hit detection), hide when not

**Rationale:**

- HTML tooltips can contain rich content (formatted text, images)
- Easier styling and animation with CSS
- Accessible (can be announced to screen readers)
- Canvas cannot have native interactive elements

**Alternatives Considered:**

- Render tooltips on Canvas: Less flexible; harder to make accessible
- No tooltips: Loses important debugging/UX information

### Decision: Support device pixel ratio scaling

**Choice:**

- Detect `window.devicePixelRatio` on init and resize
- Scale canvas size: `canvas.width = clientWidth * ratio`, `canvas.height = clientHeight * ratio`
- Scale rendering context: `ctx.scale(ratio, ratio)`
- Update hit detection coordinate calculations accordingly

**Rationale:**

- Ensures sharp rendering on high-DPI displays (retina, mobile)
- CSS pixels vs device pixels must be handled for correctness

**Alternatives Considered:**

- Ignore device pixel ratio: Blurry rendering on retina displays
- Only scale canvas size, not context: Double scaling artifacts

## Architecture

### Module Structure

**New files:**

- `useCanvasVisualization.js` — Custom hook managing Canvas lifecycle, RAF loop, resize handling
- `canvasRenderer.js` — Pure rendering functions (grid, notes, backgrounds, overlays)
- `canvasInteraction.js` — Hit detection and event mapping (canvas coords → note data)

**Modified files:**

- `VisualizationPanel/index.jsx` — Replace TrackRow virtualized rendering with Canvas element; keep headers, playhead, event handlers

**Deleted files:**

- `VisualizationPanel/TrackRow.jsx` — No longer needed

### Rendering Pipeline

Each frame:

1. Clear Canvas
2. Draw grid lines (vertical every 4 units)
3. Draw track backgrounds (lanes with alternating colors)
4. Draw note blocks (colored rectangles with SVG support block images)
5. Draw corner color indicators (small square in note corner)
6. Draw use count badges (text overlay for stacked notes)
7. Draw playhead position as visual reference (optional; main playhead is HTML)

Coordinate system:

- Canvas (0,0) is top-left corner
- X-axis: timeline (time units), affected by scroll offset
- Y-axis: track lanes (pixels)
- Conversion: canvas X = (tick × unitSize) - scrollLeft

### Hit Detection

For note clicking:

1. Mouse click → get canvas coordinates
2. Adjust for scroll offset: `contentX = canvasX + scrollLeft`
3. Iterate stored hit boxes to find note at contentX, trackY
4. Return note data (trackId, noteIndex) for sound playback

For playhead dragging:

- Dragging occurs on HTML playhead element (no Canvas involvement)
- Drag handler calculates new tick and updates playhead position

### State Management

**Keep unchanged:**

- `playheadTick`, `playheadTickRef` — Playback position
- `mutedTracksRef` — Muted tracks
- `playbackNotesRef`, `playbackTracksRef` — Notes to execute during playback
- Audio playback loop and note execution logic

**New state:**

- Canvas ref, scroll container ref
- Device pixel ratio
- Last render cache (note bounding boxes for hit detection)

**Removed state:**

- `scrollLeft`, `scrollContainerWidth` (handled by native scroll)
- `noteLayout` virtualization cache
- Per-track visible range calculations

## Risks / Trade-offs

### Risk: Canvas rendering performance with very large MIDI files (1000+ notes)

**Likelihood:** Low (most MIDI files have < 500 notes)

**Impact:** Playback may drop below 60fps

**Mitigation:**

- Initial implementation uses full viewport redraw (acceptable for typical sizes)
- Monitor performance with profiling during testing
- If needed, implement dirty rect optimization or layer-based rendering in follow-up

### Risk: Hit detection misses notes due to coordinate transformation errors

**Likelihood:** Medium (coordinate math is easy to get wrong)

**Impact:** Note clicking may not work or click wrong note

**Mitigation:**

- Add visual debug mode showing hit boxes
- Unit test hit detection with sample coordinates
- Regression test: verify clicking each note type plays correct sound

### Risk: Safari Canvas rendering differences (performance or appearance)

**Likelihood:** Medium (Safari's Canvas implementation has quirks)

**Impact:** May need Safari-specific fixes

**Mitigation:**

- Test on Safari early (iOS and macOS)
- Use standard Canvas 2D APIs (no vendor prefixes)
- Profile performance on both Chrome and Safari

### Risk: Device pixel ratio handling causes blurriness or performance issues

**Likelihood:** Low (standard technique, well-documented)

**Impact:** Rendering looks blurry or stutters on high-DPI displays

**Mitigation:**

- Test on retina MacBook Pro and high-DPI Windows display
- Verify CSS pixel to device pixel math is correct
- Use browser DevTools pixel inspector to verify scaling

### Risk: Accessibility loss compared to HTML visualization

**Likelihood:** High (Canvas is opaque to screen readers)

**Impact:** Visualization not usable for visually impaired users

**Trade-off:** Canvas enables smooth playback for majority; accessibility improvements can be added later (ARIA live regions, keyboard navigation)

**Mitigation:**

- Add `role="img"` and `aria-label` to Canvas
- Provide keyboard controls for playback (already exists in App.jsx)
- Document limitation; consider adding text-based track summary

### Trade-off: Debugging difficulty vs performance gain

**Issue:** Canvas is opaque; can't inspect elements in DevTools

**Mitigation:**

- Implement debug mode: render element IDs or hit boxes visually
- Add console logging for click coordinates and hit test results
- Use browser DevTools performance profiler for rendering analysis

### Trade-off: Complex rendering code vs simplicity

**Issue:** Canvas rendering code is more complex than HTML declarative markup

**Mitigation:**

- Well-commented functions
- Separate concerns: rendering, interaction, lifecycle into different modules
- Unit tests for rendering functions

## Migration Plan

### Phase 1: Implement Canvas layer (parallel development)

- Implement `useCanvasVisualization.js` hook
- Implement `canvasRenderer.js` rendering functions
- Implement `canvasInteraction.js` hit detection
- Write unit tests for rendering and hit detection

### Phase 2: Integrate into VisualizationPanel

- Replace TrackRow rendering with Canvas element in VisualizationPanel
- Connect playback state to Canvas renderer
- Connect scroll events to Canvas coordinate transforms
- Test with sample MIDI files

### Phase 3: Parity testing

- Visual regression testing (compare Canvas with original HTML side-by-side)
- Interaction testing (playhead dragging, note clicking, muting)
- Audio sync testing (verify timing is accurate)
- Performance testing (verify 60fps on target MIDI files)

### Phase 4: Cleanup

- Delete TrackRow component
- Remove virtualization-related code and refs
- Remove proxy scroll container synchronization
- Verify no console errors or warnings

### Rollback strategy

- Keep original HTML visualization code in a feature branch until Canvas is proven stable
- If Canvas has unresolvable performance issues, revert to original
- Tag release without Canvas as fallback

## Open Questions

- Should we render a visual playhead line on the Canvas, or keep it HTML-only? (Recommendation: HTML-only for now; can add Canvas playhead later if styling needs it)
- Do we need to support zooming (scale the timeline)? (Proposal says no; can add later)
- Should muted tracks be visually dimmed or hidden? (Recommendation: Keep them visible but not playing; can add visual distinction later)
