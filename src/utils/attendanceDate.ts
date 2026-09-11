export const attendanceDateKey = (value: string): string => {
  const datePart = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : value;
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
