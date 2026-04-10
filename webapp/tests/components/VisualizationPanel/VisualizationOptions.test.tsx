import VisualizationOptions from '@components/VisualizationPanel/VisualizationOptions';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('VisualizationOptions', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <VisualizationOptions
        viewMode="instrument"
        setViewMode={() => {}}
        showColor={false}
        setShowColor={() => {}}
        showNumber={false}
        setShowNumber={() => {}}
        showSupport={false}
        setShowSupport={() => {}}
        visibleTracks={[]}
        trackEvents={[]}
        viewModes={{ instrument: 'instrument', track: 'track' }}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});
