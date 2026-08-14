/**
 * Deterministic mulberry32 generator, so tests that rely on random
 * initialization of the solver are reproducible.
 * @param {number} seed - Seed of the generator.
 * @returns {() => number} A function returning a number in [0, 1).
 */
export function seededRandom(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
