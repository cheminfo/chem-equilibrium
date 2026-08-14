/**
 * The two closed-form pH formulas a first-year course drills, kept apart from
 * the solver so the exact result and the approximation can be shown side by
 * side.
 */

/**
 * pH of a strong acid: it is levelled by water, so every mole of acid releases
 * a mole of protons and the proton the water itself releases is negligible.
 * @param concentration - Analytical concentration of the acid, in mol/L.
 * @returns The pH given by `pH = -log10(C)`, infinite at zero concentration.
 */
export function strongAcidPh(concentration: number): number {
  return -Math.log10(concentration);
}

/**
 * pH of a weak acid, under the two approximations of the course: the acid is
 * barely dissociated, so its equilibrium concentration is still `C`, and water
 * releases no proton of its own.
 * @param pKa - pKa of the couple.
 * @param concentration - Analytical concentration of the acid, in mol/L.
 * @returns The pH given by `pH = (pKa - log10(C)) / 2`.
 */
export function weakAcidPh(pKa: number, concentration: number): number {
  return (pKa - Math.log10(concentration)) / 2;
}

/**
 * The pKa below which water levels an acid completely, which is what decides
 * between the two formulas. The threshold sits just above the pKa of H3O+,
 * −1.74.
 */
export const LEVELLING_PK = -1.7;

/**
 * Whether a couple is levelled by water.
 * @param pKa - pKa of the couple.
 * @returns Whether the acid counts as strong.
 */
export function isStrongAcid(pKa: number): boolean {
  return pKa < LEVELLING_PK;
}
