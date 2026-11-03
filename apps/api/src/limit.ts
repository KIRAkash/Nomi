const hits = new Map<string, number[]>();
/** At most `max` requests per key in the last `windowMs`. */
export function limited(key: string, max = 20, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}
