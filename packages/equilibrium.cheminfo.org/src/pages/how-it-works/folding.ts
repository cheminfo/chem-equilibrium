import type { Solution } from 'chem-equilibrium';

import { buildHelper } from '../../chemistry/solve.ts';

/** One member of an acid family, on the basis normalization left behind. */
export interface FamilyMember {
  label: string;
  /** How many protons the species carries above the terminal component. */
  protons: number;
  /** Formation constant from the terminal component and `H+`. */
  beta: number;
}

/** An acid family, reduced to what the folding needs. */
export interface FamilySystem {
  /** The terminal component the whole family is written from. */
  componentLabel: string;
  /** Every species of the family, the component itself first. */
  members: FamilyMember[];
  /** Analytical total of the family, in mol/L. */
  total: number;
}

/** A family member once the imposed proton concentration has been folded in. */
export interface FoldedMember extends FamilyMember {
  /** `beta * [H+]^protons`, the constant of the reduced system. */
  folded: number;
  /** Fraction of the family carried by this species. */
  fraction: number;
  /** Concentration implied by the fraction, in mol/L. */
  concentration: number;
}

/**
 * Read an acid family off the database.
 *
 * Only species built from a single unit of the terminal component are kept, so
 * that fixing the proton really does leave a linear system.
 * @param seed - Species to put in the flask, e.g. `CO3--`.
 * @param total - Analytical total, in mol/L.
 * @returns The family, or `null` when the seed does not produce a simple one.
 */
export function buildFamily(seed: string, total: number): FamilySystem | null {
  const helper = buildHelper([{ label: seed, quantity: total }]);
  const model = helper.getModel();
  if (model.components.length !== 2) return null;

  const protonIndex = model.components.findIndex(
    (component) => component.label === 'H+',
  );
  if (protonIndex === -1) return null;
  const familyIndex = protonIndex === 0 ? 1 : 0;
  const componentLabel = model.components[familyIndex]?.label;
  if (componentLabel === undefined) return null;

  const members: FamilyMember[] = [
    { label: componentLabel, protons: 0, beta: 1 },
  ];
  for (const species of model.formedSpecies) {
    if (species.solid) continue;
    if (species.components[familyIndex] !== 1) continue;
    members.push({
      label: species.label,
      protons: species.components[protonIndex] ?? 0,
      beta: species.beta,
    });
  }

  return { componentLabel, members, total };
}

/**
 * Fold an imposed proton concentration into every formation constant.
 *
 * Once `[H+]` is a constant, `beta * [C]^1 * [H+]^n` is just `beta' * [C]`, so
 * the mass balance becomes one linear equation in one unknown.
 * @param family - The family to reduce.
 * @param ph - The imposed pH.
 * @returns Every member with its folded constant, fraction and concentration.
 */
export function foldAt(family: FamilySystem, ph: number): FoldedMember[] {
  const proton = 10 ** -ph;
  const folded = new Array<number>(family.members.length).fill(0);
  let sum = 0;
  for (let i = 0; i < family.members.length; i++) {
    const member = family.members[i];
    const value = member ? member.beta * proton ** member.protons : 0;
    folded[i] = value;
    sum += value;
  }

  const result: FoldedMember[] = [];
  for (let i = 0; i < family.members.length; i++) {
    const member = family.members[i];
    if (!member) continue;
    const value = folded[i] ?? 0;
    const fraction = sum > 0 ? value / sum : Number.NaN;
    result.push({
      ...member,
      folded: value,
      fraction,
      concentration: fraction * family.total,
    });
  }
  return result;
}

/**
 * The same speciation, obtained from the solver instead of from the algebra.
 * @param seed - Species to put in the flask.
 * @param total - Analytical total, in mol/L.
 * @param ph - The imposed pH.
 * @returns The solved concentrations, or `null` when it did not converge.
 */
export function solveAtFixedPh(
  seed: string,
  total: number,
  ph: number,
): Solution | null {
  try {
    const helper = buildHelper([{ label: seed, quantity: total }]);
    helper.setAtEquilibrium('H+', 10 ** -ph);
    return helper.getEquilibrium().solveRobust();
  } catch {
    return null;
  }
}

/**
 * Fraction of every family member over a whole pH range, from the algebra alone.
 * @param family - The family to reduce.
 * @param count - Number of pH values, evenly spread over 0 to 14.
 * @returns The pH axis and one curve per member.
 */
export function fractionCurves(
  family: FamilySystem,
  count = 141,
): { ph: number[]; curves: Array<{ label: string; y: number[] }> } {
  const ph = new Array<number>(count).fill(0);
  const curves = family.members.map((member) => ({
    label: member.label,
    y: new Array<number>(count).fill(0),
  }));

  for (let point = 0; point < count; point++) {
    const value = (14 * point) / (count - 1);
    ph[point] = value;
    const folded = foldAt(family, value);
    for (let i = 0; i < curves.length; i++) {
      const target = curves[i];
      if (target) target.y[point] = folded[i]?.fraction ?? Number.NaN;
    }
  }

  return { ph, curves };
}
