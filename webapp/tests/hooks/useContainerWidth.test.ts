import { useContainerWidth } from '@hooks/useContainerWidth';
import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useContainerWidth', () => {
  it('returns 0 for null ref', () => {
    const ref = { current: null };
    const { result } = renderHook(() => useContainerWidth(ref));
    expect(result.current).toBe(0);
  });
});
