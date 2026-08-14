/** The three kinds of equilibria the solver understands. */
export type EquationType = 'acidoBasic' | 'complexation' | 'precipitation';

/**
 * One equilibrium, written as the formation of a single species from its
 * components. `pK` is always the base-10 logarithm of the **formation**
 * constant, so `beta = 10 ** pK`.
 */
export interface EquationData {
  /** Label of the species that is formed. */
  formed: string;
  /** Stoichiometric coefficient of each component consumed to form it. */
  components: Record<string, number>;
  /** log10 of the formation constant of `formed` from `components`. */
  pK: number;
  type: EquationType;
}

/** An equation as it comes out of `EquationSet.getEquations`. */
export interface EquationJSON extends EquationData {
  /**
   * Set when the equation is currently disabled.
   * @default false
   */
  disabled?: boolean;
}

/**
 * An entry of the bundled database. It carries the equilibrium plus the
 * provenance shown in the data table of https://equilibrium.cheminfo.org.
 */
export interface DatabaseEntry extends EquationData {
  /**
   * More precise classification of a complexation equilibrium, as recorded in
   * the upstream table (e.g. `ammonia complex`, `halide complex`).
   * @default undefined - the table records none
   */
  subType?: string;
  /**
   * Where the constant was taken from.
   * @default undefined - the source was never documented
   */
  source?: string;
  /**
   * Temperature at which the constant was measured, in kelvin.
   * @default undefined - the temperature was never documented
   */
  temperature?: number;
  /**
   * Why this entry should be treated with caution.
   * @default undefined - nothing is known against the value
   */
  warning?: string;
  /**
   * Whether the equilibrium takes part in the systems built from the database.
   * A deactivated entry is kept for the record — it documents a constant that
   * was considered and deliberately left out — but never enters a model.
   * @default true
   */
  active?: boolean;
}

/** A component of the system: either a known total, or a fixed free concentration. */
export interface ModelComponent {
  label: string;
  /**
   * Analytical total amount of that component.
   * @default undefined - give `atEquilibrium` instead
   */
  total?: number;
  /**
   * Free concentration imposed at equilibrium, e.g. `1e-7` for H+ at pH 7.
   * @default undefined - give `total` instead
   */
  atEquilibrium?: number;
}

/** A species formed from the components of the model. */
export interface ModelFormedSpecies {
  label: string;
  /** Formation constant, `10 ** pK`. */
  beta: number;
  /** Stoichiometric coefficients, in the order the components were declared. */
  components: number[];
  /**
   * Whether the species is a solid phase.
   * @default false
   */
  solid?: boolean;
}

/** The numerical description of a chemical system. */
export interface Model {
  components: ModelComponent[];
  formedSpecies: ModelFormedSpecies[];
  /**
   * Volume of the solution. Totals are divided by it to get concentrations.
   * @default 1
   */
  volume?: number;
}

/** Concentration of every species at equilibrium, keyed by species label. */
export type Solution = Record<string, number>;

/** Tuning of the Newton-Raphson solver. */
export interface SolverOptions {
  /**
   * Convergence tolerance on the dissolved species.
   * @default 1e-15
   */
  tolerance?: number;
  /**
   * Convergence tolerance on the solubility products of the solid species.
   * @default 1e-5
   */
  solidTolerance?: number;
  /**
   * Iterations before Newton-Raphson gives up.
   * @default 99
   */
  maxIterations?: number;
}

/** Options of `Equilibrium`. */
export interface EquilibriumOptions extends SolverOptions {
  /**
   * Volume of the solution in which the equilibrium occurs. Component totals
   * are divided by it to obtain concentrations.
   * @default 1
   */
  volume?: number;
  /**
   * Number of random restarts attempted by `solveRobust()`.
   * @default 10
   */
  robustMaxTries?: number;
  /**
   * Random number generator used to initialize concentrations.
   * @default Math.random
   */
  random?: () => number;
  /**
   * Reuse the result of `solve()` as the starting point of the next call.
   * @default true
   */
  autoInitial?: boolean;
}

/** Options of `Helper`. */
export interface HelperOptions extends EquilibriumOptions {
  /**
   * Solvent of the system. It is eliminated from the equations, and entries
   * without a pK for it are dropped.
   * @default 'H2O'
   */
  solvent?: string;
  /**
   * Replace the bundled database with this list of equilibria.
   * @default undefined - the bundled database is used
   */
  database?: DatabaseEntryInput[];
  /**
   * Append `database` to the bundled one instead of replacing it.
   * @default false
   */
  extend?: boolean;
}

/**
 * A database entry as it may be supplied by a user. `pK` can be a map keyed by
 * solvent, in which case `Helper` keeps only the value of its solvent.
 */
export interface DatabaseEntryInput extends Omit<DatabaseEntry, 'pK'> {
  pK: number | Record<string, number>;
}

/** Filters accepted by the getters of `EquationSet` and `Helper`. */
export interface EquationFilter {
  /**
   * Only keep equilibria of that kind.
   * @default undefined - every kind is kept
   */
  type?: EquationType;
  /**
   * Include the equations turned off with `disableEquation`.
   * @default false
   */
  includeDisabled?: boolean;
}
