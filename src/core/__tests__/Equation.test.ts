import { expect, test } from 'vitest';

import type { EquationType } from '../../types.ts';
import { Equation } from '../Equation.ts';

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

test('the constructor rejects a malformed equilibrium', () => {
  const valid = {
    formed: 'A',
    components: { B: 1 },
    pK: 1,
    type: 'acidoBasic',
  } as const;

  expect(
    () => new Equation({ ...valid, formed: 1 as unknown as string }),
  ).toThrow('equation expects a property "formed" that is a string');
  expect(
    () => new Equation({ ...valid, pK: '1' as unknown as number }),
  ).toThrow('equation expects a property "pK" that is a number');
  expect(
    () => new Equation({ ...valid, type: 'redox' as unknown as EquationType }),
  ).toThrow('Unexpected type');
  expect(
    () =>
      new Equation({
        ...valid,
        components: [] as unknown as Record<string, number>,
      }),
  ).toThrow('Unexpected components');
  expect(() => new Equation({ ...valid, components: {} })).toThrow(
    'Components is expected to have at least one key',
  );
});

test('withSolvent rejects an equilibrium left without components', () => {
  const water = new Equation({
    formed: 'OH-',
    components: { H2O: 1 },
    pK: -14,
    type: 'acidoBasic',
  });

  expect(() => water.withSolvent('H2O')).toThrow(
    'Components is expected to have at least one key',
  );
});
