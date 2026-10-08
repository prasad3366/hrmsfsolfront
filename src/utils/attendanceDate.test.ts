import { describe, expect, it } from 'vitest';
import { formatWorkedHours } from './attendanceDate';

describe('formatWorkedHours', () => {
  it.each([
    [9.86, '9h 52m'],
    [8.87, '8h 52m'],
    [8.5, '8h 30m'],
    [9, '9h 00m'],
    [0, '0h 00m'],
    [0.86, '0h 52m'],
    [8.999, '9h 00m'],
    [7.9999, '8h 00m'],
    [0.01, '0h 01m'],
    [12.25, '12h 15m'],
    ['8.5', '8h 30m'],
  ])('formats %s hours as %s', (hours, expected) => {
    expect(formatWorkedHours(hours as number | string)).toBe(expected);
  });

  it.each([[null], [undefined], [NaN], [-1], ['abc']])('formats %s as 0h 00m', (hours) => {
    expect(formatWorkedHours(hours as any)).toBe('0h 00m');
  });
});
