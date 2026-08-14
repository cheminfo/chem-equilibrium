import type { HelperOptions, Solution, SweepResult } from 'chem-equilibrium';
import { Helper, Serie } from 'chem-equilibrium';

import type { SelectedSpecies } from '../components/SpeciesPicker.tsx';

/** Solver settings a tool exposes to the user. */
export interface SolverSettings {
  tolerance: number;
  solidTolerance: number;
  maxIterations: number;
  chunks: number;
}

/** The settings the tools start from, matching the historical views. */
export const DEFAULT_SETTINGS: SolverSettings = {
  tolerance: 1e-15,
  solidTolerance: 1e-8,
  maxIterations: 200,
  chunks: 200,
};

/**
 * Build a Helper holding the declared species, with some equilibria switched off.
 * @param species - What the user put in the solution.
 * @param disabled - Formed species whose equilibrium is ignored.
 * @param options - Extra options forwarded to the solver.
 * @returns A ready-to-use Helper.
 */
export function buildHelper(
  species: SelectedSpecies[],
  disabled: string[] = [],
  options: HelperOptions = {},
): Helper {
  const helper = new Helper(options);
  for (const entry of species) {
    helper.addSpecie(entry.label, entry.quantity);
  }
  for (const formed of disabled) {
    helper.disableEquation(formed);
  }
  return helper;
}

/** A speciation sweep, with everything the tools need to render it. */
export interface SpeciationResult extends SweepResult {
  /** The equilibria the solver actually used, disabled ones included. */
  equations: ReturnType<Helper['getEquations']>;
  normalized: ReturnType<Helper['getEquations']>;
  /** Set when the system could not be built at all. */
  error?: string;
}

/**
 * Sweep one component and solve the equilibrium at every value of it.
 *
 * Errors are returned rather than thrown: a student halfway through picking
 * species routinely produces a system that cannot be solved yet, and the page
 * must keep working.
 * @param species - What the user put in the solution.
 * @param disabled - Formed species whose equilibrium is ignored.
 * @param sweep - What to sweep and how.
 * @returns The sweep, or an empty result carrying the error message.
 */
export function runSpeciation(
  species: SelectedSpecies[],
  disabled: string[],
  sweep: {
    varying: string;
    isFixed: boolean;
    log: boolean;
    from: number;
    to: number;
  } & SolverSettings,
): SpeciationResult {
  const empty: SpeciationResult = {
    x: [],
    solutions: [],
    errorCount: 0,
    species: [],
    equations: [],
    normalized: [],
  };
  if (species.length === 0) return empty;

  try {
    const helper = buildHelper(species, disabled);
    const equations = helper.getEquations({
      filtered: true,
      includeDisabled: true,
    });
    const normalized = helper.getEquations({
      filtered: true,
      normalized: true,
      includeDisabled: true,
    });
    const result = new Serie(helper).getSolutions(sweep);
    return { ...result, equations, normalized };
  } catch (error) {
    return { ...empty, error: messageOf(error) };
  }
}

/**
 * Solve a single equilibrium.
 * @param species - What the user put in the solution.
 * @param options - Options forwarded to the solver.
 * @returns The solution, the equilibria used, and any error.
 */
export function runSingleSolve(
  species: SelectedSpecies[],
  options: HelperOptions = {},
): {
  solution: Solution | null;
  equations: ReturnType<Helper['getEquations']>;
  error?: string;
} {
  if (species.length === 0) return { solution: null, equations: [] };
  try {
    const helper = buildHelper(species, [], options);
    const equations = helper.getEquations({ filtered: true });
    return { solution: helper.getEquilibrium().solveRobust(), equations };
  } catch (error) {
    return { solution: null, equations: [], error: messageOf(error) };
  }
}

/**
 * Turn a sweep into chart series, one per species.
 * @param result - The sweep to plot.
 * @returns One series per species, in the solver's order.
 */
export function toSeries(
  result: Pick<SweepResult, 'solutions' | 'species'>,
): Array<{ label: string; y: number[] }> {
  return result.species.map((label) => ({
    label,
    y: result.solutions.map((solution) => solution[label] ?? Number.NaN),
  }));
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
