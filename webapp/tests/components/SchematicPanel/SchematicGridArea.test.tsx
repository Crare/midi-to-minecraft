import SchematicGridArea from '@components/SchematicPanel/SchematicGridArea';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SchematicGridArea', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SchematicGridArea
        grid={{ instruments: [] }}
        cellSize={28}
        indicatorX={0}
        indicatorY={0}
        onIndicatorPointerDown={() => {}}
        onIndicatorPointerMove={() => {}}
        onIndicatorPointerUp={() => {}}
        onHIndicatorPointerDown={() => {}}
        onHIndicatorPointerMove={() => {}}
        onHIndicatorPointerUp={() => {}}
        onColumnClick={() => {}}
        onRowClick={() => {}}
        contentRef={{ current: null }}
        maxWidth={100}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});
