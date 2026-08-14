import { expect, test } from 'vitest';

import * as lib from '../index.js';
import { Equilibrium, Helper, Serie } from '../index.js';

test('exposes exactly the public API, with no default export', () => {
  expect(Object.keys(lib).toSorted()).toStrictEqual([
    'Equilibrium',
    'Helper',
    'Serie',
  ]);
  expect(typeof Equilibrium).toBe('function');
  expect(typeof Helper).toBe('function');
  expect(typeof Serie).toBe('function');
});

test('solves an acid/base equilibrium through the public entry point', () => {
  const helper = new Helper();
  helper.addSpecie('CH3COO-', 1);
  helper.setAtEquilibrium('H+', 10 ** -4.7);
  const solution = helper.getEquilibrium().solveRobust();

  // at pH = pKa both forms are equimolar
  expect(solution['CH3COO-']).toBeCloseTo(0.5, 9);
  expect(solution.CH3CO2H).toBeCloseTo(0.5, 9);
});
