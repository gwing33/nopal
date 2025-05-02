export function getCacheControlHeader(maxAge: number = 3600): string {
  return `max-age=${maxAge}`;
}
