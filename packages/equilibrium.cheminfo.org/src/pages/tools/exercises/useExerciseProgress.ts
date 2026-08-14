import { useCallback, useState } from 'react';

/** Where every series a student worked on is kept, across reloads. */
const STORAGE_KEY = 'equilibrium:exercises:v1';

/** What is remembered about one question. */
export interface ExerciseProgress {
  /** What the student typed, exactly as typed. */
  answer: string;
  /** How many hints of the ladder were revealed. */
  hints: number;
  /** Whether the worked solution is showing. */
  solution: boolean;
}

/** A question nobody has touched yet. */
export const EMPTY_PROGRESS: ExerciseProgress = {
  answer: '',
  hints: 0,
  solution: false,
};

/** The stored state of one series, plus the ways to change it. */
export interface ExerciseProgressStore {
  entries: Record<number, ExerciseProgress>;
  setAnswer: (index: number, answer: string) => void;
  revealHint: (index: number) => void;
  setSolution: (index: number, shown: boolean) => void;
  resetQuestion: (index: number) => void;
  clearAll: () => void;
}

/**
 * Keep the answers, the revealed hints and the revealed solutions of one series.
 *
 * State is stored per seed, so a student can go back to a series a teacher sent
 * without the two sets mixing. Every access is best effort: a full or blocked
 * `localStorage` must never take the exercises down with it.
 * @param seed - Seed of the series being worked on.
 * @returns The stored state and the actions that write it.
 */
export function useExerciseProgress(seed: number): ExerciseProgressStore {
  const [entries, setEntries] = useState<Record<number, ExerciseProgress>>(() =>
    readSeries(seed),
  );

  const patch = useCallback(
    (index: number, change: Partial<ExerciseProgress>) => {
      const current = entries[index] ?? EMPTY_PROGRESS;
      const next = { ...entries, [index]: { ...current, ...change } };
      writeSeries(seed, next);
      setEntries(next);
    },
    [entries, seed],
  );

  const setAnswer = useCallback(
    (index: number, answer: string) => patch(index, { answer }),
    [patch],
  );

  const revealHint = useCallback(
    (index: number) =>
      patch(index, { hints: (entries[index]?.hints ?? 0) + 1 }),
    [entries, patch],
  );

  const setSolution = useCallback(
    (index: number, shown: boolean) => patch(index, { solution: shown }),
    [patch],
  );

  const resetQuestion = useCallback(
    (index: number) => patch(index, EMPTY_PROGRESS),
    [patch],
  );

  const clearAll = useCallback(() => {
    writeSeries(seed, {});
    setEntries({});
  }, [seed]);

  return {
    entries,
    setAnswer,
    revealHint,
    setSolution,
    resetQuestion,
    clearAll,
  };
}

function readSeries(seed: number): Record<number, ExerciseProgress> {
  const entries: Record<number, ExerciseProgress> = {};
  const stored = readAll()[String(seed)];
  if (!isRecord(stored)) return entries;

  for (const [key, value] of Object.entries(stored)) {
    const index = Number(key);
    if (!Number.isInteger(index) || !isRecord(value)) continue;
    entries[index] = {
      answer: typeof value.answer === 'string' ? value.answer : '',
      hints:
        typeof value.hints === 'number' && value.hints > 0
          ? Math.floor(value.hints)
          : 0,
      solution: value.solution === true,
    };
  }
  return entries;
}

function writeSeries(
  seed: number,
  entries: Record<number, ExerciseProgress>,
): void {
  const kept: Record<string, ExerciseProgress> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value.answer !== '' || value.hints > 0 || value.solution) {
      kept[key] = value;
    }
  }

  const key = String(seed);
  const all: Record<string, unknown> = {};
  for (const [storedKey, value] of Object.entries(readAll())) {
    if (storedKey !== key) all[storedKey] = value;
  }
  if (Object.keys(kept).length > 0) all[key] = kept;

  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Best effort: a full or blocked storage must not break the page.
  }
}

function readAll(): Record<string, unknown> {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : {};
  } catch {
    // Best effort: unreadable storage simply means a fresh start.
    return {};
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
