import { expect, test } from 'vitest';

import { buildHash, parseHash } from '../../router/location.ts';
import type { WorkbenchPreset, WorkbenchState } from '../workbenchPreset.ts';
import { createWorkbenchCodec, sweepAxisLabel } from '../workbenchPreset.ts';

const DEFAULTS: WorkbenchState = {
  species: [{ label: 'Ag+', quantity: 0.01 }],
  disabled: [],
  varying: 'H+',
  isFixed: true,
  log: true,
  from: 0,
  to: 14,
  logY: true,
  tolerance: 1e-15,
  solidTolerance: 1e-10,
  maxIterations: 200,
  chunks: 500,
};

const FIXED_SWEEP: WorkbenchPreset = {
  path: '/precipitation',
  title: 'Precipitation',
  description: null,
  available: [],
  defaults: DEFAULTS,
};

const FREE_SWEEP: WorkbenchPreset = { ...FIXED_SWEEP, exposeSweep: true };

/**
 * Push a state through the URL exactly as the tools do.
 * @param preset - The tool the state belongs to.
 * @param state - The state to round-trip.
 * @returns What comes back out of the URL.
 */
function throughUrl(
  preset: WorkbenchPreset,
  state: WorkbenchState,
): WorkbenchState {
  const codec = createWorkbenchCodec(preset);
  const hash = buildHash(preset.path, codec.encode(state));
  return codec.decode(parseHash(hash).query, preset.defaults);
}

test('the default state writes no query at all', () => {
  const codec = createWorkbenchCodec(FREE_SWEEP);

  expect(buildHash(FREE_SWEEP.path, codec.encode(DEFAULTS))).toBe(
    '#/precipitation',
  );
  expect(throughUrl(FREE_SWEEP, DEFAULTS)).toStrictEqual(DEFAULTS);
});

test('every exposed parameter survives the round trip', () => {
  const state: WorkbenchState = {
    species: [
      { label: 'Ag+', quantity: 0.02 },
      { label: 'NH3', quantity: 0.1 },
    ],
    disabled: ['Ag(NH3)2+'],
    varying: 'Ag+',
    isFixed: false,
    log: false,
    from: 1e-7,
    to: 0.5,
    logY: false,
    tolerance: 1e-12,
    solidTolerance: 1e-8,
    maxIterations: 400,
    chunks: 250,
  };

  expect(throughUrl(FREE_SWEEP, state)).toStrictEqual(state);
});

test('a hard-wired sweep keeps its own parameters out of the URL', () => {
  const state: WorkbenchState = { ...DEFAULTS, varying: 'Ag+', to: 7 };
  const codec = createWorkbenchCodec(FIXED_SWEEP);

  expect(buildHash(FIXED_SWEEP.path, codec.encode(state))).toBe(
    '#/precipitation',
  );
  expect(throughUrl(FIXED_SWEEP, state)).toStrictEqual(DEFAULTS);
});

test('the abscissa is named after what is actually swept', () => {
  expect(sweepAxisLabel('H+', true, true)).toBe('pH');
  expect(sweepAxisLabel('Ag+', true, true)).toBe('pAg+');
  expect(sweepAxisLabel('Ag+', true, false)).toBe(
    '[Ag+] at equilibrium (mol/L)',
  );
  expect(sweepAxisLabel('CO3--', false, false)).toBe('Total CO3-- (mol/L)');
  expect(sweepAxisLabel('CO3--', false, true)).toBe('p(total CO3--)');
});
