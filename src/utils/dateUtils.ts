import type { Dayjs } from 'dayjs';

export const isDateBetween = (
  date: Dayjs,
  start: Dayjs,
  end: Dayjs,
  unit: 'day' | 'month' | 'year' = 'day',
  inclusivity: '[]' | '()' | '[)' | '(]' = '[]'
): boolean => {
  const isSameOrAfter = (d: Dayjs, compare: Dayjs): boolean => {
    return d.isSame(compare, unit) || d.isAfter(compare, unit);
  };
  
  const isSameOrBefore = (d: Dayjs, compare: Dayjs): boolean => {
    return d.isSame(compare, unit) || d.isBefore(compare, unit);
  };
  
  if (inclusivity === '[]') {
    return isSameOrAfter(date, start) && isSameOrBefore(date, end);
  }
  // Add other inclusivity options as needed
  
  return false;
};