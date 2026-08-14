import type { DatabaseEntry } from 'chem-equilibrium';
import { database, speciesNames } from 'chem-equilibrium';

/**
 * Rewrite a species label into the charge notation `mf-parser` reads correctly.
 *
 * The database writes charges as repeated signs (`CO3--`). `mf-parser` reads a
 * trailing `-` that follows a digit as part of that digit and drops the charge
 * without complaining, so `CO3--` would render as a neutral `CO₃`. The
 * parenthesised form is unambiguous for both signs.
 * @param label - Species label as stored in the database.
 * @returns A label that renders correctly, for display only.
 */
export function normalizeMF(label: string): string {
  return label
    .replaceAll('(en)', '(C2H8N2)')
    .replace(/(?<sign>\++|-+)$/, (signs) => `(${signs[0]}${signs.length})`);
}

/**
 * The English name of a species, when the database knows one.
 * @param label - Species label.
 * @returns The name, or `undefined`.
 */
export function nameOf(label: string): string | undefined {
  return speciesNames[label]?.name;
}

/**
 * Every string a species should be findable by: its formula, its name and the
 * synonyms a student may type instead.
 * @param label - Species label.
 * @returns The searchable terms, lowercased.
 */
export function searchTermsOf(label: string): string[] {
  const entry = speciesNames[label];
  return [label, entry?.name ?? '', ...(entry?.alternatives ?? [])]
    .filter(Boolean)
    .map((term) => term.toLowerCase());
}

/**
 * Match a species against a free-text query, on formula or on name.
 * @param label - Species label.
 * @param query - What the user typed.
 * @returns Whether the species should be shown.
 */
export function matchesSpecies(label: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return searchTermsOf(label).some((term) => term.includes(needle));
}

/** Every species label of the bundled database, sorted. */
export const ALL_SPECIES: string[] = collectSpecies(database);

/** The acid/base species, which are what the pH tools offer. */
export const ACID_BASE_SPECIES: string[] = collectSpecies(
  database.filter((entry) => entry.type === 'acidoBasic'),
);

/**
 * List every label an equation set mentions, formed species and components.
 * @param entries - Database entries to scan.
 * @returns The sorted, deduplicated labels.
 */
export function collectSpecies(entries: DatabaseEntry[]): string[] {
  const labels = new Set<string>();
  for (const entry of entries) {
    labels.add(entry.formed);
    for (const component of Object.keys(entry.components)) {
      labels.add(component);
    }
  }
  return Array.from(labels).toSorted((a, b) => a.localeCompare(b));
}

/**
 * Where a couple sits relative to the water levelling window, which is what the
 * colour banding of the acid list conveys.
 * @param pK - pKa of the couple.
 * @returns The band it belongs to.
 */
export function strengthBand(pK: number): StrengthBand {
  if (pK < -1.6) return 'strong-acid';
  if (pK < 6.9) return 'weak-acid';
  if (pK < 7.1) return 'neutral';
  if (pK < 15.6) return 'weak-base';
  return 'strong-base';
}

export type StrengthBand =
  'strong-acid' | 'weak-acid' | 'neutral' | 'weak-base' | 'strong-base';

/** Colour and wording of each band, matching the historical pKa chart. */
export const STRENGTH_BANDS: Record<
  StrengthBand,
  { color: string; label: string; description: string }
> = {
  'strong-acid': {
    color: '#fdd2d2',
    label: 'Strong acid',
    description:
      'Levelled by water: fully dissociated, and its conjugate base is a spectator.',
  },
  'weak-acid': {
    color: '#fcd6ff',
    label: 'Weak acid',
    description: 'Partly dissociated; a solution of the acid is acidic.',
  },
  neutral: {
    color: '#d1d3ff',
    label: 'pKa ≈ 7',
    description: 'The couple sits at neutrality.',
  },
  'weak-base': {
    color: '#d0fdd4',
    label: 'Weak acid, basic conjugate',
    description:
      'Barely dissociated; a solution of the conjugate base is clearly basic.',
  },
  'strong-base': {
    color: '#ffffe5',
    label: 'Very weak acid',
    description:
      'Its conjugate base is a strong base, levelled by water to hydroxide.',
  },
};
