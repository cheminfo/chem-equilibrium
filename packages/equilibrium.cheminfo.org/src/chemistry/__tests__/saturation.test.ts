import { Helper, Serie } from 'chem-equilibrium';
import { expect, test } from 'vitest';

import { findSaturationPoints } from '../saturation.ts';

/** AgOH ⇄ Ag+ + OH-, pK 7.72 is a formation constant, so Ksp is its inverse. */
const AGOH_KSP = 10 ** -7.72;

test('reports nothing when no solid forms', () => {
  expect(
    findSaturationPoints(
      [0, 1, 2],
      [{ 'H+': 1 }, { 'H+': 1 }, { 'H+': 1 }],
      [],
    ),
  ).toStrictEqual([]);
});

test('reports the first point at which a solid holds matter', () => {
  const points = findSaturationPoints(
    [0, 0.5, 1, 1.5],
    [{ AgCl: 0 }, { AgCl: 0 }, { AgCl: 0.02 }, { AgCl: 0.1 }],
    ['AgCl'],
  );

  expect(points).toStrictEqual([{ label: 'AgCl', at: 1, uncertainty: 0.5 }]);
});

test('orders several solids by where they appear', () => {
  const points = findSaturationPoints(
    [0, 1, 2],
    [
      { AgCl: 0, AgOH: 0 },
      { AgCl: 0, AgOH: 0.3 },
      { AgCl: 0.1, AgOH: 0.4 },
    ],
    ['AgCl', 'AgOH'],
  );

  expect(points.map((point) => point.label)).toStrictEqual(['AgOH', 'AgCl']);
});

test('the onset it reports is where the ion product reaches the solubility product', () => {
  const helper = new Helper();
  helper.addSpecie('Ag+', 1);
  helper.addSpecie('NH3', 1);
  const sweep = new Serie(helper).getSolutions({
    varying: 'H+',
    isFixed: true,
    log: true,
    from: 6,
    to: 7,
    chunks: 1000,
    solidTolerance: 1e-8,
    maxIterations: 200,
  });

  const [onset] = findSaturationPoints(sweep.x, sweep.solutions, ['AgOH']);

  expect(onset).toBeDefined();
  expect(onset?.at).toBeCloseTo(6.533, 2);

  const index = sweep.x.indexOf(onset?.at as number);
  const before = sweep.solutions[index - 1] as Record<string, number>;
  const at = sweep.solutions[index] as Record<string, number>;

  // Undersaturated on the last point without solid, saturated on the first with.
  expect((before['Ag+'] as number) * (before['OH-'] as number)).toBeLessThan(
    AGOH_KSP,
  );
  expect((at['Ag+'] as number) * (at['OH-'] as number)).toBeCloseTo(
    AGOH_KSP,
    12,
  );
});
