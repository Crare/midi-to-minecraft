import SchematicGrid from '@components/SchematicPanel/SchematicGrid';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SchematicGrid', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SchematicGrid
        grid={{ instruments: [] }}
        cellSize={28}
        onColumnClick={() => {}}
        onRowClick={() => {}}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});
