import type {
  EquationData,
  EquationFilter,
  EquationJSON,
  Model,
} from '../types.ts';

import { Equation } from './Equation.ts';

/** Filter accepting an explicit list of species. */
export interface SpeciesFilter extends EquationFilter {
  /** Restrict the set to the equilibria reachable from these species. */
  species?: string[] | null;
}

/**
 * A collection of equilibria, keyed by the species they form.
 *
 * The set knows how to take the closure of a subset of species, how to rewrite
 * every equilibrium on a basis of independent components (normalization), and
 * how to turn itself into the numerical model the solver consumes.
 */
export class EquationSet {
  #normalized = false;
  #disabledKeys: Set<string>;
  readonly #equations: Map<string, Equation>;

  constructor(equations?: Array<Equation | EquationData>) {
    this.#disabledKeys = new Set();
    this.#equations = new Map();
    for (const equation of equations ?? []) {
      this.add(equation);
    }
  }

  [Symbol.iterator](): IterableIterator<Equation> {
    return this.#equations.values();
  }

  clone(): EquationSet {
    const equationSet = new EquationSet();
    equationSet.#normalized = this.#normalized;
    equationSet.#disabledKeys = new Set(this.#disabledKeys);
    for (const [key, eq] of this.entries()) {
      equationSet.#equations.set(key, eq.clone());
    }
    return equationSet;
  }

  add(eq: Equation | EquationData, key?: string): void {
    this.#equations.set(key ?? getHash(eq.formed), Equation.create(eq));
    this.#normalized = false;
  }

