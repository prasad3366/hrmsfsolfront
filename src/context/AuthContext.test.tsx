import { describe, expect, it } from 'vitest';
import { formatPersonName } from './AuthContext';

describe('formatPersonName', () => {
  it.each([
    ['Tadala', 'Ganesh', 'Tadala Ganesh'],
    ['tadala', 'ganesh', 'Tadala Ganesh'],
    ['  Tadala ', '  Ganesh  ', 'Tadala Ganesh'],
    ['Anu  Priya', 'Rao', 'Anu Priya Rao'],
    ['Ronan', "McDonald", 'Ronan McDonald'],
    ['Asha', null, 'Asha'],
    [null, 'Rao', 'Rao'],
  ])('formats %j + %j as %j', (firstName, lastName, expected) => {
    expect(formatPersonName(firstName, lastName)).toBe(expected);
  });

  it('returns an empty string when no name exists, so the existing fallback is kept', () => {
    expect(formatPersonName(undefined, '   ')).toBe('');
  });
});
