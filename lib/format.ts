const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

export function formatRelativeTime(isoDate: string): string {
  const diffSeconds = (new Date(isoDate).getTime() - Date.now()) / 1000;
  const absDiff = Math.abs(diffSeconds);

  if (absDiff < 60) return 'just now';

  for (const [unit, secondsInUnit] of UNITS) {
    if (absDiff >= secondsInUnit) {
      return relativeFormatter.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return relativeFormatter.format(Math.round(diffSeconds / 60), 'minute');
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatWeight(kg: number | null): string {
  return kg === null ? '—' : `${kg} kg`;
}
