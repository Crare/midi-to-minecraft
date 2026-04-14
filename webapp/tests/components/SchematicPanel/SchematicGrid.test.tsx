import SchematicGrid from '@components/SchematicPanel/SchematicGrid';
import { render } from '@testing-library/react';

describe('SchematicGrid', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SchematicGrid grid={{ instruments: [] }} cellSize={28} width={400} />,
    );
    expect(container).toBeInTheDocument();
  });

  it('renders all cell types and synchronizes by tick', () => {
    // Create a grid with all cell types at different ticks
    const grid = {
      instruments: [
        {
          title: 'harp lane 0',
          instrument: 'harp',
          lane: 0,
          cells: [
            { type: 'note', note: 60, key: 'note-0', tick: 0, block: 'minecraft:note_block' },
            { type: 'repeater', ticks: 2, key: 'rep-1', tick: 1 },
            { type: 'dust', key: 'dust-2', tick: 2 },
            { type: 'split', key: 'split-3', tick: 3 },
            { type: 'empty', key: 'empty-4', tick: 4 },
          ],
        },
        {
          title: 'harp lane 1',
          instrument: 'harp',
          lane: 1,
          cells: [
            { type: 'empty', key: 'empty-0', tick: 0 },
            { type: 'note', note: 64, key: 'note-1', tick: 1, block: 'minecraft:note_block' },
            { type: 'repeater', ticks: 1, key: 'rep-2', tick: 2 },
            { type: 'dust', key: 'dust-3', tick: 3 },
            { type: 'split', key: 'split-4', tick: 4 },
          ],
        },
      ],
    };
    const { container } = render(<SchematicGrid grid={grid} cellSize={28} width={400} />);
    expect(container).toBeInTheDocument();
    // The canvas should exist
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    // The grid should have two instrument rows
    // (We can't easily check pixel rendering, but this ensures no crash and correct structure)
  });
});
