import { expect, test } from 'vitest';

import { seededRandom } from '../../__tests__/data/seededRandom.ts';
import { converged, value } from '../../__tests__/data/solutionValue.ts';
import type {
  Model,
  ModelComponent,
  ModelFormedSpecies,
  Solution,
} from '../../types.ts';
import { Equilibrium } from '../Equilibrium.ts';

function acetateModel(ph: number): Model {
  return {
    components: [
      { label: 'H+', atEquilibrium: 10 ** -ph },
      { label: 'CH3COO-', total: 1 },
    ],
    formedSpecies: [
      { label: 'OH-', beta: 10 ** -14, components: [-1, 0] },
      { label: 'CH3COOH', beta: 10 ** 4.75, components: [1, 1] },
    ],
  };
}

test('at pH = pKa the acid and its conjugated base are equimolar', () => {
  const eq = new Equilibrium(acetateModel(4.75), { random: seededRandom(42) });
  eq.setInitial({ 'CH3COO-': 0.5 });
  const solution = eq.solve();

  expect(value(solution, 'CH3COO-')).toBeCloseTo(0.5, 12);
  expect(value(solution, 'CH3COOH')).toBeCloseTo(0.5, 12);
  expect(value(solution, 'H+')).toBeCloseTo(10 ** -4.75, 15);
  expect(value(solution, 'OH-') / 5.62341325190349e-10).toBeCloseTo(1, 9);
  // mass balance on the acetate
  expect(value(solution, 'CH3COO-') + value(solution, 'CH3COOH')).toBeCloseTo(
    1,
    12,
  );
});

test('the fixed component is reported back at its imposed concentration', () => {
  const eq = new Equilibrium(acetateModel(2), { random: seededRandom(1) });
  const solution = eq.solveRobust();

  expect(value(solution, 'H+')).toBe(0.01);
  expect(value(solution, 'CH3COO-') + value(solution, 'CH3COOH')).toBeCloseTo(
    1,
    12,
  );
  // well below the pKa, the acidic form dominates
  expect(value(solution, 'CH3COOH')).toBeGreaterThan(0.99);
});

test('phosphoric acid speciation follows the pH', () => {
  const protons: ModelComponent = { label: 'H+', atEquilibrium: 1 };
  const model: Model = {
    components: [protons, { label: 'PO4---', total: 1 }],
    formedSpecies: [
      { label: 'OH-', beta: 10 ** -14, components: [-1, 0] },
      { label: 'H3PO4', beta: 10 ** 21.69, components: [3, 1] },
      { label: 'H2PO4-', beta: 10 ** 19.53, components: [2, 1] },
      { label: 'HPO4--', beta: 10 ** 12.32, components: [1, 1] },
    ],
  };

  const solutions: Solution[] = [];
  let previous: Solution = { 'PO4---': 1e-20 };
  for (let ph = 0; ph <= 14; ph++) {
    protons.atEquilibrium = 10 ** -ph;
    const eq = new Equilibrium(model, { random: seededRandom(7) });
    eq.setInitial(previous);
    previous = converged(eq.solve());
    solutions.push(previous);
  }

  expect(solutions).toHaveLength(15);

  // pH 0: fully protonated
  expect(value(solutions[0], 'H3PO4') / 0.9931292240233103).toBeCloseTo(1, 9);
  expect(value(solutions[0], 'H2PO4-') / 0.006870775553040164).toBeCloseTo(
    1,
    9,
  );
  expect(value(solutions[0], 'PO4---') / 2.027709620648592e-22).toBeCloseTo(
    1,
    9,
  );

  // pH 7: H2PO4- / HPO4-- buffer region
  expect(value(solutions[7], 'H2PO4-') / 0.6185774619693667).toBeCloseTo(1, 9);
  expect(value(solutions[7], 'HPO4--') / 0.3814117713144719).toBeCloseTo(1, 9);

  // pH 14: fully deprotonated
  expect(value(solutions[14], 'PO4---') / 0.979534617810611).toBeCloseTo(1, 9);
  expect(value(solutions[14], 'HPO4--') / 0.02046537887029301).toBeCloseTo(
    1,
    9,
  );

  // phosphate is conserved at every pH
  for (const solution of solutions) {
    const total =
      value(solution, 'PO4---') +
      value(solution, 'HPO4--') +
      value(solution, 'H2PO4-') +
      value(solution, 'H3PO4');

    expect(total).toBeCloseTo(1, 9);
  }
});

test('solveRobust converges on a system with a precipitate', () => {
  const eq = new Equilibrium(
    {
      components: [
        { label: 'Ag+', total: 1 },
        { label: 'Cl-', total: 1 },
      ],
      formedSpecies: [
        { label: 'AgCl2-', beta: 10 ** 5.26, components: [1, 2] },
        { label: 'AgCl', beta: 1 / 1.77e-10, components: [1, 1], solid: true },
      ],
    },
    { random: seededRandom(1234) },
  );
  const solution = eq.solveRobust();

  expect(value(solution, 'Ag+') / 1.3305983920629563e-5).toBeCloseTo(1, 9);
  expect(value(solution, 'Cl-') / 1.330555526094898e-5).toBeCloseTo(1, 9);
  expect(value(solution, 'AgCl2-') / 4.286600402043179e-10).toBeCloseTo(1, 9);
  expect(value(solution, 'AgCl') / 0.9999866935874194).toBeCloseTo(1, 9);
});

test('rejects a model with duplicated labels', () => {
  expect(
    () =>
      new Equilibrium({
        components: [
          { label: 'A', total: 1 },
          { label: 'A', total: 1 },
        ],
        formedSpecies: [],
      }),
  ).toThrow('Labels should be unique');
});

test('rejects a component without total nor atEquilibrium', () => {
  expect(
    () =>
      new Equilibrium({
        components: [{ label: 'A' }],
        formedSpecies: [],
      }),
  ).toThrow(
    'Component should have a property total or atEquilibrium that is a number',
  );
});

test('rejects a formed specie without beta', () => {
  // the guard protects JavaScript callers, who can omit the required beta
  const withoutBeta: Partial<ModelFormedSpecies> = {
    label: 'B',
    components: [1],
  };

  expect(
    () =>
      new Equilibrium({
        components: [{ label: 'A', total: 1 }],
        formedSpecies: [withoutBeta as ModelFormedSpecies],
      }),
  ).toThrow('All formed species should have a beta property');
});
