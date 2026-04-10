import BlocksNeededSummary from '@components/SchematicPanel/BlocksNeededSummary';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('BlocksNeededSummary', () => {
  it('renders without crashing', () => {
    const { container } = render(<BlocksNeededSummary blockCounts={{}} />);
    expect(container).toBeInTheDocument();
  });
});
