import type { DatabaseEntry } from 'chem-equilibrium';
import { database } from 'chem-equilibrium';

/** One question of the drill: an acid, its equilibrium, and a concentration. */
export interface ExerciseQuestion {
  /** Position in the series, starting at 1. */
  index: number;
  /** Label of the acid the student is given. */
  formed: string;
  /** Conjugate base and proton released, as the equilibrium is written. */
  components: Record<string, number>;
  /** pKa of the couple. */
  pK: number;
  /** Analytical concentration of the acid, in mol/L. */
  concentration: number;
}

/**
 * The acids the drill draws from: four that water levels completely and eight
 * that are only partly dissociated. All of them release a single proton in the
 * range a first course covers, so exactly one of the two simplified formulas
 * applies to every question.
 */
export const EXERCISE_ACIDS: string[] = [
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
];

/** The concentrations a question can be asked at, in mol/L. */
export const EXERCISE_CONCENTRATIONS: number[] = [
  0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1,
];

/** The database entries of {@link EXERCISE_ACIDS}, in that order. */
export const EXERCISE_ENTRIES: DatabaseEntry[] = collectEntries();

/** How many distinct questions exist, which is what a series cannot exceed. */
export const MAX_SERIES_LENGTH =
  EXERCISE_ENTRIES.length * EXERCISE_CONCENTRATIONS.length;

/**
 * Build the series of questions a seed stands for.
 *
 * The seed is what makes an exercise set shareable: a teacher sends the link,
 * and every student gets exactly the same questions in the same order.
 * @param seed - Any integer; the same seed always yields the same series.
 * @param count - How many questions to draw, capped at {@link MAX_SERIES_LENGTH}.
 * @returns The questions, numbered from 1, with no repeated acid/concentration pair.
 */
export function generateSeries(
  seed: number,
  count: number,
): ExerciseQuestion[] {
  const wanted = Math.max(0, Math.min(Math.floor(count), MAX_SERIES_LENGTH));
  const random = mulberry32(seed);
  const concentrationCount = EXERCISE_CONCENTRATIONS.length;
  const used = new Set<number>();
  const questions: ExerciseQuestion[] = [];

  for (let index = 0; index < wanted; index++) {
    let pair = -1;
    for (let attempt = 0; attempt < 50 && pair === -1; attempt++) {
      const candidate =
        Math.floor(random() * EXERCISE_ENTRIES.length) * concentrationCount +
        Math.floor(random() * concentrationCount);
      if (!used.has(candidate)) pair = candidate;
    }
    // A late draw can keep colliding; take the first free pair rather than
    // returning a series shorter than the student asked for.
    for (
      let candidate = 0;
      pair === -1 && candidate < MAX_SERIES_LENGTH;
      candidate++
    ) {
      if (!used.has(candidate)) pair = candidate;
    }
    used.add(pair);

    const entry = itemAt(
      EXERCISE_ENTRIES,
      Math.floor(pair / concentrationCount),
    );
    questions.push({
      index: index + 1,
      formed: entry.formed,
      components: entry.components,
      pK: entry.pK,
      concentration: itemAt(EXERCISE_CONCENTRATIONS, pair % concentrationCount),
    });
  }

  return questions;
}

/**
 * Mulberry32, a 32-bit generator small enough to carry its whole state in the
 * URL as one number.
 * @param seed - Any integer.
 * @returns A function yielding numbers in `[0, 1)`.
 */
export function mulberry32(seed: number): () => number {
  let state = Math.trunc(seed) >>> 0;
  return () => {
    state = (state + 0x6d_2b_79_f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Draw a seed for a fresh series.
 * @returns A positive integer that fits in the URL.
 */
export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

function collectEntries(): DatabaseEntry[] {
  const entries: DatabaseEntry[] = [];
  for (const label of EXERCISE_ACIDS) {
    const entry = database.find(
      (candidate) =>
        candidate.type === 'acidoBasic' && candidate.formed === label,
    );
    if (entry) entries.push(entry);
  }
  return entries;
}

function itemAt<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new RangeError(`index ${index} is out of range`);
  }
  return item;
}
