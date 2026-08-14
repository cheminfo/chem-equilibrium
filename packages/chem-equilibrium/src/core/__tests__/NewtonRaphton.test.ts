import { expect, test } from 'vitest';

import { at } from '../../__tests__/data/solutionValue.ts';
import { newtonRaphton } from '../NewtonRaphton.ts';

test('solves a soluble system A + B <-> AB', () => {
  const beta = 1e5;
  const result = newtonRaphton(
    [
      [1, 0, 1],
      [0, 1, 1],
    ],
    [1, 1, beta],
    [0.01, 0.02],
    [0.001, 0.001],
  );
  const a = at(result, 0);
  const b = at(result, 1);
  const ab = at(result, 2);

  expect(a / 9.980059780896078e-6).toBeCloseTo(1, 9);
  expect(b / 0.010009980059780895).toBeCloseTo(1, 9);
  expect(ab / 0.009990019940219103).toBeCloseTo(1, 9);

  // mass balance
  expect(a + ab).toBeCloseTo(0.01, 12);
  expect(b + ab).toBeCloseTo(0.02, 12);
  // law of mass action
  expect(ab / (a * b) / beta).toBeCloseTo(1, 9);
});

test('solves AgCl precipitation', () => {
  const result = newtonRaphton(
    [
      [1, 0],
      [0, 1],
    ],
    [1, 1],
    [1, 1],
    [0.1, 0.1],
    [[1], [1]],
    [1.77e-10],
    [0],
  );
  const ag = at(result, 0);
  const cl = at(result, 1);
  const agClSolid = at(result, 2);

  expect(ag / 1.3471497603919887e-5).toBeCloseTo(1, 9);
  expect(cl / 1.3471497603919887e-5).toBeCloseTo(1, 9);
  expect(agClSolid / 0.9999865285023961).toBeCloseTo(1, 9);

  // essentially everything precipitated, mass is conserved
  expect(ag + agClSolid).toBeCloseTo(1, 12);
  expect(cl + agClSolid).toBeCloseTo(1, 12);
});

test('solves the FeCO3 system with a precipitate', () => {
  const result = newtonRaphton(
    [
      [1, 0, 0, 1, 1, -1],
      [0, 1, 0, 1, 2, 0],
      [0, 0, 1, 0, 0, 1],
    ],
    [1, 1, 1, 10 ** 10.33, 10 ** 16.63, 10 ** -14],
    [0.1, 0.1, 0],
    [0.01, 0.01, 0.01],
    [[1], [1], [0]],
    [10 ** -10.68],
    [0],
  );

  // CO3--, Fe++, H+, HCO3-, H2CO3, OH-, then the FeCO3 precipitate
  const expected = [
    0.0009477420066503485, 4.841711308415015e-9, 9.999999999894487e-16,
    0.09810452082841019, 0.000947737164939035, 1.0551394714726195e-26,
  ];

  expect(result).toHaveLength(expected.length + 1);

  for (const [i, reference] of expected.entries()) {
    expect(at(result, i) / reference).toBeCloseTo(1, 9);
  }

  // nothing precipitates: the solution stays undersaturated
  expect(at(result, 6)).toBe(0);
});

test('returns null when the algorithm does not converge', () => {
  const result = newtonRaphton(
    [
      [1, 0, 1],
      [0, 1, 1],
    ],
    [1, 1, 1e5],
    [0.01, 0.02],
    [0.001, 0.001],
    undefined,
    undefined,
    undefined,
    { maxIterations: 1 },
  );

  expect(result).toBeNull();
});

test('throws on inconsistent arguments', () => {
  expect(() =>
    newtonRaphton([[1, 0, 1]], [1, 1, 1e5], [0.01, 0.02], [0.001, 0.001]),
  ).toThrow('Invalid arguments');
});
