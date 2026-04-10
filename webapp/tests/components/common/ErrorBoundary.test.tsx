import ErrorBoundary from '@components/common/ErrorBoundary';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ErrorBoundary', () => {
  it('renders children without crashing', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Child</div>
      </ErrorBoundary>,
    );
    expect(container).toBeInTheDocument();
  });
});
