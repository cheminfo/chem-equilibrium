import type { Solution } from 'chem-equilibrium';

/**
 * Read one concentration out of a solution.
 * @param solution - Result of a solve, or `null` when it did not converge.
 * @param label - Species to read.
 * @returns The concentration, or `undefined` when it is not part of the system.
 */
export function concentrationOf(
  solution: Solution | null | undefined,
  label: string,
): number | undefined {
  return solution?.[label];
}

/**
 * The pH of a solution.
 * @param solution - Result of a solve.
 * @returns The pH, or `undefined` when the system has no proton.
 */
export function phOf(
  solution: Solution | null | undefined,
): number | undefined {
  const proton = solution?.['H+'];
  return proton === undefined || proton <= 0 ? undefined : -Math.log10(proton);
}

/**
 * Format a concentration the way a chemist reads one: four significant digits,
 * switching to scientific notation once the value leaves the readable range.
 * @param value - Concentration in mol/L.
 * @returns The formatted value, or `—` when there is nothing to show.
 */
export function formatConcentration(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const magnitude = Math.abs(value);
  if (magnitude >= 1e-4 && magnitude < 1e5) {
    return value.toPrecision(4).replace(/\.?0+$/, '');
  }
  return value.toExponential(3);
}

/**
 * Format the cologarithm of a concentration, the `pX` a student is used to.
 * @param value - Concentration in mol/L.
 * @param digits - Decimals to keep.
 * @returns The formatted value, or `—` when it is not defined.
 */
export function formatP(value: number | undefined, digits = 2): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return '—';
  return (-Math.log10(value)).toFixed(digits);
}

/**
 * Format a number of millilitres.
 * @param litres - Volume in litres.
 * @returns The volume in millilitres, with four significant digits.
 */
export function formatMillilitres(litres: number | undefined): string {
  if (litres === undefined || !Number.isFinite(litres)) return '—';
  return `${(litres * 1000).toPrecision(4).replace(/\.?0+$/, '')} mL`;
}

/**
 * Format a pK for a table, dropping the trailing zeros the source table carries.
 * @param pK - The constant.
 * @returns The formatted value.
 */
export function formatPK(pK: number): string {
  return Number.isInteger(pK) ? pK.toString() : pK.toFixed(2).replace(/0$/, '');
}
