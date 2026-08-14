import { expect, test } from 'vitest';

import {
  EXERCISE_ACIDS,
  EXERCISE_CONCENTRATIONS,
  EXERCISE_ENTRIES,
  MAX_SERIES_LENGTH,
  generateSeries,
  mulberry32,
} from '../randomSeries.ts';

test('the pool holds every acid a first course drills', () => {
  expect(EXERCISE_ENTRIES).toHaveLength(EXERCISE_ACIDS.length);
  expect(EXERCISE_ENTRIES.map((entry) => entry.formed)).toStrictEqual([
    'HCl',
    'HBr',
    'HI',
    'HClO4',
    'HF',
    'HCO2H',
    'C6H5COOH',
    'CH3CO2H',
    'C5H5NH+',
    'HClO',
    'HCN',
    'NH4+',
  ]);
  expect(MAX_SERIES_LENGTH).toBe(84);
});

test('the same seed always gives the same series', () => {
  expect(generateSeries(42, 20)).toStrictEqual(generateSeries(42, 20));
});

test('a series is reproducible question by question', () => {
  const series = generateSeries(42, 20);

  expect(series).toHaveLength(20);
  expect(series[0]).toStrictEqual({
    index: 1,
    formed: 'CH3CO2H',
    components: { 'CH3COO-': 1, 'H+': 1 },
    pK: 4.7,
    concentration: 0.05,
  });
  expect(series[1]).toStrictEqual({
    index: 2,
    formed: 'HCN',
    components: { 'CN-': 1, 'H+': 1 },
    pK: 9.2,
    concentration: 0.1,
  });
  expect(series[2]).toStrictEqual({
    index: 3,
    formed: 'HI',
    components: { 'I-': 1, 'H+': 1 },
    pK: -10,
    concentration: 0.05,
  });
});

test('another seed gives another series', () => {
  const first = generateSeries(1, 20);
  const second = generateSeries(2, 20);
  const differing = first.filter(
    (question, index) =>
      question.formed !== second[index]?.formed ||
      question.concentration !== second[index]?.concentration,
  );

  expect(differing.length).toBeGreaterThan(10);
});

test('a series never repeats an acid at the same concentration', () => {
  const series = generateSeries(7, 40);
  const keys = new Set(
    series.map((question) => `${question.formed}-${question.concentration}`),
  );

  expect(keys.size).toBe(40);
});

test('every question draws from the declared pool', () => {
  for (const question of generateSeries(123, MAX_SERIES_LENGTH)) {
    expect(EXERCISE_ACIDS).toContain(question.formed);
    expect(EXERCISE_CONCENTRATIONS).toContain(question.concentration);
    expect(question.components['H+']).toBe(1);
  }
});

test('a series is numbered from one and capped at the number of distinct questions', () => {
  const series = generateSeries(3, 500);

  expect(series).toHaveLength(MAX_SERIES_LENGTH);
  expect(series[0]?.index).toBe(1);
  expect(series.at(-1)?.index).toBe(MAX_SERIES_LENGTH);
  expect(generateSeries(3, 0)).toStrictEqual([]);
});

test('mulberry32 is reproducible and stays in range', () => {
  const first = mulberry32(1);
  const second = mulberry32(1);
  const values: number[] = [];
  for (let index = 0; index < 500; index++) {
    const value = first();

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
    expect(second()).toBe(value);

    values.push(value);
  }

  expect(values.slice(0, 3)).toStrictEqual([
    0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
  ]);
  expect(mulberry32(2)()).not.toBe(values[0]);
});
