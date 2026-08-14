import type { EquationJSON, HelperOptions, Solution } from '../types.ts';

import type { Helper } from './Helper.ts';

const defaultOptions = {
  chunks: 200,
  log: false,
  from: 0,
  to: 1,
  isFixed: false,
};

/** One of the two solutions of a titration. */
export interface TitrationSolution {
  /** Label of the acid or base it contains. */
  type: string;
  /** Concentration, in mol/L. */
  concentration: number;
  /** Volume, in litres. For the titrant this is the end of the sweep. */
  volume: number;
}

/** Options of {@link Serie.getTitration}. */
export interface TitrationOptions extends HelperOptions {
  /** The solution being titrated. */
  solution: TitrationSolution;
  /** The solution added from the burette. */
  titrationSolution: TitrationSolution;
  /**
   * Number of intervals; one more point than that is computed.
   * @default 200
   */
  chunks?: number;
}

/** Result of {@link Serie.getTitration}. */
export interface TitrationResult {
  /** Flat `[volume0, pH0, volume1, pH1, ...]` pairs, ready to plot. */
  xy: number[];
  /** How many points the solver failed to converge on. Those are left out. */
  errorCount: number;
  solutions: Solution[];
  species: string[];
  /** Volume of titrant added at each point, in litres. */
  volumes: number[];
  equations: EquationJSON[];
}

/** Options of {@link Serie.getSolutions}. */
export interface SweepOptions extends HelperOptions {
  /** Label of the species that is swept. */
  varying: string;
  /**
   * Impose the free concentration of `varying` at equilibrium instead of its
   * total. Set it to work at an imposed pH.
   * @default false
   */
  isFixed?: boolean;
  /**
   * Read `from` and `to` as p-values, so the real amount is `10 ** -x`.
   * @default false
   */
  log?: boolean;
  /**
   * Start of the sweep.
   * @default 0
   */
  from?: number;
  /**
   * End of the sweep.
   * @default 1
   */
  to?: number;
  /**
   * Number of intervals; one more point than that is computed.
   * @default 200
   */
  chunks?: number;
}

/** Result of {@link Serie.getSolutions}. */
export interface SweepResult {
  /** Value of the swept quantity at each point, in p-units when `log` is set. */
  x: number[];
  solutions: Solution[];
  /** How many points the solver failed to converge on. Those are left out. */
  errorCount: number;
  species: string[];
}

/**
 * Solves a whole series of related equilibria.
 *
 * Each point is warm-started from the previous solution, which is both much
 * faster and much more stable than solving every point from scratch.
 */
export class Serie {
  readonly helper: Helper;

  constructor(helper: Helper) {
    this.helper = helper;
  }

  /**
   * Titrate one solution with another.
   * @param options - The two solutions and the number of points.
   * @returns The titration curve and the speciation at every point.
   */
  getTitration(options: TitrationOptions): TitrationResult {
    const { chunks, ...rest } = { ...defaultOptions, ...options };
    const helper = this.helper.clone();
    helper.resetSpecies();
    helper.setOptions(rest);

    const analyteVolume = options.solution.volume;
    const analyteQuantity =
      options.solution.concentration * options.solution.volume;
    const titrantConcentration = options.titrationSolution.concentration;
    const titrantVolume = options.titrationSolution.volume;

    helper.addSpecie(options.solution.type);
    helper.addSpecie(options.titrationSolution.type);

    const volumes: number[] = [];
    const solutions: Solution[] = [];
    const xy: number[] = [];
    let errorCount = 0;
    let previous: Solution | null = null;

    for (let i = 0; i <= chunks; i++) {
      const volume = (titrantVolume * i) / chunks;
      helper.setTotal(
        options.titrationSolution.type,
        volume * titrantConcentration,
      );
      helper.setTotal(options.solution.type, analyteQuantity);
      helper.setOptions({ volume: volume + analyteVolume });

      const equilibrium = helper.getEquilibrium();
      if (previous) {
        equilibrium.setInitial(previous);
        previous = equilibrium.solve();
      } else {
        previous = equilibrium.solveRobust();
      }

      if (previous) {
        solutions.push(previous);
        volumes.push(volume);
        xy.push(volume, -Math.log10(previous['H+'] as number));
      } else {
        errorCount++;
      }
    }

    return {
      xy,
      errorCount,
      solutions,
      species: solutions[0] ? Object.keys(solutions[0]) : [],
      volumes,
      equations: helper.getEquations({ filtered: true }),
    };
  }

  /**
   * Sweep one species and solve the equilibrium at every value of it.
   *
   * With `varying: 'H+'`, `isFixed: true` and `log: true` this produces the
   * classic speciation diagram against pH.
   * @param options - What to sweep, over which range, and how finely.
   * @returns The swept values and the speciation at each of them.
   * @throws {Error} When `to` is not greater than `from`, or `varying` is missing.
   */
  getSolutions(options: SweepOptions): SweepResult {
    const merged = { ...defaultOptions, ...options };
    const { chunks, from, to, log, isFixed, varying, ...rest } = merged;
    if (from >= to) {
      throw new Error(
        'Invalid arguments: property "to" should be larger than "from"',
      );
    }
    if (!varying) {
      throw new Error('Invalid arguments: property "varying" is not defined');
    }

    const helper = this.helper.clone();
    helper.setOptions(rest);

    const x: number[] = [];
    const solutions: Solution[] = [];
    let errorCount = 0;
    let previous: Solution | null = null;

    for (let i = 0; i <= chunks; i++) {
      const value = from + ((to - from) * i) / chunks;
      const amount = log ? 10 ** -value : value;

      if (isFixed) {
        helper.setAtEquilibrium(varying, amount);
      } else {
        helper.setTotal(varying, amount);
      }

      const equilibrium = helper.getEquilibrium();
      if (previous) {
        equilibrium.setInitial(previous);
        previous = equilibrium.solve();
      } else {
        previous = equilibrium.solveRobust();
      }

      if (previous) {
        x.push(value);
        solutions.push(previous);
      } else {
        errorCount++;
      }
    }

    return {
      x,
      solutions,
      errorCount,
      species: solutions[0] ? Object.keys(solutions[0]) : [],
    };
  }
}
