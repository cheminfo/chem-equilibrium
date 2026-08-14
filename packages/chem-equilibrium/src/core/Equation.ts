import type { EquationData, EquationType } from '../types.ts';

const types = new Set<EquationType>([
  'acidoBasic',
  'precipitation',
  'complexation',
]);

/** A single equilibrium: one formed species, its components and its pK. */
export class Equation {
  readonly #eq: EquationData;

  /**
   * Validate an equilibrium and take ownership of a copy of it.
   * @param eq - The equilibrium to wrap. It is copied, never referenced.
   */
  constructor(eq: EquationData) {
    if (typeof eq.formed !== 'string') {
      throw new Error('equation expects a property "formed" that is a string');
    }
    if (typeof eq.pK !== 'number') {
      throw new Error('equation expects a property "pK" that is a number');
    }
    if (!types.has(eq.type)) throw new Error('Unexpected type');
    if (Object.prototype.toString.call(eq.components) !== '[object Object]') {
      throw new Error('Unexpected components');
    }
    if (Object.keys(eq.components).length === 0) {
      throw new Error('Components is expected to have at least one key');
    }

    this.#eq = copyEquation(eq);
  }

  /**
   * Return `eq` as an Equation, cloning it when it already is one.
   * @param eq - An equation or its plain description.
   * @returns An Equation that no one else holds a reference to.
   */
  static create(eq: Equation | EquationData): Equation {
    return eq instanceof Equation ? eq.clone() : new Equation(eq);
  }

  get pK(): number {
    return this.#eq.pK;
  }

  get formed(): string {
    return this.#eq.formed;
  }

  get components(): Record<string, number> {
    return this.#eq.components;
  }

  get type(): EquationType {
    return this.#eq.type;
  }

  clone(): Equation {
    return new Equation(this.#eq);
  }

  toJSON(): EquationData {
    return copyEquation(this.#eq);
  }

  /**
   * Get a new representation of the equation that no longer mentions the solvent.
   *
   * The solvent has unit activity, so it cannot appear in a mass action law.
   * When it is a component it is simply dropped; when it is the formed species
   * the equation is inverted, which is how `H2O ⇄ OH- + H+` becomes the
   * definition of `OH-` from `H+`.
   * @param solvent - Label of the solvent.
   * @returns A new equation without the solvent, or a clone when it did not appear.
   */
  withSolvent(solvent: string): Equation {
    const components = this.#eq.components;
    const compKeys = Object.keys(components);

    if (this.#eq.formed === solvent) {
      const [firstKey, ...rest] = compKeys;
      if (firstKey === undefined) {
        throw new Error('Components is expected to have at least one key');
      }
      const inverted: Record<string, number> = {};
      for (const key of rest) {
        inverted[key] = -(components[key] as number);
      }
      return new Equation({
        formed: firstKey,
        components: inverted,
        pK: -this.#eq.pK,
        type: this.#eq.type,
      });
    }

    if (!compKeys.includes(solvent)) return this.clone();

    const { [solvent]: _solvent, ...withoutSolvent } = components;
    return new Equation({ ...this.#eq, components: withoutSolvent });
  }
}

function copyEquation(eq: EquationData): EquationData {
  return {
    formed: eq.formed,
    components: { ...eq.components },
    pK: eq.pK,
    type: eq.type,
  };
}
