import ExamplePanel from '@components/ExamplePanel';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ExamplePanel', () => {
  it('renders without crashing', () => {
    const { container } = render(<ExamplePanel open={true} onOpenChange={() => {}} />);
    expect(container).toBeInTheDocument();
  });
});
