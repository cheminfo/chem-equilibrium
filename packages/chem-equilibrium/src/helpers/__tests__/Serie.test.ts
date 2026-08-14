import { expect, test } from 'vitest';

import { seededRandom } from '../../__tests__/data/seededRandom.ts';
import { at, value } from '../../__tests__/data/solutionValue.ts';
import { Helper } from '../Helper.ts';
import type { SweepOptions } from '../Serie.ts';
import { Serie } from '../Serie.ts';

test('getSolutions sweeps the pH and keeps acetate conserved', () => {
  const helper = new Helper();
  helper.addSpecie('CH3COO-', 1);
  const serie = new Serie(helper);

  const result = serie.getSolutions({
    varying: 'H+',
    isFixed: true,
    log: true,
    from: 0,
    to: 14,
    chunks: 14,
    random: seededRandom(2024),
  });

  expect(result.errorCount).toBe(0);
  expect(result.x).toStrictEqual([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  ]);
  expect(result.species).toStrictEqual(['CH3COO-', 'OH-', 'CH3CO2H', 'H+']);
  expect(result.solutions).toHaveLength(15);

  // strongly acidic: the acid dominates
  expect(
    value(result.solutions[0], 'CH3COO-') / 1.9952225050461358e-5,
  ).toBeCloseTo(1, 9);
  expect(
    value(result.solutions[0], 'CH3CO2H') / 0.9999800477749495,
  ).toBeCloseTo(1, 9);

  // around the pKa (4.7) the two forms are comparable
  expect(
    value(result.solutions[5], 'CH3COO-') / 0.6661394245831219,
  ).toBeCloseTo(1, 9);
  expect(value(result.solutions[5], 'CH3CO2H') / 0.333860575416878).toBeCloseTo(
    1,
    9,
  );

  // strongly basic: the conjugated base dominates
  expect(
    value(result.solutions[14], 'CH3COO-') / 0.9999999994988128,
  ).toBeCloseTo(1, 9);

  for (const solution of result.solutions) {
    expect(value(solution, 'CH3COO-') + value(solution, 'CH3CO2H')).toBeCloseTo(
      1,
      9,
    );
  }
});

test('getTitration returns a decreasing pH curve', () => {
  const helper = new Helper();
  const serie = new Serie(helper);

  const result = serie.getTitration({
    solution: { type: 'CH3COO-', concentration: 0.1, volume: 0.05 },
    titrationSolution: { type: 'H+', concentration: 0.1, volume: 0.1 },
    chunks: 10,
    random: seededRandom(555),
  });

  expect(result.errorCount).toBe(0);
  expect(result.volumes).toHaveLength(11);
  expect(result.xy).toHaveLength(22);
  expect(result.species).toStrictEqual(['H+', 'CH3COO-', 'OH-', 'CH3CO2H']);

  const ph: number[] = [];
  for (let i = 1; i < result.xy.length; i += 2) {
    ph.push(at(result.xy, i));
  }

  expect(ph[0]).toBeCloseTo(8.850027953970796, 9);
  // the equivalence point is at 0.05 L of titrant (equal amounts of acid)
  expect(result.volumes[5]).toBeCloseTo(0.05, 12);
  expect(ph[5]).toBeCloseTo(3.0048527213601277, 9);
  expect(ph[10]).toBeCloseTo(1.476861683532796, 9);

  // adding a strong acid can only lower the pH
  for (let i = 1; i < ph.length; i++) {
    expect(ph[i]).toBeLessThan(at(ph, i - 1));
  }
});

test('getSolutions rejects an inverted range', () => {
  const serie = new Serie(new Helper());

  expect(() => serie.getSolutions({ varying: 'H+', from: 5, to: 1 })).toThrow(
    'property "to" should be larger than "from"',
  );
});

test('getSolutions rejects a missing varying specie', () => {
  const serie = new Serie(new Helper());
  // the guard protects JavaScript callers, who can omit the required varying
  const withoutVarying: Partial<SweepOptions> = { from: 0, to: 1 };

  expect(() => serie.getSolutions(withoutVarying as SweepOptions)).toThrow(
    'property "varying" is not defined',
  );
});
