import { expect, test } from 'vitest';

import { EquationSet } from '../core/EquationSet.ts';
import { database as equations } from '../data/database.ts';

test('verify database can be initialized in an EquationSet', () => {
  const eqSet = new EquationSet(equations);

  expect(eqSet.size).toBe(equations.length);
});

test('verify database can be normalized in water', () => {
  const eqSet = new EquationSet(equations);
  const normalized = eqSet.getNormalized('H2O');

  expect(normalized.size).toBe(equations.length);
  expect(normalized.isNormalized()).toBe(true);
});
