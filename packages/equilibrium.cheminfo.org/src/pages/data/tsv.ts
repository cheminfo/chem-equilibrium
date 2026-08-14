import type { DatabaseEntry } from 'chem-equilibrium';

import type { SpeciesRow } from './dataset.ts';
import { formatCharge } from './dataset.ts';

/**
 * The equilibria as a tab-separated table, ready to paste in a spreadsheet.
 * @param entries - Equilibria to write.
 * @returns The table, one equilibrium per line.
 */
export function equilibriaToTsv(entries: DatabaseEntry[]): string {
  const lines = [
    [
      'formed',
      'components',
      'pK',
      'type',
      'subType',
      'temperature/K',
      'source',
      'warning',
    ].join('\t'),
  ];
  for (const entry of entries) {
    lines.push(
      [
        entry.formed,
        formatComponents(entry.components),
        String(entry.pK),
        entry.type,
        entry.subType ?? '',
        entry.temperature === undefined ? '' : String(entry.temperature),
        entry.source ?? '',
        entry.warning ?? '',
      ].join('\t'),
    );
  }
  return lines.join('\n');
}

/**
 * The species as a tab-separated table.
 * @param rows - Species to write.
 * @returns The table, one species per line.
 */
export function speciesToTsv(rows: SpeciesRow[]): string {
  const lines = [
    ['species', 'name', 'synonyms', 'charge', 'formedIn', 'componentIn'].join(
      '\t',
    ),
  ];
  for (const row of rows) {
    lines.push(
      [
        row.label,
        row.name ?? '',
        row.alternatives.join('; '),
        formatCharge(row.charge),
        String(row.formedIn),
        String(row.componentIn),
      ].join('\t'),
    );
  }
  return lines.join('\n');
}

function formatComponents(components: Record<string, number>): string {
  return Object.entries(components)
    .map(([label, coefficient]) =>
      coefficient === 1 ? label : `${coefficient} ${label}`,
    )
    .join(' + ');
}
