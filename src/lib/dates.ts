/** ISO date (YYYY-MM-DD) `days` days from now. Evaluated per request on the server. */
export function isoDateInDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
