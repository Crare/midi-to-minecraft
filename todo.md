# TODO

- optimize the app

- schematic expands to right out of window.

- fix icons in schematic
- dragging horizontally doesnt work in schematic
- dragging horizontally doesnt work in visualization
- visualization autoscroll on play doesnt work
- loading texts dont work correctly
- schematic example how-to-images dont work

- i think the horizontal scroll and play-head are not keeping up with the sounds playing of the song. they are not in sync.

- for schematic. add option to split the track in 4-tempo blocks. show 4 4-tempo blocks and then move on to the next one, by checking checkbox on top of the 4-tempo area. hide other 4-tempo block areas for visual clarity. add option to use other tempos too.

- track visualization doesn't show the 4-tempo lines.
- in the visualization show track length in time and minecraft ticks.

- add export schematic as excel file.

- use some common ui-library like material-ui

## OPTIMIZE

To optimize the performance of your webapp, especially for the schematic and visualization panels when handling long songs, here are some effective strategies:

Virtualization (Windowing):

Render only the visible portion of large lists or grids (e.g., tracks, notes, schematic cells) using libraries like react-window or react-virtualized. This drastically reduces DOM nodes and improves scroll performance.
Memoization and React Optimization:

Use React.memo, useMemo, and useCallback to prevent unnecessary re-renders of components.
Profile with React DevTools to identify components that re-render too often.
Efficient Data Structures:

Store and process song data in efficient structures (e.g., typed arrays, maps) to speed up lookups and reduce memory usage.
Batching and Debouncing:

Batch state updates and debounce expensive operations (like resizing, scrolling, or heavy computations).
Canvas/WebGL for Visualization:

For very large visualizations, consider rendering with <canvas> or WebGL instead of the DOM for better performance.
Lazy Loading:

Load and render song data incrementally, especially for very long songs.
Reduce React State Usage:

Minimize the amount of data stored in React state; keep large, static data outside of state and only store UI state.
Profiling and Bottleneck Analysis:

Use browser performance tools (Chrome DevTools, React Profiler) to pinpoint slow operations and optimize them.
