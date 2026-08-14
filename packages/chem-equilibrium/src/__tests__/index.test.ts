import { expect, test } from 'vitest';

import * as lib from '../index.ts';
import { Equilibrium, Helper, Serie } from '../index.ts';

import { value } from './data/solutionValue.ts';

test('exposes exactly the public API, with no default export', () => {
  expect(Object.keys(lib).toSorted()).toStrictEqual([
    'Equation',
    'EquationSet',
    'Equilibrium',
    'Helper',
    'Serie',
    'database',
    'newtonRaphton',
    'speciesNames',
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
  expect(value(solution, 'CH3COO-')).toBeCloseTo(0.5, 9);
  expect(value(solution, 'CH3CO2H')).toBeCloseTo(0.5, 9);
});
