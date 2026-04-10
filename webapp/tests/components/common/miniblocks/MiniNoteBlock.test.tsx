import { MiniNoteBlock } from '@components/SchematicPanel/miniblocks/MiniNoteBlock';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('MiniNoteBlock', () => {
  it('renders without crashing', () => {
    const { container } = render(<MiniNoteBlock block="minecraft:dirt" />);
    expect(container).toBeInTheDocument();
  });
});
