import { expect, test } from 'vitest';

import { isStrongAcid, strongAcidPh, weakAcidPh } from '../simplifiedPh.ts';

test('a strong acid gives pH = -log C', () => {
  expect(strongAcidPh(0.1)).toBeCloseTo(1, 12);
  expect(strongAcidPh(1)).toBeCloseTo(0, 12);
  expect(strongAcidPh(0.001)).toBeCloseTo(3, 12);
  expect(strongAcidPh(0.005)).toBeCloseTo(2.3, 2);
  expect(strongAcidPh(0.05)).toBeCloseTo(1.3, 2);
});

test('a weak acid gives pH = (pKa - log C) / 2', () => {
  expect(weakAcidPh(3.2, 0.05)).toBeCloseTo(2.25, 2);
  expect(weakAcidPh(4.7, 0.1)).toBeCloseTo(2.85, 12);
  expect(weakAcidPh(3.2, 0.001)).toBeCloseTo(3.1, 12);
  expect(weakAcidPh(4.7, 1)).toBeCloseTo(2.35, 12);
});

test('the two formulas part at the pKa of H3O+', () => {
  expect(isStrongAcid(-5.2)).toBe(true);
  expect(isStrongAcid(-2.2)).toBe(true);
  expect(isStrongAcid(-1.7)).toBe(false);
  expect(isStrongAcid(3.2)).toBe(false);
  expect(isStrongAcid(4.7)).toBe(false);
});
