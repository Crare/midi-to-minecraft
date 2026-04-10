import TrackRow from '@components/VisualizationPanel/TrackRow';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('TrackRow', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TrackRow
        notes={[]}
        showColor={false}
        showNumber={false}
        showSupport={false}
        unitSize={34}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});