  has(eq: Equation | string): boolean {
    return this.#equations.has(
      eq instanceof Equation ? getHash(eq.formed) : eq,
    );
  }

  get size(): number {
    return this.#equations.size;
  }

  get species(): string[] {
    return this.getSpecies();
  }

  /**
   * List every species the set mentions, formed species and components alike.
   * @param options - Filters. `species` first restricts the set to their closure.
   * @returns The species labels.
   */
  getSpecies(options: SpeciesFilter = {}): string[] {
    const { species, type, includeDisabled } = options;
    if (species) {
      const { species: _ignored, ...rest } = options;
      return this.getSubset(species).getSpecies(rest);
    }

    const speciesSet = new Set<string>();
    for (const [key, eq] of this.entries()) {
      if (this.#disabledKeys.has(key) && !includeDisabled) continue;
      if (type && type !== eq.type) continue;
      speciesSet.add(eq.formed);
      for (const component of Object.keys(eq.components)) {
        speciesSet.add(component);
      }
    }
    return Array.from(speciesSet);
  }

  get components(): string[] {
    return this.getComponents();
  }

  /**
   * List the independent components of a normalized set.
   * @param options - Filters. `species` keeps only the components they involve.
   * @returns The component labels.
   * @throws {Error} When the set has not been normalized.
   */
  getComponents(options: SpeciesFilter = {}): string[] {
    const { species, type, includeDisabled } = options;
    if (!this.isNormalized()) {
      throw new Error('Cannot get components from non-normalized equation set');
    }
    const speciesSet = new Set<string>();
    for (const [key, eq] of this.entries()) {
      if (this.#disabledKeys.has(key) && !includeDisabled) continue;
      if (type && type !== eq.type) continue;
      const componentKeys = Object.keys(eq.components);
      if (!species || species.includes(eq.formed)) {
        for (const component of componentKeys) speciesSet.add(component);
      } else {
        for (const component of componentKeys) {
          if (species.includes(component)) speciesSet.add(component);
        }
      }
    }
    return Array.from(speciesSet);
  }

  disableEquation(key: string, hashIt?: boolean): void {
    this.#disabledKeys.add(hashIt ? getHash(key) : key);
  }

  enableEquation(key: string, hashIt?: boolean): void {
    this.#disabledKeys.delete(hashIt ? getHash(key) : key);
  }

  enableAllEquations(): void {
    this.#disabledKeys.clear();
  }

  get(id: string, hashIt?: boolean): Equation | undefined {
    return this.#equations.get(hashIt ? getHash(id) : id);
  }

  keys(): IterableIterator<string> {
    return this.#equations.keys();
  }

  values(): IterableIterator<Equation> {
    return this.#equations.values();
  }

  entries(): IterableIterator<[string, Equation]> {
    return this.#equations.entries();
  }

  forEach(
    callback: (
      equation: Equation,
      key: string,
      map: Map<string, Equation>,
    ) => void,
    thisArg?: unknown,
  ): void {
    for (const [key, equation] of this.#equations) {
      callback.call(thisArg, equation, key, this.#equations);
    }
  }

  isNormalized(): boolean {
    return this.#normalized;
  }

  /**
   * Rewrite every equilibrium on a basis of independent components.
   *
   * A species that is itself formed by another equation is substituted away,
   * multiplying stoichiometric coefficients and adding pK values, until no
   * component of any equation is produced elsewhere in the set. The solvent is
   * eliminated first.
   * @param solvent - Label of the solvent.
   * @returns A new, normalized set.
   */
  getNormalized(solvent: string): EquationSet {
    const keys = Array.from(this.keys());
    const withoutSolvent = Array.from(this.values(), (equation) =>
      equation.withSolvent(solvent),
    );
    const normalized = normalize(withoutSolvent);

    const normSet = new EquationSet();
    for (let i = 0; i < normalized.length; i++) {
      normSet.add(normalized[i] as Equation | EquationData, keys[i]);
    }
    normSet.#normalized = true;
    normSet.#disabledKeys = new Set(this.#disabledKeys);
    return normSet;
  }

  /**
   * Get the equilibria as plain objects.
   * @param options - Filters.
   * @returns One object per equation, carrying `disabled` when it is turned off.
   */
  getEquations(options: EquationFilter = {}): EquationJSON[] {
    const result: EquationJSON[] = [];
    for (const [key, equation] of this.entries()) {
      const disabled = this.#disabledKeys.has(key);
      if (disabled && !options.includeDisabled) continue;
      if (options.type && options.type !== equation.type) continue;
      const json: EquationJSON = equation.toJSON();
      if (disabled) json.disabled = true;
      result.push(json);
    }
    return result;
  }

  /**
   * Build the numerical model of the system.
   * @param totals - Amount introduced for each species, keyed by label.
   * @param all - Use the whole set instead of the closure of `totals`.
   * @returns The model consumed by `Equilibrium`.
   * @throws {Error} When the set has not been normalized.
   */
  getModel(totals: Record<string, number>, all?: boolean): Model {
    if (!this.isNormalized()) {
      throw new Error('Cannot get model from un-normalized equation set');
    }
    const subset = all ? this : this.getSubset(Object.keys(totals));
    const components = subset.components;
    const enabled: Equation[] = [];
    for (const [key, equation] of subset.entries()) {
      if (!this.#disabledKeys.has(key)) enabled.push(equation);
    }

    const totalComp: Record<string, number> = {};
    for (const component of components) totalComp[component] = 0;
    for (const key of Object.keys(totals)) {
      const total = totals[key] ?? 0;
      if (components.includes(key)) {
        totalComp[key] = (totalComp[key] as number) + total;
      } else {
        const equation = enabled.find((e) => e.formed === key);
        if (equation) {
          for (const [component, coefficient] of Object.entries(
            equation.components,
          )) {
            totalComp[component] =
              (totalComp[component] ?? 0) + coefficient * total;
          }
        }
      }
    }

    return {
      volume: 1,
      components: components.map((label) => ({
        label,
        total: totalComp[label] as number,
      })),
      formedSpecies: enabled.map((equation) => ({
        solid: equation.type === 'precipitation',
        label: equation.formed,
        beta: 10 ** equation.pK,
        components: components.map((label) => equation.components[label] ?? 0),
      })),
    };
  }

  /**
   * Take the closure of a set of species.
   *
   * Every equation forming one of `species` is pulled in, recursively adding
   * the components it introduces; then any equation whose components are all
   * present is added too. This is why declaring `Ag+` and `NH3` silently brings
   * in water autoprotolysis, ammonium, the diammine complex and solid AgOH.
   * @param species - The species the user declared.
   * @returns A new set holding every reachable equation.
   * @throws {Error} When the equations reference each other in a cycle.
   */
  getSubset(species: string[]): EquationSet {
    const speciesSet = new Set(species);
    const newSet = new EquationSet();
    let passes = 0;

    const pullFormed = (currentSpecies: string[]): void => {
      passes++;
      if (passes === MAX_PASSES) return;
      for (const equation of this) {
        if (currentSpecies.includes(equation.formed) && !newSet.has(equation)) {
          newSet.add(equation);
          speciesSet.add(equation.formed);
          const newComponents = Object.keys(equation.components);
          for (const component of newComponents) speciesSet.add(component);
          pullFormed(newComponents);
        }
      }
    };

    pullFormed(species);
    if (passes === MAX_PASSES) throw new Error(CIRCULAR);

    passes = 0;
    let moreAdded = true;
    while (passes <= MAX_PASSES && moreAdded) {
      passes++;
      moreAdded = false;
      for (const equation of this) {
        const hasAll = Object.keys(equation.components).every((component) =>
          speciesSet.has(component),
        );
        if (hasAll && !newSet.has(equation)) {
          newSet.add(equation);
          speciesSet.add(equation.formed);
          moreAdded = true;
        }
      }
    }
    if (passes === MAX_PASSES) throw new Error(CIRCULAR);

    newSet.#disabledKeys = new Set(this.#disabledKeys);
    newSet.#normalized = this.#normalized;
    return newSet;
  }
}

const MAX_PASSES = 10;
const CIRCULAR = 'You might have a circular dependency in your equations';

function normalize(
  equations: Equation[],
): Array<Equation | EquationData | undefined> {
  const size = equations.length;
  const newEquations = new Array<Equation | EquationData | undefined>(
    size,
  ).fill(undefined);
  const needs = new Array<number[] | undefined>(size);

  for (let i = 0; i < size; i++) {
    const equation = equations[i] as Equation;
    if (isIndependent(equations, i)) {
      newEquations[i] = equation;
    } else {
      needs[i] = Object.keys(equation.components).map((key) =>
        equations.findIndex((eq) => eq.formed === key),
      );
    }
  }

  let iteration = 0;
  while (!allDefined(newEquations) && iteration < MAX_PASSES) {
    for (let i = 0; i < size; i++) {
      if (!newEquations[i] && allDefined(newEquations, needs[i])) {
        newEquations[i] = substitute(equations, equations[i] as Equation);
      }
    }
    iteration++;
  }
  if (!allDefined(newEquations)) {
    throw new Error('There may be a circular dependency in the equations');
  }
  return newEquations;
}

function isIndependent(equations: Equation[], index: number): boolean {
  const keys = Object.keys((equations[index] as Equation).components);
  for (const key of keys) {
    if (equations.some((equation) => equation.formed === key)) return false;
  }
  return true;
}

function allDefined(
  equations: Array<Equation | EquationData | undefined>,
  indices?: number[],
): boolean {
  if (indices !== undefined) {
    return !indices.some((i) => i !== -1 && !equations[i]);
  }
  return !equations.includes(undefined);
}

function substitute(equations: Equation[], equation: Equation): EquationData {
  const result: EquationData = {
    type: equation.type,
    formed: equation.formed,
    components: {},
    pK: 0,
  };
  substituteInto(equations, equation, result, 1);
  return result;
}

function substituteInto(
  equations: Equation[],
  equation: Equation | EquationData,
  target: EquationData,
  factor: number,
): void {
  for (const [key, coefficient] of Object.entries(equation.components)) {
    const scaled = factor * coefficient;
    const replacement = equations.find((eq) => eq.formed === key);
    if (replacement) {
      substituteInto(equations, replacement, target, scaled);
    } else {
      target.components[key] = (target.components[key] ?? 0) + scaled;
    }
  }
  target.pK += factor * equation.pK;
}

function getHash(id: string): string {
  return btoa(id);
}
