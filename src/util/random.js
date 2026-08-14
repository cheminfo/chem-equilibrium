/**
 * Draw logarithmically distributed random values in [0, 1].
 * @param {() => number} random - Random number generator returning a value in [0, 1].
 * @param {number} [len] - When set, returns an array of that length instead of a single value.
 * @returns {number|Array<number>} A single value, or an array of `len` values.
 */
export function logarithmic(random, len) {
  if (len === undefined) {
    return random() ** 10;
  }
  const values = new Array(len);
  for (let i = 0; i < values.length; i++) {
    values[i] = random() ** 10;
  }
  return values;
}
