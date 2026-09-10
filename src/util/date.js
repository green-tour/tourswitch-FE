import dayjs from 'dayjs';

export const formatDate = (value, fallback = '-') => {
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY / MM / DD') : fallback;
};
