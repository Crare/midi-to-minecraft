## Purpose

Provides a high-performance Canvas-based rendering engine for MIDI track visualization that delivers smooth 60fps playback animation without DOM overhead, enabling jitter-free scrubbing and playhead tracking during audio playback.

## ADDED Requirements

### Requirement: Canvas renders all visual track elements

The system SHALL render complete track visualization on a Canvas element, including note blocks, grid lines, track backgrounds, corner color indicators, and use count badges, without creating HTML elements for individual notes.

#### Scenario: Full visualization renders on Canvas

- **WHEN** visualization data is loaded and canvas is visible
- **THEN** all tracks, notes, grid lines, and decorative elements are painted on the Canvas
- **AND** the DOM contains only one Canvas element (plus header/control elements)

#### Scenario: Visual elements match original HTML appearance

- **WHEN** rendering notes on Canvas
- **THEN** note blocks display with correct instrument colors
- **AND** grid lines appear at correct intervals
- **AND** corner color indicators appear in note corners
- **AND** use count badges ("×2", "×3", etc.) display correctly

### Requirement: Canvas rendering achieves 60fps during playback

The system SHALL maintain smooth 60fps animation during MIDI playback without visible jitter or frame drops.

#### Scenario: Playback animates smoothly

- **WHEN** user starts playback of a MIDI file
- **THEN** playhead moves smoothly at 60fps (verified via browser DevTools performance profile)
- **AND** no visible stuttering or freezing occurs during playback
- **AND** main thread stays under 16.6ms per frame

#### Scenario: Large MIDI files render smoothly

- **WHEN** playing a MIDI file with 100+ tracks and 1000+ notes
- **THEN** playback remains smooth at 60fps without performance degradation

### Requirement: Playhead position updates synchronize with audio

The system SHALL update playhead position and canvas rendering synchronized with audio playback timing.

#### Scenario: Playhead follows audio position

- **WHEN** audio is playing
- **THEN** playhead position matches current audio playback time (within 100ms tolerance)
- **AND** canvas redraws to show playhead at correct position

#### Scenario: Scrubbing seeks audio accurately

- **WHEN** user drags playhead to new position
- **THEN** audio seeks to corresponding time
- **AND** canvas updates immediately to show playhead at new position

### Requirement: Canvas updates efficiently during scroll

The system SHALL render only visible track content efficiently when viewport scrolls horizontally.

#### Scenario: Horizontal scroll updates visualization

- **WHEN** user scrolls the visualization left/right
- **THEN** canvas re-renders only visible portions of the timeline
- **AND** scroll response is immediate (no lag or delay)

#### Scenario: Viewport centering during playback

- **WHEN** playback is running and playhead approaches right edge of viewport
- **THEN** visualization auto-scrolls to keep playhead centered
- **AND** centering is smooth without jarring jumps

### Requirement: Hit detection identifies notes from canvas coordinates

The system SHALL map Canvas click/pointer coordinates to note data for interaction.

#### Scenario: Clicking note plays sound

- **WHEN** user clicks on a note block in the Canvas
- **THEN** hit detection correctly identifies the note at that coordinate
- **AND** corresponding audio sound plays immediately
- **AND** tooltip appears showing note details

#### Scenario: Click on empty space does nothing

- **WHEN** user clicks on canvas area with no note
- **THEN** no sound plays
- **AND** no tooltip appears

### Requirement: Playhead dragging works smoothly

The system SHALL allow user to drag the playhead to scrub through the timeline.

#### Scenario: Dragging playhead scrubs timeline

- **WHEN** user clicks and drags playhead
- **THEN** playhead follows mouse smoothly without lag
- **AND** canvas updates to show new playhead position in real-time
- **AND** audio stops (pauses) during drag

#### Scenario: Drag completes without audio glitches

- **WHEN** user releases playhead after dragging
- **THEN** audio seeks to playhead position
- **AND** no audio artifacts or clicks occur during seek

### Requirement: Track data structure remains unchanged

The system SHALL consume the same track data format as the original HTML visualization without modifications.

#### Scenario: Existing track data works with Canvas renderer

- **WHEN** Canvas renderer receives track data from visualization pipeline
- **THEN** data structure format is unchanged
- **AND** no migration or transformation of track data is required

#### Scenario: View mode switching updates Canvas visualization

- **WHEN** user switches between instrument and track view modes
- **THEN** canvas re-renders with correct track grouping
- **AND** all notes appear in correct lanes

### Requirement: Audio playback timing is preserved

The system SHALL execute note audio playback at exact same timestamps as original implementation.

#### Scenario: Audio plays at correct time during playback

- **WHEN** MIDI file is played
- **THEN** each note's audio triggers at its specified startTick timestamp
- **AND** audio timing matches original HTML visualization (within 50ms)

#### Scenario: Muted tracks do not produce audio

- **WHEN** track is muted and playback occurs
- **THEN** no audio plays for notes in that track
- **AND** muted tracks still render visually (with visual indication)

### Requirement: Tooltip information displays for notes

The system SHALL show note details (pitch, instrument, delay, block type) when hovering over notes.

#### Scenario: Tooltip appears on hover

- **WHEN** user hovers mouse over a note block
- **THEN** tooltip appears near cursor showing note details
- **AND** tooltip contains: block type, pitch, instrument, redstone tick delay
- **AND** tooltip is positioned to not obscure the note

#### Scenario: Tooltip hides when mouse leaves note

- **WHEN** user moves mouse away from note
- **THEN** tooltip disappears immediately

### Requirement: Device pixel ratio and screen scaling is handled

The system SHALL render sharply on high-DPI displays (retina, 2x/3x scale).

#### Scenario: Retina display rendering is sharp

- **WHEN** canvas renders on device with 2x or 3x pixel ratio
- **THEN** visual elements appear crisp and sharp (not blurry)
- **AND** canvas size is adjusted for device pixel ratio

#### Scenario: Responsive to window resize

- **WHEN** browser window is resized
- **THEN** canvas redraws to fill new viewport
- **AND** visualization content scales/reflows appropriately

### Requirement: Canvas element is accessible within page

The system SHALL integrate Canvas as a standard element within the existing VisualizationPanel component.

#### Scenario: Canvas integrates with existing layout

- **WHEN** VisualizationPanel renders
- **THEN** Canvas replaces virtualized track rows
- **AND** track headers, mute buttons, and controls remain in HTML
- **AND** playhead overlay stays as draggable HTML element
