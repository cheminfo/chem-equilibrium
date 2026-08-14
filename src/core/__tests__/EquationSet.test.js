import { expect, test } from 'vitest';

import {
  circularEquations,
  equations1,
  equations2,
  equations3,
  equations4,
} from '../../__tests__/data/equations.js';
import EquationSet from '../EquationSet.js';

test('should clone an equation set', () => {
  const eqSet = new EquationSet(equations1);
  const newSet = eqSet.clone();

  expect([...newSet.keys()]).toStrictEqual([...eqSet.keys()]);
});

test('should create and normalize an equation set (no inter-dependencies)', () => {
  const eqSet = new EquationSet(equations1);
  const norm = eqSet.getNormalized('E');

  expect(norm.size).toBe(2);
});

test('should create and normalize an equation set (with inter-dependencies, example 1)', () => {
  const eqSet = new EquationSet(equations2);
  const norm = eqSet.getNormalized('E');

  expect(norm.size).toBe(2);

  const A = norm.get('A', true);
  const B = norm.get('B', true);

  expect(A.pK).toBe(8);
  expect(B.pK).toBe(3);
});

test('should create and normalize an equation set (with inter-dependencies, example 2)', () => {
  const eqSet = new EquationSet(equations3);
  const norm = eqSet.getNormalized('E');

  expect(norm.size).toBe(2);

  const A = norm.get('A', true);
  const B = norm.get('B', true);

  expect(A.pK).toBe(1);
  expect(B.pK).toBe(3);
});

test('should get a subset of an equation set', () => {
  const eqSet = new EquationSet(equations4);
  const subSet = eqSet.getSubset(['C', 'D']);

  expect(subSet.size).toBe(2);
});

test('should get subset of an equation set', () => {
  const eqSet = new EquationSet(equations2);
  const subSet = eqSet.getSubset(['A']);

  expect(subSet.size).toBe(2);
});

test('should get the model given the totals', () => {
  const eqSet = new EquationSet(equations2);
  const normSet = eqSet.getNormalized('E');
  const model = normSet.getModel({ A: 1 });

  expect(model.components).toStrictEqual([
    { label: 'C', total: 2 },
    { label: 'D', total: 2 },
  ]);
  expect(model.formedSpecies).toStrictEqual([
    {
      solid: false,
      label: 'A',
      beta: 10 ** 8,
      components: [2, 2],
    },
    {
      solid: false,
      label: 'B',
      beta: 10 ** 3,
      components: [1, 1],
    },
  ]);
});

test('should throw when normalizing an equations set with a circular dependency', () => {
  const eqSet = new EquationSet(circularEquations);

  expect(() => eqSet.getNormalized()).toThrow(/circular/);
});
