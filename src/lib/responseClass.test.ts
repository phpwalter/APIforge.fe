import { describe, expect, it } from 'vitest';

import { nextAvailableCodeForClass } from './responseClass';

describe('nextAvailableCodeForClass', () => {
  it('advances after the highest defined code instead of filling a lower gap', () => {
    expect(nextAvailableCodeForClass(['200', '204'], '2xx')).toBe('205');
  });

  it('advances through the defined standard sequence', () => {
    expect(nextAvailableCodeForClass(['200'], '2xx')).toBe('201');
    expect(nextAvailableCodeForClass(['400', '401'], '4xx')).toBe('402');
    expect(nextAvailableCodeForClass(['500', '503'], '5xx')).toBe('504');
  });

  it('uses the configured class default when no code in that class exists', () => {
    expect(nextAvailableCodeForClass(['404'], '2xx')).toBe('200');
    expect(nextAvailableCodeForClass([], '3xx')).toBe('302');
  });

  it('uses the next numeric value when the standard sequence is exhausted', () => {
    expect(nextAvailableCodeForClass(['500', '501', '502', '503', '504'], '5xx')).toBe('505');
  });
});
