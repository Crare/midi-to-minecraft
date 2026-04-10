import { DustCell } from '@components/SchematicPanel/cells/DustCell';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DustCell', () => {
  it('renders without crashing', () => {
    const { container } = render(<DustCell />);
    expect(container).toBeInTheDocument();
  });
});
