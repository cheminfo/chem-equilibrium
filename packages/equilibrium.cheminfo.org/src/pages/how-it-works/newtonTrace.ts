import type { Model } from 'chem-equilibrium';

import { solveLinear } from './linearSolve.ts';

/** A model flattened the way the solver reads it: components are species too. */
export interface Tableau {
  /** The unknowns, in model order. */
  componentLabels: string[];
  /** Every species, the components first. */
  speciesLabels: string[];
  /** Formation constant of each species; exactly 1 for the components. */
  beta: number[];
  /** Stoichiometric coefficients, one row per component. */
  rows: number[][];
  /** Analytical total of each component. */
  totals: number[];
}

/** One Newton-Raphson iteration, as the widget replays it. */
export interface NewtonStep {
  /** Zero-based index of the iteration. */
  iteration: number;
  /** Free component concentrations this iteration started from. */
  concentrations: number[];
  /** Concentration of every species implied by them. */
  species: number[];
  /** Largest absolute mass-balance residual, `max |T − T_calc|`. */
  residual: number;
  /** How many times the step was halved to keep every concentration positive. */
  halvings: number;
}

/** Tuning of {@link traceNewton}, matching the solver's own options. */
export interface TraceOptions {
  /**
   * Largest residual accepted as converged.
   * @default 1e-15
   */
  tolerance?: number;
  /**
   * Iterations recorded before giving up.
   * @default 40
   */
  maxIterations?: number;
}

/**
 * Flatten a dissolved-only model into the tableau the iteration works on.
 *
 * Every component is added as a species of its own with a unit coefficient and
 * a formation constant of 1, which is what lets the mass balance be written as
 * a single sum over all species.
 * @param model - Model produced by `Helper.getModel()`.
 * @returns The tableau, or `null` when the model has a solid or a fixed component.
 */
export function buildTableau(model: Model): Tableau | null {
  const dissolved = model.formedSpecies.filter((species) => !species.solid);
  if (dissolved.length !== model.formedSpecies.length) return null;

  const componentLabels: string[] = [];
  const totals: number[] = [];
  for (const component of model.components) {
    if (typeof component.total !== 'number') return null;
    componentLabels.push(component.label);
    totals.push(component.total);
  }

  const componentCount = componentLabels.length;
  const speciesLabels = componentLabels.concat(
    dissolved.map((species) => species.label),
  );
  const beta = componentLabels
    .map(() => 1)
    .concat(dissolved.map((species) => species.beta));

  const rows: number[][] = [];
  for (let i = 0; i < componentCount; i++) {
    const row = new Array<number>(speciesLabels.length).fill(0);
    row[i] = 1;
    for (let j = 0; j < dissolved.length; j++) {
      row[componentCount + j] = dissolved[j]?.components[i] ?? 0;
    }
    rows.push(row);
  }

  return { componentLabels, speciesLabels, beta, rows, totals };
}

/**
 * Replay the Newton-Raphson iteration, keeping every intermediate state.
 *
 * This is the dissolved-only path of the solver written so that each iterate
 * can be shown: same residual, same symmetric Jacobian, same multiplicative
 * update and same step halving.
 * @param tableau - The system to solve.
 * @param start - Starting concentration of each component.
 * @param options - Tolerance and iteration budget.
 * @returns Every iterate, the converged one last.
 */
export function traceNewton(
  tableau: Tableau,
  start: number[],
  options: TraceOptions = {},
): NewtonStep[] {
  const { tolerance = 1e-15, maxIterations = 40 } = options;
  const componentCount = tableau.componentLabels.length;
  const concentrations = start.slice();
  const steps: NewtonStep[] = [];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const species = speciesConcentrations(tableau, concentrations);
    const residuals = new Array<number>(componentCount).fill(0);
    let worst = 0;
    for (let i = 0; i < componentCount; i++) {
      const row = tableau.rows[i] ?? [];
      let calculated = 0;
      for (let l = 0; l < species.length; l++) {
        calculated += (row[l] ?? 0) * (species[l] ?? 0);
      }
      const residual = (tableau.totals[i] ?? 0) - calculated;
      residuals[i] = residual;
      worst = Math.max(worst, Math.abs(residual));
    }

    const step: NewtonStep = {
      iteration,
      concentrations: concentrations.slice(),
      species,
      residual: worst,
      halvings: 0,
    };
    steps.push(step);
    if (worst < tolerance) break;

    const jacobian = buildJacobian(tableau, species);
    const logStep = solveLinear(jacobian, residuals);
    if (!logStep) break;

    // The unknowns are the logarithms of the concentrations, so the step has to
    // be scaled back by the concentration itself before it is applied.
    const delta = new Array<number>(componentCount);
    const next = new Array<number>(componentCount);
    for (let i = 0; i < componentCount; i++) {
      const current = concentrations[i] ?? 0;
      const change = current * (logStep[i] ?? 0);
      delta[i] = change;
      next[i] = current + change;
    }

    while (hasNonPositive(next)) {
      let converged = true;
      for (let i = 0; i < componentCount; i++) {
        const halved = (delta[i] ?? 0) * 0.5;
        delta[i] = halved;
        next[i] = (next[i] ?? 0) - halved;
        if (Math.abs(halved) >= tolerance) converged = false;
      }
      step.halvings++;
      if (converged) break;
    }

    for (let i = 0; i < componentCount; i++) {
      concentrations[i] = next[i] ?? 0;
    }
  }

  return steps;
}

/**
 * Concentration of every species from the free components.
 * @param tableau - The system.
 * @param concentrations - Free component concentrations.
 * @returns One concentration per species, in tableau order.
 */
function speciesConcentrations(
  tableau: Tableau,
  concentrations: number[],
): number[] {
  const count = tableau.beta.length;
  const values = new Array<number>(count).fill(0);
  for (let l = 0; l < count; l++) {
    let value = tableau.beta[l] ?? 0;
    for (let i = 0; i < concentrations.length; i++) {
      const coefficient = tableau.rows[i]?.[l] ?? 0;
      if (coefficient !== 0) {
        value *= (concentrations[i] ?? 0) ** coefficient;
      }
    }
    values[l] = value;
  }
  return values;
}

/**
 * The symmetric block `A_jk = Σ_l a_jl · a_kl · [S_l]`.
 * @param tableau - The system.
 * @param species - Current concentration of every species.
 * @returns The Jacobian of the totals against the log concentrations.
 */
function buildJacobian(tableau: Tableau, species: number[]): number[][] {
  const count = tableau.componentLabels.length;
  const jacobian: number[][] = [];
  for (let j = 0; j < count; j++) {
    const rowJ = tableau.rows[j] ?? [];
    const row = new Array<number>(count).fill(0);
    for (let k = 0; k < count; k++) {
      const rowK = tableau.rows[k] ?? [];
      let sum = 0;
      for (let l = 0; l < species.length; l++) {
        sum += (rowJ[l] ?? 0) * (rowK[l] ?? 0) * (species[l] ?? 0);
      }
      row[k] = sum;
    }
    jacobian.push(row);
  }
  return jacobian;
}

/**
 * Whether any concentration of a candidate iterate is zero or negative.
 * @param values - Candidate concentrations.
 * @returns Whether the step has to be backed off.
 */
function hasNonPositive(values: number[]): boolean {
  for (const value of values) {
    if (!(value > 0)) return true;
  }
  return false;
}
