import CollapsiblePanel from '@components/common/CollapsiblePanel';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('CollapsiblePanel', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CollapsiblePanel title="Test Panel">Test Content</CollapsiblePanel>,
    );
    expect(container).toBeInTheDocument();
  });
});
