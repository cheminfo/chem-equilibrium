import { expect, test } from 'vitest';

import { filterKeepingSelected } from '../keepSelected.ts';

const LABELS = ['Ag+', 'CO3--', 'NH3', 'NH4+'];

function startsWith(needle: string) {
  return (label: string) => label.startsWith(needle);
}

test('keeps only the matches when nothing is selected', () => {
  const result = filterKeepingSelected(LABELS, startsWith('NH'), () => false);

  expect(result).toStrictEqual({
    entries: ['NH3', 'NH4+'],
    matchCount: 2,
  });
});

test('shows the selected entries the query hides, first', () => {
  const selected = new Set(['Ag+', 'CO3--']);
  const result = filterKeepingSelected(LABELS, startsWith('NH'), (label) =>
    selected.has(label),
  );

  expect(result).toStrictEqual({
    entries: ['Ag+', 'CO3--', 'NH3', 'NH4+'],
    matchCount: 2,
  });
});

test('does not duplicate a selected entry that also matches', () => {
  const result = filterKeepingSelected(
    LABELS,
    startsWith('NH'),
    (label) => label === 'NH3',
  );

  expect(result).toStrictEqual({
    entries: ['NH3', 'NH4+'],
    matchCount: 2,
  });
});

test('reports no match while still showing the selection', () => {
  const result = filterKeepingSelected(
    LABELS,
    startsWith('Zn'),
    (label) => label === 'NH3',
  );

  expect(result).toStrictEqual({
    entries: ['NH3'],
    matchCount: 0,
  });
});
