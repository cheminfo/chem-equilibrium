import type { Solution } from '../../types.ts';

/**
 * Read one concentration out of a solution, failing loudly when the solver did
 * not converge or the species is absent.
 * @param solution - Result of `solve()` or `solveRobust()`.
 * @param label - Label of the species to read.
 * @returns The concentration of that species.
 */
export function value(
  solution: Solution | null | undefined,
  label: string,
): number {
  const concentration = converged(solution)[label];
  if (concentration === undefined) {
    throw new Error(`${label} is not part of the solution`);
  }
  return concentration;
}

/**
 * Check that a solution was actually computed, failing loudly otherwise.
 * @param solution - Result of `solve()` or `solveRobust()`.
 * @returns The same solution, without `null` nor `undefined`.
 */
export function converged(solution: Solution | null | undefined): Solution {
  if (solution === null) throw new Error('the solver did not converge');
  if (solution === undefined) throw new Error('there is no such solution');
  return solution;
}

/**
 * Read one element of an array, failing loudly when it is out of range.
 * @param values - The array to read from, or `null` when nothing was computed.
 * @param index - Index of the element to read.
 * @returns The element at that index.
 */
export function at<T>(values: readonly T[] | null, index: number): T {
  if (values === null) throw new Error('there is no result to read from');
  const element = values[index];
  if (element === undefined) {
    throw new Error(`there is no element at index ${index}`);
  }
  return element;
}
