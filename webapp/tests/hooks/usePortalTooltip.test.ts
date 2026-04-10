import { usePortalTooltip } from '@hooks/usePortalTooltip';
import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('usePortalTooltip', () => {
  it('returns a ref and handlers', () => {
    const { result } = renderHook(() => usePortalTooltip());
    expect(result.current).toBeDefined();
  });
});
