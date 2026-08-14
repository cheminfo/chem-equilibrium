import { Matrix } from 'ml-matrix';

import type {
  EquilibriumOptions,
  Model,
  ModelFormedSpecies,
  Solution,
} from '../types.ts';
import { logarithmic } from '../util/random.ts';

import { newtonRaphton } from './NewtonRaphton.ts';

const defaultOptions = {
  robustMaxTries: 10,
  volume: 1,
  random: Math.random,
  autoInitial: true,
  tolerance: 1e-15,
} satisfies EquilibriumOptions;

interface ProcessedModel {
  /** Stoichiometric matrix of the dissolved species, one row per free component. */
  model: number[][];
  /** Formation constant of every dissolved species, components included. */
  beta: number[];
  /** Total concentration of every free component. */
  cTotal: number[];
  /** Imposed concentration of every fixed component. */
  cFixed: number[];
  specLabels: string[];
  compLabels: string[];
  fixedLabels: string[];
  specSolidLabels: string[];
  specSolutionLabels: string[];
  nFixed: number;
  solidModel?: number[][];
  /** Dissociation constant of every solid, which is what the solver needs. */
  solidBeta?: number[];
}

/**
 * A chemical system, ready to be solved.
 *
 * The model is a set of independent components and the species they form. Only
 * the free component concentrations are unknowns: every formed species follows
 * from them through its formation constant, which is what keeps the system
 * small enough to solve by Newton-Raphson.
 */
export class Equilibrium {
  readonly options: Required<
    Pick<
      EquilibriumOptions,
      'robustMaxTries' | 'volume' | 'random' | 'autoInitial' | 'tolerance'
    >
  > &
    EquilibriumOptions;

  readonly model: Model;
  readonly #model: ProcessedModel;
  #initial: Solution | undefined;

  /**
   * Turn a model into the matrices the solver works on.
   * @param model - Components and the species they form.
   * @param options - Solver and system options.
   */
  constructor(model: Model, options?: EquilibriumOptions) {
    this.options = { ...defaultOptions, ...options };
    checkModel(model);
    this.model = model;
    this.#model = this.#processModel(model);
  }

  /**
   * Solve the system from the concentrations given to {@link setInitial}.
   *
   * Much faster than {@link solveRobust} when solving a series of closely
   * related systems, since the previous solution is an excellent starting point.
   * @returns The concentration of every species, or `null` if it did not converge.
   */
  solve(): Solution | null {
    const model = this.#model;
    const initial = this.#getInitial();
    const cSpec = newtonRaphton(
      model.model,
      model.beta,
      model.cTotal,
      initial.components,
      model.solidModel,
      model.solidBeta,
      initial.solids,
      this.options,
    );
    const result = this.#processResult(cSpec);
    if (result && this.options.autoInitial) this.setInitial(result);
    return result;
  }

  /**
   * Solve the system from random starting points until it converges.
   *
   * Ignores the concentrations set with {@link setInitial}, and gives up after
   * `robustMaxTries` attempts.
   * @returns The concentration of every species, or `null` if it never converged.
   */
  solveRobust(): Solution | null {
    const model = this.#model;
    for (let i = 0; i < this.options.robustMaxTries; i++) {
      const cSpec = newtonRaphton(
        model.model,
        model.beta,
        model.cTotal,
        logarithmic(this.options.random, model.compLabels.length),
        model.solidModel,
        model.solidBeta,
        logarithmic(this.options.random, model.specSolidLabels.length),
        this.options,
      );
      if (cSpec) return this.#processResult(cSpec);
    }
    return null;
  }

  /**
   * Set the starting point of the next {@link solve}.
   * @param init - Concentration of each component, keyed by label. Zeros are
   * replaced by a tiny value, because the solver works multiplicatively.
   */
  setInitial(init: Solution): void {
    const initial: Solution = { ...init };
    for (const key of Object.keys(initial)) {
      if (initial[key] === 0) initial[key] = 1e-15;
    }
    this.#initial = initial;
  }

