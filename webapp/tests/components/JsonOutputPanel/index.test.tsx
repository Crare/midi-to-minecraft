import JsonOutputPanel from '@components/JsonOutputPanel';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('JsonOutputPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<JsonOutputPanel downloadFiles={[]} zipFilename="output.zip" />);
    expect(container).toBeInTheDocument();
  });
});
