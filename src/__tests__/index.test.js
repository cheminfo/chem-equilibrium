import { expect, test } from 'vitest';

import Equilibrium, {
  Equilibrium as NamedEquilibrium,
  Helper,
  Serie,
} from '../index.js';

test('exposes Equilibrium as the default and as a named export', () => {
  expect(typeof Equilibrium).toBe('function');
  expect(NamedEquilibrium).toBe(Equilibrium);
});

test('exposes Helper and Serie, also as static properties of Equilibrium', () => {
  expect(typeof Helper).toBe('function');
  expect(typeof Serie).toBe('function');
  expect(Equilibrium.Helper).toBe(Helper);
  expect(Equilibrium.Serie).toBe(Serie);
});

test('solves an acid/base equilibrium through the public entry point', () => {
  const helper = new Equilibrium.Helper();
  helper.addSpecie('CH3COO-', 1);
  helper.setAtEquilibrium('H+', 10 ** -4.7);
  const solution = helper.getEquilibrium().solveRobust();

  // at pH = pKa both forms are equimolar
  expect(solution['CH3COO-']).toBeCloseTo(0.5, 9);
  expect(solution.CH3CO2H).toBeCloseTo(0.5, 9);
});
