import { EquationSet } from '../core/EquationSet.ts';
import { Equilibrium } from '../core/Equilibrium.ts';
import { database } from '../data/database.ts';
import type {
  DatabaseEntry,
  DatabaseEntryInput,
  EquationFilter,
  EquationJSON,
  HelperOptions,
  Model,
} from '../types.ts';

const defaultOptions = {
  solvent: 'H2O',
} satisfies HelperOptions;

/** Filters accepted by the getters of {@link Helper}. */
export interface HelperFilter extends EquationFilter {
  /**
   * Restrict the result to the equilibria reachable from the species that were
   * added with `addSpecie`.
   * @default false
   */
  filtered?: boolean;
}

/** Filters accepted by {@link Helper.getEquations}. */
export interface HelperEquationFilter extends HelperFilter {
  /**
   * Rewrite the equations on a basis of independent components.
   * @default false
   */
  normalized?: boolean;
}

/**
 * Builds an equilibrium from the bundled database.
 *
 * Declare what goes into the solution with `addSpecie`, and the Helper pulls in
 * every equilibrium reachable from it — so adding `CO3--` brings in `HCO3-`,
 * `H2CO3` and water autoprotolysis without you naming them.
 */
export class Helper {
  options: HelperOptions & { solvent: string };
  /** Amount introduced for each species, keyed by label. */
  species: Record<string, number>;
  /** Labels whose free concentration is imposed rather than mass-balanced. */
  atEquilibrium: Set<string>;
  equationSet: EquationSet;

  constructor(options?: HelperOptions) {
    this.options = { ...defaultOptions, ...options };
    this.atEquilibrium = new Set();
    this.species = {};

    let entries: DatabaseEntryInput[] = this.options.database ?? database;
    if (this.options.extend && this.options.database) {
      entries = entries.concat(database);
    }
    entries = entries.filter((entry) => entry.active !== false);
    this.equationSet = new EquationSet(
      forSolvent(entries, this.options.solvent),
    );
    this.addSpecie(this.options.solvent);
  }

  clone(): Helper {
    const helper = new Helper(this.options);
    helper.species = { ...this.species };
    helper.equationSet = this.equationSet.clone();
    helper.atEquilibrium = new Set(this.atEquilibrium);
    return helper;
  }

  /**
   * List the species the database knows about.
   * @param options - Filters.
   * @returns The species labels.
   */
  getSpecies(options: HelperFilter = {}): string[] {
    return this.equationSet.getSpecies({
      ...options,
      species: options.filtered ? Object.keys(this.species) : null,
    });
  }

  /**
   * List the independent components of the current system.
   * @param options - Filters.
   * @returns The component labels.
   */
  getComponents(options: HelperFilter = {}): string[] {
    const equationSet = options.filtered
      ? this.equationSet.getSubset(Object.keys(this.species))
      : this.equationSet;
    return equationSet
      .getNormalized(this.options.solvent)
      .getComponents(options);
  }

  /**
   * List the equilibria of the current system.
   * @param options - Filters.
   * @returns One plain object per equation.
   */
  getEquations(options: HelperEquationFilter = {}): EquationJSON[] {
    let equationSet = this.equationSet;
    if (options.filtered) {
      equationSet = equationSet.getSubset(Object.keys(this.species));
    }
    if (options.normalized) {
      equationSet = equationSet.getNormalized(this.options.solvent);
    }
    return equationSet.getEquations(options);
  }

  /**
   * Build the numerical model of the current system.
   * @returns The model consumed by {@link Equilibrium}.
   */
  getModel(): Model {
    const model = this.equationSet
      .getSubset(Object.keys(this.species))
      .getNormalized(this.options.solvent)
      .getModel(this.species, true);
    for (const component of model.components) {
      if (this.atEquilibrium.has(component.label)) {
        component.atEquilibrium = this.species[component.label];
        delete component.total;
      }
    }
    return model;
  }

  getEquilibrium(): Equilibrium {
    return new Equilibrium(this.getModel(), this.options);
  }

  /**
   * Add a species to the solution.
   * @param label - Label of the species.
   * @param total - Amount introduced. Accumulates over repeated calls.
   */
  addSpecie(label: string, total = 0): void {
    // The solvent has unit activity, so an amount would be meaningless.
    const amount = label === this.options.solvent ? 0 : total;
    this.species[label] = (this.species[label] ?? 0) + amount;
  }

  /** Forget every species, keeping only the solvent. */
  resetSpecies(): void {
    this.species = {};
    this.atEquilibrium.clear();
    this.addSpecie(this.options.solvent);
  }

  /**
   * Set the analytical total of a species, replacing any previous amount.
   * @param label - Label of the species.
   * @param total - Amount introduced.
   */
  setTotal(label: string, total: number): void {
    this.species[label] = total;
    this.atEquilibrium.delete(label);
  }

  /**
   * Impose the free concentration of a species at equilibrium, instead of its
   * total. This is how a fixed pH is modelled: `setAtEquilibrium('H+', 1e-7)`.
   * @param label - Label of the species.
   * @param value - Concentration imposed at equilibrium.
   */
  setAtEquilibrium(label: string, value: number): void {
    this.species[label] = value;
    this.atEquilibrium.add(label);
  }

  setOptions(options: HelperOptions): void {
    this.options = { ...this.options, ...options };
  }

  disableEquation(formedSpecie: string): void {
    this.equationSet.disableEquation(formedSpecie, true);
  }

  enableEquation(formedSpecie: string): void {
    this.equationSet.enableEquation(formedSpecie, true);
  }

  enableAllEquations(): void {
    this.equationSet.enableAllEquations();
  }
}

/**
 * Keep the pK of one solvent, dropping the entries that do not have one.
 * @param entries - Raw database entries.
 * @param solvent - Label of the solvent.
 * @returns Entries whose pK is a plain number.
 */
function forSolvent(
  entries: DatabaseEntryInput[],
  solvent: string,
): DatabaseEntry[] {
  const result: DatabaseEntry[] = [];
  for (const entry of entries) {
    if (typeof entry.pK === 'number') {
      if (solvent === 'H2O') result.push(entry as DatabaseEntry);
      continue;
    }
    const pK = entry.pK[solvent];
    if (pK !== undefined) result.push({ ...entry, pK });
  }
  return result;
}
