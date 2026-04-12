import { MiniDust } from '@components/common/miniblocks/MiniDust';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MiniDust', () => {
  it('renders without crashing', () => {
    const { container } = render(<MiniDust />);
    expect(container).toBeInTheDocument();
  });
});
