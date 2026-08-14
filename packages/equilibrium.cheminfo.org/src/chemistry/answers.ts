/** How far a typed pH may sit from the expected one and still count as right. */
export const ANSWER_TOLERANCE = 0.05;

/** The four states an answer box can be in. */
export type AnswerStatus = 'unanswered' | 'invalid' | 'wrong' | 'solved';

/** The verdict on what the student typed. */
export interface AnswerCheck {
  status: AnswerStatus;
  /** The parsed pH, when the input was a number. */
  value?: number;
  /** What is wrong with the input, when it could not be read at all. */
  message?: string;
}

/**
 * Read a pH out of what the student typed.
 *
 * A comma is accepted as the decimal separator: it is what most of Europe types,
 * and `parseFloat` would otherwise read `2,85` as 2.
 * @param raw - The raw content of the answer box.
 * @returns The number, or `undefined` when the input is not one.
 */
export function parseAnswer(raw: string): number | undefined {
  const trimmed = raw.trim().replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/iu.test(trimmed)) {
    return undefined;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Grade an answer against the value the simplified formula gives.
 *
 * Grading against the closed form rather than against the exact solve is
 * deliberate: the closed form is what the exercise teaches, and the two differ
 * by more than the tolerance for a dilute weak acid.
 * @param raw - The raw content of the answer box.
 * @param expected - pH the simplified formula gives.
 * @returns The status, the parsed value, and a message when the input is unreadable.
 */
export function checkAnswer(raw: string, expected: number): AnswerCheck {
  if (raw.trim() === '') return { status: 'unanswered' };

  const value = parseAnswer(raw);
  if (value === undefined) {
    return {
      status: 'invalid',
      message:
        'That is not a number. Type the pH only, for example 2.85 — a comma works too.',
    };
  }

  const solved = Math.abs(value - expected) <= ANSWER_TOLERANCE + 1e-9;
  return { status: solved ? 'solved' : 'wrong', value };
}
