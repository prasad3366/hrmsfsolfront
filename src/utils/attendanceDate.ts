export const attendanceDateKey = (value: string): string => {
  const datePart = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : value;
};

/* Display-only: decimal hours from the backend (e.g. 9.86) as "9h 52m".
   Rounds to whole minutes first, so 8.999 becomes "9h 00m", never "8h 60m". */
export const formatWorkedHours = (hours?: number | string | null): string => {
  const value = Number(hours);
  const totalMinutes = Number.isFinite(value) && value > 0 ? Math.round(value * 60) : 0;
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${wholeHours}h ${String(minutes).padStart(2, '0')}m`;
};

export const formatAttendanceDate = (value?: string | null): string => {
  if (!value) return '-';
  const datePart = attendanceDateKey(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? value : timestamp.toLocaleDateString();
};
