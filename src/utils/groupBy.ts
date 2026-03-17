export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const result = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = result.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      result.set(key, [item]);
    }
  }
  return result;
}
