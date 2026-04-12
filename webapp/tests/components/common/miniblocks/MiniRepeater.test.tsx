import { MiniRepeater } from '@components/common/miniblocks/MiniRepeater';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MiniRepeater', () => {
  it('renders without crashing', () => {
    const { container } = render(<MiniRepeater />);
    expect(container).toBeInTheDocument();
  });
});
