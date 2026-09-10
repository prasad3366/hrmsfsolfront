import { Holiday } from '../../services/api';

export type HolidayViewState = 'loading' | 'error' | 'empty' | 'ready';

export const getHolidayViewState = (
  isLoading: boolean,
  error: string | null,
  holidays: Holiday[],
): HolidayViewState => {
  if (isLoading) return 'loading';
  if (error) return 'error';
  if (holidays.length === 0) return 'empty';
  return 'ready';
};

export const addHoliday = (holidays: Holiday[], holiday: Holiday): Holiday[] => [...holidays, holiday];

export const replaceHoliday = (holidays: Holiday[], holiday: Holiday): Holiday[] =>
  holidays.map((item) => (item.id === holiday.id ? holiday : item));

export const removeHoliday = (holidays: Holiday[], holidayId: number): Holiday[] =>
  holidays.filter((item) => item.id !== holidayId);