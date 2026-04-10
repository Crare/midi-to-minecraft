import VisualizationPanel from '@components/VisualizationPanel';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('VisualizationPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<VisualizationPanel trackEvents={[]} />);
    expect(container).toBeInTheDocument();
  });
});
