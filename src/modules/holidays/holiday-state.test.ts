import { describe, expect, it } from 'vitest';
import { Holiday } from '../../services/api';
import { addHoliday, getHolidayViewState, removeHoliday, replaceHoliday } from './holiday-state';

const holiday: Holiday = {
  id: 1,
  name: 'Founders Day',
  date: '2026-09-06',
  isOptional: false,
  createdAt: '2026-01-01',
};

describe('Holiday page state', () => {
  it('covers loading, fetch error, and empty states', () => {
    expect(getHolidayViewState(true, null, [holiday])).toBe('loading');
    expect(getHolidayViewState(false, 'Failed to fetch holidays', [holiday])).toBe('error');
    expect(getHolidayViewState(false, null, [])).toBe('empty');
  });

  it('synchronizes successful create, update, and delete mutations', () => {
    const created = addHoliday([], holiday);
    const updated = replaceHoliday(created, { ...holiday, name: 'Updated Founders Day' });

    expect(updated[0].name).toBe('Updated Founders Day');
    expect(removeHoliday(updated, holiday.id)).toEqual([]);
  });

  it('represents mutation failures through the shared error state', () => {
    expect(getHolidayViewState(false, 'Failed to delete holiday', [holiday])).toBe('error');
  });
});