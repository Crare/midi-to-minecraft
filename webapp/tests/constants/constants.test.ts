import { CELL } from '@constants';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';

describe('CELL constant', () => {
  it('should be 28', () => {
    expect(CELL).toBe(28);
  });
});
