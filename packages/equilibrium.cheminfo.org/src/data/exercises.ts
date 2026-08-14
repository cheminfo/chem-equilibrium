import { formatConcentration, formatPK } from '../chemistry/format.ts';
import { LEVELLING_PK } from '../chemistry/simplifiedPh.ts';

/** Which of the two closed forms a question calls for. */
export type AcidKind = 'strong' | 'weak';

/** Everything a hint or a solution needs to know about one question. */
export interface ExerciseContext {
  /** pKa of the couple. */
  pK: number;
  /** Analytical concentration of the acid, in mol/L. */
  concentration: number;
  /** pH the simplified formula gives, which is what the answer is graded against. */
  ph: number;
}

/** A hint, built from the numbers of the question it belongs to. */
export type HintBuilder = (context: ExerciseContext) => string;

/** One step of a worked solution. */
export interface SolutionStep {
  title: string;
  detail: string;
}

/** The levelling threshold as prose quotes it, with a typographic minus. */
const LEVELLING_PK_TEXT = LEVELLING_PK.toString().replace('-', '−');

/** What the student is asked to do, in order. */
export const PROCEDURE_STEPS: string[] = [
  `Compare the pKa of the couple with ${LEVELLING_PK_TEXT}, the pKa of the hydronium ion: below it, water levels the acid and the acid is strong.`,
  'Apply the simplified formula that goes with that answer.',
  'Type the pH, to two decimals.',
];

/**
 * The hint ladders, vague first and almost the answer last.
 *
 * The questions are generated, so hints are authored once per kind of acid and
 * take the numbers of the question they are shown with.
 */
export const HINT_LADDERS: Record<AcidKind, HintBuilder[]> = {
  strong: [
    () =>
      'Read the pKa before doing any arithmetic: it is what decides which of the two formulas applies.',
    (context) =>
      `A pKa of ${formatPK(context.pK)} is below ${LEVELLING_PK_TEXT}, so water levels this acid: every molecule gives up its proton.`,
    (context) =>
      `The proton concentration is therefore the concentration you were given, ${formatConcentration(context.concentration)} mol/L. Take its cologarithm; the pKa itself never appears in the answer.`,
  ],
  weak: [
    () =>
      'Read the pKa before doing any arithmetic: it is what decides which of the two formulas applies.',
    (context) =>
      `A pKa of ${formatPK(context.pK)} is well above ${LEVELLING_PK_TEXT}, so only a small fraction of the acid gives up its proton and the concentration of the undissociated acid stays close to what you were given.`,
    () =>
      'Writing Ka = x²/(C − x) and neglecting x in front of C gives x = √(Ka·C), hence pH = ½(pKa − log C).',
    (context) =>
      `Substitute: pH = ½(${formatPK(context.pK)} − log ${formatConcentration(context.concentration)}) = ½(${formatPK(context.pK)} + ${(-Math.log10(context.concentration)).toFixed(2)}).`,
  ],
};

/**
 * The worked solution of a question: which formula, why it is the right one,
 * and the substitution that produces the graded value.
 * @param kind - Whether the acid is levelled by water.
 * @param context - The numbers of the question.
 * @returns The steps, in reading order.
 */
export function solutionSteps(
  kind: AcidKind,
  context: ExerciseContext,
): SolutionStep[] {
  const pK = formatPK(context.pK);
  const concentration = formatConcentration(context.concentration);
  const minusLog = (-Math.log10(context.concentration)).toFixed(2);
  const ph = context.ph.toFixed(2);

  if (kind === 'strong') {
    return [
      {
        title: 'Classify the couple',
        detail: `pKa = ${pK} is below ${LEVELLING_PK_TEXT}, the pKa of the hydronium ion, so water levels the acid: it is a strong acid.`,
      },
      {
        title: 'Pick the formula',
        detail:
          'A levelled acid is fully dissociated, so the proton concentration equals the analytical concentration and pH = −log C.',
      },
      {
        title: 'Substitute',
        detail: `pH = −log(${concentration}) = ${ph}`,
      },
    ];
  }

  return [
    {
      title: 'Classify the couple',
      detail: `pKa = ${pK} is above ${LEVELLING_PK_TEXT}, so the acid is only partly dissociated: it is a weak acid.`,
    },
    {
      title: 'Pick the formula',
      detail:
        'With x ≪ C the mass action law Ka = x²/(C − x) becomes x = √(Ka·C), so pH = ½(pKa − log C).',
    },
    {
      title: 'Substitute',
      detail: `pH = ½(${pK} − log(${concentration})) = ½(${pK} + ${minusLog}) = ${ph}`,
    },
  ];
}

/**
 * One sentence on how the exact, multi-equilibrium pH compares with the value
 * the simplified formula gives.
 * @param kind - Whether the acid is levelled by water.
 * @param simplified - pH from the closed form.
 * @param exact - pH from the full solve.
 * @returns The sentence to show under the answer.
 */
export function exactGapNote(
  kind: AcidKind,
  simplified: number,
  exact: number,
): string {
  const gap = exact - simplified;
  if (Math.abs(gap) < 0.02) {
    return 'The full calculation agrees to two decimals: the approximations behind the formula hold at this concentration.';
  }
  const direction = gap > 0 ? 'higher' : 'lower';
  const size = Math.abs(gap).toFixed(2);
  if (kind === 'weak') {
    return `The full calculation is ${size} pH unit ${direction}, because the formula assumes the dissociated fraction is negligible in front of C — an assumption that weakens as the solution gets dilute or the acid gets stronger.`;
  }
  return `The full calculation is ${size} pH unit ${direction}, because the protons water itself releases are no longer negligible at this concentration.`;
}
