import PlaybackControls from '@components/VisualizationPanel/PlaybackControls';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('PlaybackControls', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <PlaybackControls
        playbackScope="all"
        setPlaybackScope={() => {}}
        visibleTracks={[]}
        selectedPlaybackTrackId=""
        setSelectedPlaybackTrackId={() => {}}
        isPlaying={false}
        playheadTick={0}
        startPlayback={() => {}}
        stopPlayback={() => {}}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});