  /**
   * Pick the starting concentrations, drawing the ones the user did not set.
   * @returns Starting concentrations of the free components and of the solids.
   */
  #getInitial(): { components: number[]; solids: number[] } {
    const initial = new Array<number | undefined>(this.#model.cTotal.length);
    const initialSolid = new Array<number | undefined>(
      this.#model.specSolidLabels.length,
    );

    for (const key of Object.keys(this.#initial ?? {})) {
      const value = (this.#initial as Solution)[key] as number;
      const index = this.#model.compLabels.indexOf(key);
      if (index === -1) {
        const solidIndex = this.#model.specSolidLabels.indexOf(key);
        if (solidIndex !== -1) initialSolid[solidIndex] = value;
      } else {
        initial[index] = value;
      }
    }

    return {
      components: fillRandom(initial, this.options.random),
      solids: fillRandom(initialSolid, this.options.random),
    };
  }

  /**
   * Turn the model into the matrices the solver works on.
   *
   * Components whose free concentration is imposed are folded into the
   * formation constants (`beta *= imposed ** coefficient`) and removed from the
   * unknowns, which is exactly how "work at a fixed pH" is implemented.
   * @param model - The user-supplied model.
   * @returns Stoichiometric matrices, constants, totals and labels.
   */
  #processModel(model: Model): ProcessedModel {
    const nComp = model.components.length;
    const formedSpeciesSolution = model.formedSpecies.filter(
      (spec) => !spec.solid,
    );
    const formedSpeciesSolid = model.formedSpecies.filter((spec) => spec.solid);
    const nSpecSolution = formedSpeciesSolution.length;
    const nSpecSolid = formedSpeciesSolid.length;

    // Components are species too: identity stoichiometry and a formation
    // constant of 1, so the mass balance is a single sum over all species.
    let beta = new Matrix(1, nSpecSolution + nComp).fill(1);
    beta.setSubMatrix([formedSpeciesSolution.map((c) => c.beta)], 0, nComp);

    let matrix = new Matrix(nComp, nSpecSolution + nComp);
    matrix.setSubMatrix(Matrix.identity(nComp), 0, 0);
    for (let i = 0; i < nComp; i++) {
      for (let j = 0; j < nSpecSolution; j++) {
        matrix.set(
          i,
          j + nComp,
          (formedSpeciesSolution[j] as ModelFormedSpecies).components[
            i
          ] as number,
        );
      }
    }

    let freeRows = foldFixedComponents(model, matrix, beta);
    const columns = freeRows.concat(getRange(nComp, nComp + nSpecSolution - 1));
    matrix = matrix.selection(freeRows, columns);
    beta = beta.selection([0], columns);

    let solidMatrix: Matrix | undefined;
    let solidBeta: Matrix | undefined;
    if (nSpecSolid) {
      solidBeta = new Matrix([formedSpeciesSolid.map((c) => c.beta)]);
      solidMatrix = new Matrix(nComp, nSpecSolid);
      for (let i = 0; i < nComp; i++) {
        for (let j = 0; j < nSpecSolid; j++) {
          solidMatrix.set(
            i,
            j,
            (formedSpeciesSolid[j] as ModelFormedSpecies).components[
              i
            ] as number,
          );
        }
      }
      freeRows = foldFixedComponents(model, solidMatrix, solidBeta);
      solidMatrix = solidMatrix.selection(
        freeRows,
        getRange(0, nSpecSolid - 1),
      );
      solidBeta = solidBeta.selection([0], getRange(0, nSpecSolid - 1));
      // newtonRaphton compares ion products to the dissociation constant.
      solidBeta.pow(-1);
    }

    const cTotal: number[] = [];
    const cFixed: number[] = [];
    const fixedLabels: string[] = [];
    const compLabels: string[] = [];
    for (const component of model.components) {
      if (component.atEquilibrium) {
        fixedLabels.push(component.label);
        cFixed.push(component.atEquilibrium / this.options.volume);
      } else {
        cTotal.push((component.total as number) / this.options.volume);
        compLabels.push(component.label);
      }
    }

    const specSolutionLabels = formedSpeciesSolution.map((s) => s.label);
    const specSolidLabels = formedSpeciesSolid.map((s) => s.label);

    return {
      model: matrix.to2DArray(),
      beta: beta.to1DArray(),
      cTotal,
      cFixed,
      specLabels: [...compLabels, ...specSolutionLabels, ...specSolidLabels],
      compLabels,
      fixedLabels,
      specSolidLabels,
      specSolutionLabels,
      nFixed: nComp - matrix.rows,
      solidModel: solidMatrix?.to2DArray(),
      solidBeta: solidBeta?.to1DArray(),
    };
  }

  /**
   * Name the concentrations the solver returned and add back the fixed ones.
   * @param cSpec - Concentration of each species, in solver order.
   * @returns The concentrations keyed by species label.
   */
  #processResult(cSpec: number[] | null): Solution | null {
    if (!cSpec) return null;
    const result: Solution = {};
    for (let i = 0; i < this.#model.specLabels.length; i++) {
      result[this.#model.specLabels[i] as string] = cSpec[i] as number;
    }
    for (let i = 0; i < this.#model.cFixed.length; i++) {
      result[this.#model.fixedLabels[i] as string] = this.#model.cFixed[
        i
      ] as number;
    }
    return result;
  }
}

/**
 * Fold every component with an imposed concentration into the formation
 * constants, and report which rows of the matrix are still unknowns.
 * @param model - The user-supplied model.
 * @param matrix - Stoichiometric matrix, one row per component.
 * @param beta - Row matrix of formation constants, modified in place.
 * @returns Indices of the components that stay in the optimization.
 */
function foldFixedComponents(
  model: Model,
  matrix: Matrix,
  beta: Matrix,
): number[] {
  const freeRows: number[] = [];
  for (let i = 0; i < model.components.length; i++) {
    const atEquilibrium = model.components[i]?.atEquilibrium;
    if (atEquilibrium) {
      // newBeta = oldBeta * imposed ** stoichiometricCoefficient
      const imposed = new Matrix(1, matrix.columns).fill(atEquilibrium);
      imposed.pow([matrix.getRow(i)]);
      beta.multiply(imposed);
    } else {
      freeRows.push(i);
    }
  }
  return freeRows;
}

function fillRandom(
  values: Array<number | undefined>,
  random: () => number,
): number[] {
  const result = new Array<number>(values.length);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    result[i] = value === undefined ? logarithmic(random) : value;
  }
  return result;
}

