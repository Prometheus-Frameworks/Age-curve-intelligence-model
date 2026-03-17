export function average(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!nums.length) {
    return null;
  }
  const total = nums.reduce((sum, n) => sum + n, 0);
  return total / nums.length;
}
