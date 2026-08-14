import { phOf } from '../../../chemistry/format.ts';
import type { ExerciseQuestion } from '../../../chemistry/randomSeries.ts';
import {
  isStrongAcid,
  strongAcidPh,
  weakAcidPh,
} from '../../../chemistry/simplifiedPh.ts';
import { runSingleSolve } from '../../../chemistry/solve.ts';
import type { AcidKind } from '../../../data/exercises.ts';

/** A question together with both pH values it can be discussed with. */
export interface SolvedExercise {
  question: ExerciseQuestion;
  /** Which closed form applies, which is the first thing the student decides. */
  kind: AcidKind;
  /** pH from that closed form; the answer is graded against it. */
  simplified: number;
  /** pH from the full multi-equilibrium solve, `undefined` when it failed. */
  exact: number | undefined;
}

/**
 * Attach the taught value and the exact value to every question of a series.
 *
 * Both are computed up front: a series is at most a hundred questions, each one
 * solve of a two-species system, so the whole set is ready before the student
 * clicks anything.
 * @param series - The generated questions.
 * @returns The same questions, with their two pH values.
 */
export function solveSeries(series: ExerciseQuestion[]): SolvedExercise[] {
  const solved: SolvedExercise[] = [];
  for (const question of series) {
    const kind: AcidKind = isStrongAcid(question.pK) ? 'strong' : 'weak';
    const simplified =
      kind === 'strong'
        ? strongAcidPh(question.concentration)
        : weakAcidPh(question.pK, question.concentration);
    const { solution } = runSingleSolve([
      { label: question.formed, quantity: question.concentration },
    ]);
    solved.push({ question, kind, simplified, exact: phOf(solution) });
  }
  return solved;
}
