import SchematicOptions from '@components/SchematicPanel/SchematicOptions';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SchematicOptions', () => {
  it('renders without crashing', () => {
    const { container } = render(<SchematicOptions cellSize={28} setCellSize={() => {}} />);
    expect(container).toBeInTheDocument();
  });
});
