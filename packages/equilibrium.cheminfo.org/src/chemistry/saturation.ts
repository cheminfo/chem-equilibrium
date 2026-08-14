import type { Solution } from 'chem-equilibrium';

/** Where a solid phase first appears along a sweep. */
export interface SaturationPoint {
  /** Label of the solid. */
  label: string;
  /** Value of the swept quantity at which it appears. */
  at: number;
  /**
   * How far the true onset may lie from `at`: the sweep can only bracket it to
   * within one step.
   */
  uncertainty: number;
}

/**
 * Find where each solid starts to precipitate along a sweep.
 *
 * A solid phase appears the moment its ion product reaches its solubility
 * product, and from then on that product pins the free concentration of every
 * ion it contains. The slope of those curves changes there, which is the corner
 * a speciation diagram shows — a real feature of the system, not an artefact of
 * the solver. Naming it is the difference between a student reading a phase
 * boundary and a student suspecting a bug.
 * @param x - The swept values, in order.
 * @param solutions - The solution at each of them.
 * @param solids - Labels of the species that are solid phases.
 * @returns One entry per solid that appears, in the order it does.
 */
export function findSaturationPoints(
  x: number[],
  solutions: Solution[],
  solids: Iterable<string>,
): SaturationPoint[] {
  const points: SaturationPoint[] = [];
  for (const label of solids) {
    for (let i = 0; i < solutions.length; i++) {
      const amount = solutions[i]?.[label];
      if (amount === undefined || amount <= 0) continue;
      const at = x[i];
      const previous = x[i - 1];
      if (at === undefined) break;
      points.push({
        label,
        at,
        uncertainty: previous === undefined ? 0 : at - previous,
      });
      break;
    }
  }
  return points.toSorted((a, b) => a.at - b.at);
}
