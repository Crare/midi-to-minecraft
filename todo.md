# TODO

- remove the visualizationpanel completely and just use the schematic. add playback to the schematic.
- maybe use canvas to render the schematic..
- fix schematic expands to right out of window. again..
- fix schematic is not showing all the repeaters.

- add horizontally dragging in schematic
- show current tick in the schematic.

- add highlight to keep track where you are in line.

- optimize the app

- add option to show 4-tempo lines. add option to use other tempos too.

- add export schematic as excel and csv file for optional output.

- update example images when we are done.

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
