import type { SelectedSpecies } from '../components/SpeciesPicker.tsx';

/**
 * Written in the URL for a selection that is deliberately empty, because an
 * empty parameter is dropped from the hash and would read as "use the default".
 */
const EMPTY = 'none';

/** Separates one `label:quantity` pair from the next. */
const PAIR_SEPARATOR = ',';

/** Separates a label from its amount. No species label contains one. */
const AMOUNT_SEPARATOR = ':';

/**
 * Serialize a selection into a single, readable query parameter, such as
 * `Ag+:0.01,NH3:0.1`.
 * @param species - What the user put in the solution.
 * @returns The encoded selection, never empty.
 */
export function encodeSpecies(species: SelectedSpecies[]): string {
  if (species.length === 0) return EMPTY;
  const parts: string[] = [];
  for (const entry of species) {
    parts.push(`${entry.label}${AMOUNT_SEPARATOR}${entry.quantity}`);
  }
  return parts.join(PAIR_SEPARATOR);
}

/**
 * Read a selection back from the URL.
 *
 * Anything that does not parse cleanly falls back to the default rather than
 * dropping a species silently: a link a student pasted half of must open on a
 * working tool, not on a subtly different system.
 * @param value - Raw query parameter.
 * @param fallback - Selection to use when the parameter is absent or malformed.
 * @returns The decoded selection.
 */
export function decodeSpecies(
  value: string | undefined,
  fallback: SelectedSpecies[],
): SelectedSpecies[] {
  if (value === undefined || value === '') return fallback;
  if (value === EMPTY) return [];

  const species: SelectedSpecies[] = [];
  for (const part of value.split(PAIR_SEPARATOR)) {
    const separator = part.lastIndexOf(AMOUNT_SEPARATOR);
    if (separator <= 0) return fallback;
    const label = part.slice(0, separator);
    const amount = part.slice(separator + 1).trim();
    const quantity = Number(amount);
    if (amount === '' || !Number.isFinite(quantity) || quantity < 0) {
      return fallback;
    }
    species.push({ label, quantity });
  }
  return species;
}

/**
 * Serialize a list of labels, for the equilibria that are switched off.
 * @param labels - Labels to write.
 * @returns The encoded list, or `undefined` when there is nothing to write.
 */
export function encodeLabels(labels: string[]): string | undefined {
  return labels.length === 0 ? undefined : labels.join(PAIR_SEPARATOR);
}

/**
 * Read a list of labels back from the URL.
 * @param value - Raw query parameter.
 * @returns The labels, empty when the parameter is absent.
 */
export function decodeLabels(value: string | undefined): string[] {
  if (value === undefined || value === '') return [];
  return value.split(PAIR_SEPARATOR).filter((label) => label !== '');
}
