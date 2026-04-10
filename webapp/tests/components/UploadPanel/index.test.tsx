import UploadPanel from '@components/UploadPanel';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('UploadPanel', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <UploadPanel busy={false} status="" onFileSelected={() => {}} onConvertRequest={() => {}} />,
    );
    expect(container).toBeInTheDocument();
  });
});
