import { MiniBlock } from '@components/SchematicPanel/miniblocks/MiniBlock';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MiniBlock', () => {
  it('renders without crashing', () => {
    const { container } = render(<MiniBlock color="#fff" />);
    expect(container).toBeInTheDocument();
  });
});
