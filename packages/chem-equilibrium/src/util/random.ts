export function logarithmic(random: () => number): number;
export function logarithmic(random: () => number, n: number): number[];
/**
 * Draw concentrations spread over many orders of magnitude.
 *
 * Raising a uniform variate to the 10th power puts most of the mass close to
 * zero, which is where equilibrium concentrations live.
 * @param random - Random number generator.
 * @param n - How many values to draw. Omit to get a single number.
 * @returns One value, or an array of `n` values.
 */
export function logarithmic(
  random: () => number,
  n?: number,
): number | number[] {
  if (n === undefined) return random() ** 10;
  const result = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    result[i] = random() ** 10;
  }
  return result;
}
