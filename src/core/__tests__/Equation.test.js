import { expect, test } from 'vitest';

import Equation from '../Equation.js';

const eqA = new Equation({
  formed: 'A',
  components: {
    B: 1,
    C: 1,
  },
  pK: 1,
  type: 'acidoBasic',
});

test('solvent is the formed specie', () => {
  const eq = eqA.withSolvent('A');

  expect(eq.formed).toBe('B');
  expect(eq.components).toStrictEqual({ C: -1 });
  expect(eq.pK).toBe(-1);
  expect(eq.type).toBe('acidoBasic');
});

test('solvent is a component', () => {
  const eq = eqA.withSolvent('B');

  expect(eq.formed).toBe('A');
  expect(eq.components).toStrictEqual({ C: 1 });
  expect(eq.pK).toBe(1);
  expect(eq.type).toBe('acidoBasic');
});

test('solvent is not in the equation', () => {
  const eq = eqA.withSolvent('D');

  expect(eq.formed).toBe('A');
  expect(eq.components).toStrictEqual({ B: 1, C: 1 });
  expect(eq.pK).toBe(1);
  expect(eq.type).toBe('acidoBasic');
});
