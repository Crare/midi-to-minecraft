import SchematicPanel from '@components/SchematicPanel';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SchematicPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<SchematicPanel trackEvents={[]} />);
    expect(container).toBeInTheDocument();
  });
});
