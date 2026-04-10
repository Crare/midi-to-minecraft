import TrackGrid from '@components/VisualizationPanel/TrackGrid';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('TrackGrid', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TrackGrid
        visibleTracks={[]}
        mutedTracks={new Set()}
        showColor={false}
        showNumber={false}
        showSupport={false}
        trackUnitSize={34}
        timelineUnitCount={1}
        trackScrollRef={{ current: null }}
        topScrollRef={{ current: null }}
        playheadRef={{ current: null }}
        playheadDragging={false}
        onPlayheadPointerDown={() => {}}
        onPlayheadPointerMove={() => {}}
        onPlayheadPointerUp={() => {}}
        finishPlayheadDrag={() => {}}
        playbackScope="all"
        selectedPlaybackTrackId=""
        toggleMuteCallbacks={new Map()}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});
