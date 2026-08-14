/*
 * Regenerate `src/data/database.ts` and `src/data/speciesNames.ts` from the
 * tables vendored next to this script.
 *
 *   node data/update.ts            regenerate from the vendored tables
 *   node data/update.ts --fetch    also download the upstream sheet and report
 *                                  how it differs from the vendored table
 *
 * The vendored `formation-constants.tsv` is the source of truth: it carries
 * corrections that were never applied upstream, so it is never overwritten.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import Papa from 'papaparse';

import type { DatabaseEntry, EquationType } from '../src/types.ts';

const UPSTREAM_SHEET =
  'https://googledocs.cheminfo.org/spreadsheets/d/1VjfiuDtJUqxdfyFr7DdVcIM-l3eh47SqanafHdbXvDQ/export?format=tsv';

const TYPES: EquationType[] = ['acidoBasic', 'complexation', 'precipitation'];

const dataDir = import.meta.dirname;
const srcDataDir = join(dataDir, '..', 'src', 'data');

interface Row {
  type: string;
  subType: string;
  formed: string;
  componentA: string;
  componentB: string;
  pK: string;
  temperature: string;
  source: string;
  warning: string;
  active: string;
}

interface SpeciesName {
  label: string;
  name: string;
  alternatives?: string[];
}

const entries = readEntries();
writeFileSync(join(srcDataDir, 'database.ts'), renderDatabase(entries), 'utf8');
writeFileSync(
  join(srcDataDir, 'speciesNames.ts'),
  renderSpeciesNames(readSpeciesNames(), entries),
  'utf8',
);
process.stdout.write(`wrote ${entries.length} equilibria\n`);

if (process.argv.includes('--fetch')) {
  await reportUpstreamDifferences(entries);
}

function readEntries(): DatabaseEntry[] {
  const text = readFileSync(join(dataDir, 'formation-constants.tsv'), 'utf8');
  const parsed = Papa.parse<Row>(text, {
    header: true,
    delimiter: '\t',
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `could not parse formation-constants.tsv: ${parsed.errors[0]?.message}`,
    );
  }

  const entries: DatabaseEntry[] = [];
  for (const row of parsed.data) {
    if (row.active !== 'yes') continue;
    const pK = Number(row.pK);
    if (!Number.isFinite(pK)) {
      throw new Error(`${row.formed}: pK is not a number (${row.pK})`);
    }
    const [labelA, coefficientA] = parseComponent(row.componentA);
    const [labelB, coefficientB] = parseComponent(row.componentB);
    if (!labelA || !labelB) {
      throw new Error(`${row.formed}: a component is missing`);
    }

    const entry: DatabaseEntry = {
      formed: row.formed,
      components: { [labelA]: coefficientA, [labelB]: coefficientB },
      pK,
      type: asType(row.type, row.formed),
    };
    if (row.subType) entry.subType = row.subType;
    if (row.temperature) entry.temperature = Number(row.temperature);
    if (row.source) entry.source = row.source;
    if (row.warning) entry.warning = row.warning;
    entries.push(entry);
  }

  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.formed)) {
      throw new Error(`${entry.formed} is declared twice`);
    }
    seen.add(entry.formed);
  }
  return entries;
}

/**
 * Split `"2 OH-"` into its coefficient and its label.
 * @param cell - A component cell of the table.
 * @returns The label and its stoichiometric coefficient.
 */
function parseComponent(cell: string): [string, number] {
  const match = /^\s*(?<coefficient>\d*)\s*(?<label>.*?)\s*$/.exec(cell);
  const groups = match?.groups;
  if (!groups) return ['', 1];
  return [
    groups.label ?? '',
    groups.coefficient ? Number(groups.coefficient) : 1,
  ];
}

function asType(type: string, formed: string): EquationType {
  const known = TYPES.find((candidate) => candidate === type);
  if (known) return known;
  throw new Error(`${formed}: unknown equilibrium type "${type}"`);
}

function readSpeciesNames(): SpeciesName[] {
  try {
    return JSON.parse(
      readFileSync(join(dataDir, 'species-names.json'), 'utf8'),
    ) as SpeciesName[];
  } catch {
    process.stdout.write(
      'species-names.json is missing, names will be empty\n',
    );
    return [];
  }
}

function renderDatabase(entries: DatabaseEntry[]): string {
  return `${header()}import type { DatabaseEntry } from '../types.ts';

/**
 * Formation constants, generated from \`data/formation-constants.tsv\`.
 *
 * \`pK\` is the base-10 logarithm of the formation constant of \`formed\` from
 * its components, so \`beta = 10 ** pK\`. For an acid/base couple that is the
 * pKa; for a precipitation equilibrium it is \`-log10(Ksp)\`.
 */
export const database: DatabaseEntry[] = ${JSON.stringify(entries, null, 2)};
`;
}

function renderSpeciesNames(
  names: SpeciesName[],
  entries: DatabaseEntry[],
): string {
  const labels = new Set<string>();
  for (const entry of entries) {
    labels.add(entry.formed);
    for (const component of Object.keys(entry.components)) {
      labels.add(component);
    }
  }

  const record: Record<string, { name: string; alternatives?: string[] }> = {};
  for (const { label, name, alternatives } of names) {
    if (!labels.has(label)) continue;
    record[label] = alternatives?.length ? { name, alternatives } : { name };
  }

  return `${header()}/** English name of every species of the database, for searching and labelling. */
export const speciesNames: Record<
  string,
  { name: string; alternatives?: string[] }
> = ${JSON.stringify(record, null, 2)};
`;
}

function header(): string {
  return '// Generated by `npm run database`. Do not edit.\n\n';
}

/**
 * Download the upstream spreadsheet and report how it differs from the
 * vendored table, without touching anything.
 * @param entries - The entries currently vendored.
 */
async function reportUpstreamDifferences(
  entries: DatabaseEntry[],
): Promise<void> {
  const response = await fetch(UPSTREAM_SHEET);
  if (!response.ok) {
    throw new Error(
      `could not download the sheet: ${response.status} ${response.statusText}`,
    );
  }
  const parsed = Papa.parse<Record<string, string>>(await response.text(), {
    header: true,
    delimiter: '\t',
    skipEmptyLines: true,
  });

  const vendored = new Map(entries.map((entry) => [entry.formed, entry]));
  const upstream = new Set<string>();
  const differences: string[] = [];
  for (const row of parsed.data) {
    if (row.Active === 'no') continue;
    const formed = row.AB ?? '';
    upstream.add(formed);
    const entry = vendored.get(formed);
    if (!entry) {
      differences.push(`only upstream: ${formed} (pK ${row.pk})`);
    } else if (Number(row.pk) !== entry.pK) {
      differences.push(
        `${formed}: upstream pK ${row.pk}, vendored ${entry.pK}`,
      );
    }
  }
  for (const formed of vendored.keys()) {
    if (!upstream.has(formed)) differences.push(`only vendored: ${formed}`);
  }

  process.stdout.write(
    differences.length === 0
      ? 'the vendored table matches the upstream sheet\n'
      : `${differences.length} differences with the upstream sheet:\n${differences.map((line) => `  ${line}\n`).join('')}`,
  );
}
