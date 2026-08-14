import { expect, test } from 'vitest';

import type { SelectedSpecies } from '../../components/SpeciesPicker.tsx';
import { buildHash, parseHash } from '../../router/location.ts';
import {
  decodeLabels,
  decodeSpecies,
  encodeLabels,
  encodeSpecies,
} from '../speciesParam.ts';

const FALLBACK: SelectedSpecies[] = [{ label: 'CO3--', quantity: 0.1 }];

/**
 * Send a selection through the query parameter exactly as the tools do, hash
 * escaping included.
 * @param species - The selection to round-trip.
 * @returns What comes back out of the URL.
 */
function throughUrl(species: SelectedSpecies[]): SelectedSpecies[] {
  const hash = buildHash('/equilibrium', { s: encodeSpecies(species) });
  return decodeSpecies(parseHash(hash).query.s, FALLBACK);
}

test('an empty selection survives the round trip', () => {
  expect(encodeSpecies([])).toBe('none');
  expect(throughUrl([])).toStrictEqual([]);
});

test('one species', () => {
  const species: SelectedSpecies[] = [{ label: 'CO3--', quantity: 0.1 }];

  expect(encodeSpecies(species)).toBe('CO3--:0.1');
  expect(throughUrl(species)).toStrictEqual(species);
});

test('several species', () => {
  const species: SelectedSpecies[] = [
    { label: 'Ag+', quantity: 0.01 },
    { label: 'NH3', quantity: 0.1 },
    { label: 'H2O', quantity: 0 },
  ];

  expect(encodeSpecies(species)).toBe('Ag+:0.01,NH3:0.1,H2O:0');
  expect(throughUrl(species)).toStrictEqual(species);
});

test('labels carrying charges and parentheses', () => {
  const species: SelectedSpecies[] = [
    { label: '(C2H5)3NH+', quantity: 0.25 },
    { label: 'PO4---', quantity: 1e-7 },
    { label: 'Ag(CN)2-', quantity: 2 },
  ];

  expect(encodeSpecies(species)).toBe('(C2H5)3NH+:0.25,PO4---:1e-7,Ag(CN)2-:2');

  const hash = buildHash('/equilibrium', { s: encodeSpecies(species) });

  expect(hash).toBe(
    '#/equilibrium?s=%28C2H5%293NH%2B%3A0.25%2CPO4---%3A1e-7%2CAg%28CN%292-%3A2',
  );
  expect(throughUrl(species)).toStrictEqual(species);
});

test('a malformed parameter falls back to the default', () => {
  expect(decodeSpecies('CO3--', FALLBACK)).toStrictEqual(FALLBACK);
  expect(decodeSpecies('CO3--:', FALLBACK)).toStrictEqual(FALLBACK);
  expect(decodeSpecies('CO3--:abc', FALLBACK)).toStrictEqual(FALLBACK);
  expect(decodeSpecies(':0.1', FALLBACK)).toStrictEqual(FALLBACK);
  expect(decodeSpecies('Ag+:-1', FALLBACK)).toStrictEqual(FALLBACK);
  expect(decodeSpecies('Ag+:0.01,NH3', FALLBACK)).toStrictEqual(FALLBACK);
  expect(decodeSpecies(undefined, FALLBACK)).toStrictEqual(FALLBACK);
  expect(decodeSpecies('', FALLBACK)).toStrictEqual(FALLBACK);
});

test('the list of switched-off equilibria', () => {
  expect(encodeLabels([])).toBeUndefined();
  expect(encodeLabels(['Ag(NH3)2+', 'AgOH'])).toBe('Ag(NH3)2+,AgOH');
  expect(decodeLabels('Ag(NH3)2+,AgOH')).toStrictEqual(['Ag(NH3)2+', 'AgOH']);
  expect(decodeLabels(undefined)).toStrictEqual([]);
  expect(decodeLabels('')).toStrictEqual([]);
  expect(decodeLabels('AgOH,,')).toStrictEqual(['AgOH']);
});
