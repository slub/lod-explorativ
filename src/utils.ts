import { formatDefaultLocale, format } from 'd3-format';

formatDefaultLocale({ thousands: '.', grouping: [3] });

export const formatNumber = format('$,');

export function areEqual(a: string, b: string) {
  if (!a || !b) return a === b;
  return a.toLowerCase() === b.toLowerCase();
}
