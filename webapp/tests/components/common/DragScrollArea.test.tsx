import DragScrollArea from '@components/common/DragScrollArea';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DragScrollArea', () => {
  it('renders without crashing', () => {
    const { container } = render(<DragScrollArea>Drag Content</DragScrollArea>);
    expect(container).toBeInTheDocument();
  });
});
