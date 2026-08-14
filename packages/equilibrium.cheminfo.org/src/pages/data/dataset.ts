import type { DatabaseEntry, EquationType } from 'chem-equilibrium';
import { database, speciesNames } from 'chem-equilibrium';

import { matchesSpecies, nameOf } from '../../chemistry/species.ts';

/** Every equilibrium the site solves with, in the order of the source table. */
export const EQUILIBRIA: DatabaseEntry[] = database;

/** How many equilibria the bundled database holds. */
export const ENTRY_COUNT = EQUILIBRIA.length;

/** How many equilibria carry no literature reference. */
export const MISSING_SOURCE_COUNT = countMissing((entry) => !entry.source);

/** How many equilibria carry no measurement temperature. */
export const MISSING_TEMPERATURE_COUNT = countMissing(
  (entry) => entry.temperature === undefined,
);

/** The equilibria whose value or notation needs a caveat. */
export const WARNED_ENTRIES: DatabaseEntry[] = EQUILIBRIA.filter(
  (entry) => entry.warning !== undefined,
);

/** The three kinds of equilibria, in the order the filter shows them. */
export const EQUATION_TYPES: EquationType[] = [
  'acidoBasic',
  'complexation',
  'precipitation',
];

/** How each kind is named in the interface. */
export const TYPE_LABELS: Record<EquationType, string> = {
  acidoBasic: 'acid/base',
  complexation: 'complexation',
  precipitation: 'precipitation',
};

/** Kinds of equilibria for which not a single entry cites a source. */
export const TYPES_WITHOUT_SOURCE = typesFullyMissing((entry) => !entry.source);

/** Kinds of equilibria for which not a single entry records a temperature. */
export const TYPES_WITHOUT_TEMPERATURE = typesFullyMissing(
  (entry) => entry.temperature === undefined,
);

/** The constant a chemist expects to read for a given kind of equilibrium. */
export interface DerivedConstant {
  /** Name of the logarithmic constant, e.g. `pKa`. */
  pName: string;
  /** Name of the constant itself, e.g. `Ka`. */
  name: string;
  /** That constant, formatted as a power of ten. */
  value: string;
}

/**
 * Name and value of the constant that belongs to an equilibrium.
 *
 * Every `pK` of the table is the logarithm of the same formation constant, but
 * it is read under three different names depending on the kind of equilibrium.
 * @param entry - The equilibrium.
 * @returns How its constant should be named and displayed.
 */
export function derivedConstant(entry: DatabaseEntry): DerivedConstant {
  if (entry.type === 'complexation') {
    return { pName: 'log β', name: 'β', value: formatPower(entry.pK) };
  }
  if (entry.type === 'precipitation') {
    return { pName: 'pKs', name: 'Ksp', value: formatPower(-entry.pK) };
  }
  return { pName: 'pKa', name: 'Ka', value: formatPower(-entry.pK) };
}

/**
 * Every species label an equilibrium mentions.
 * @param entry - The equilibrium.
 * @returns The formed species followed by its components.
 */
export function labelsOf(entry: DatabaseEntry): string[] {
  return [entry.formed, ...Object.keys(entry.components)];
}

/**
 * Match an equilibrium against the free-text search.
 * @param entry - The equilibrium.
 * @param query - What the user typed.
 * @returns Whether any species it involves matches.
 */
export function matchesEntry(entry: DatabaseEntry, query: string): boolean {
  for (const label of labelsOf(entry)) {
    if (matchesSpecies(label, query)) return true;
  }
  return false;
}

/** One line of the species tab. */
export interface SpeciesRow {
  label: string;
  name?: string;
  alternatives: string[];
  /** Charge carried by the label, as the database writes it. */
  charge: number;
  /** Equilibria in which the species is the formed one. */
  formedIn: number;
  /** Equilibria in which the species is consumed as a component. */
  componentIn: number;
}

/** Every species of the database, alphabetically. */
export const SPECIES_ROWS: SpeciesRow[] = buildSpeciesRows();

/**
 * The charge a label declares, counted from the signs it ends with.
 * @param label - Species label, e.g. `CO3--`.
 * @returns The charge, `0` when the label carries no sign.
 */
export function chargeOf(label: string): number {
  const match = /(?<signs>\++|-+)$/.exec(label);
  const signs = match?.groups?.signs;
  if (!signs) return 0;
  return signs.startsWith('+') ? signs.length : -signs.length;
}

/**
 * Format a charge the way it is read out loud.
 * @param charge - The charge.
 * @returns `0`, `+2`, `−3`…
 */
export function formatCharge(charge: number): string {
  if (charge === 0) return '0';
  return charge > 0 ? `+${charge}` : `−${-charge}`;
}

/**
 * Write a power of ten the way a table of constants does.
 * @param exponent - Base-10 logarithm of the value.
 * @returns The value as `1.29 × 10⁻⁵`.
 */
export function formatPower(exponent: number): string {
  const [mantissa = '1', power = '0'] = (10 ** exponent)
    .toExponential(2)
    .split('e');
  return `${mantissa} × 10${superscript(power)}`;
}

function superscript(value: string): string {
  let result = '';
  for (const character of value.replace('+', '')) {
    result += SUPERSCRIPTS[character] ?? character;
  }
  return result;
}

const SUPERSCRIPTS: Record<string, string> = {
  '-': '⁻',
  0: '⁰',
  1: '¹',
  2: '²',
  3: '³',
  4: '⁴',
  5: '⁵',
  6: '⁶',
  7: '⁷',
  8: '⁸',
  9: '⁹',
};

function buildSpeciesRows(): SpeciesRow[] {
  const rows = new Map<string, SpeciesRow>();
  for (const entry of EQUILIBRIA) {
    countLabel(rows, entry.formed, 'formedIn');
    for (const component of Object.keys(entry.components)) {
      countLabel(rows, component, 'componentIn');
    }
  }
  return Array.from(rows.values()).toSorted((a, b) =>
    a.label.localeCompare(b.label),
  );
}

function countLabel(
  rows: Map<string, SpeciesRow>,
  label: string,
  key: 'formedIn' | 'componentIn',
): void {
  const existing = rows.get(label);
  if (existing) {
    existing[key] += 1;
    return;
  }
  rows.set(label, {
    label,
    name: nameOf(label),
    alternatives: speciesNames[label]?.alternatives ?? [],
    charge: chargeOf(label),
    formedIn: key === 'formedIn' ? 1 : 0,
    componentIn: key === 'componentIn' ? 1 : 0,
  });
}

/**
 * Name a list of equilibrium kinds the way a sentence reads them.
 * @param types - The kinds to name.
 * @returns For instance `acid/base and precipitation`.
 */
export function joinTypeLabels(types: EquationType[]): string {
  const labels = types.map((type) => TYPE_LABELS[type]);
  if (labels.length < 2) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1) ?? ''}`;
}

function typesFullyMissing(
  predicate: (entry: DatabaseEntry) => boolean,
): EquationType[] {
  return EQUATION_TYPES.filter((type) =>
    EQUILIBRIA.every((entry) => entry.type !== type || predicate(entry)),
  );
}

function countMissing(predicate: (entry: DatabaseEntry) => boolean): number {
  let count = 0;
  for (const entry of EQUILIBRIA) {
    if (predicate(entry)) count += 1;
  }
  return count;
}