function getRange(start: number, end: number): number[] {
  const range: number[] = [];
  for (let i = start; i <= end; i++) range.push(i);
  return range;
}

function checkModel(model: Model): void {
  const labels = new Set<string>();
  checkLabels(model.formedSpecies, labels);
  checkLabels(model.components, labels);
  checkComponents(model);
  checkFormedSpecies(model);
}

function checkLabels(
  entries: Array<{ label: string }>,
  labels: Set<string>,
): void {
  for (const entry of entries) {
    if (entry.label === undefined || entry.label === null) {
      throw new Error('Labels must be defined');
    }
    if (labels.has(entry.label)) throw new Error('Labels should be unique');
    labels.add(entry.label);
  }
}

function checkComponents(model: Model): void {
  for (const component of model.components) {
    if (
      typeof component.total !== 'number' &&
      typeof component.atEquilibrium !== 'number'
    ) {
      throw new Error(
        'Component should have a property total or atEquilibrium that is a number',
      );
    }
  }
}

function checkFormedSpecies(model: Model): void {
  if (!model.formedSpecies) throw new Error('Formed species is not defined');
  for (const species of model.formedSpecies) {
    if (species.components?.length !== model.components.length) {
      throw new Error(
        "Formed species' components array should have the same size as components",
      );
    }
    if (typeof species.beta !== 'number') {
      throw new Error('All formed species should have a beta property');
    }
  }
}
