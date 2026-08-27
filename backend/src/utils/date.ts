/** Calendar-date (UTC midnight) helpers for `@db.Date` columns, where a plain timestamp would introduce timezone ambiguity around "today." */

export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function dateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((dateOnly(a).getTime() - dateOnly(b).getTime()) / (24 * 60 * 60 * 1000));
}

export function subtractDays(date: Date, days: number): Date {
  const result = dateOnly(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}
