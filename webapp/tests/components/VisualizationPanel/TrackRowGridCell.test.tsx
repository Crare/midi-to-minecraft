import { TrackRowGridCell } from '@components/VisualizationPanel/TrackRowGridCell';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('TrackRowGridCell', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TrackRowGridCell
        columnIndex={0}
        rowIndex={0}
        style={{}}
        cellProps={{
          cellProps: {
            tracks: [],
            mutedTracks: new Set(),
            showColor: false,
            showNumber: false,
            showSupport: false,
            trackUnitSize: 34,
          },
        }}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});
