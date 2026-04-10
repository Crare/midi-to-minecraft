import DownloadRow from '@components/JsonOutputPanel/DownloadRow';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('DownloadRow', () => {
  it('renders without crashing', () => {
    const { container } = render(<DownloadRow filename="test.json" files={[]} />);
    expect(container).toBeInTheDocument();
  });
});
