import type { Indicator, Transition } from './indicators.ts';
import type { PhJump } from './titration.ts';
import { formatPh } from './titration.ts';

/** Where an indicator's colour change sits relative to the pH jump. */
export type IndicatorFit = 'inside' | 'overlapping' | 'outside';

/** What an indicator would do on one particular curve. */
export interface IndicatorAssessment {
  /** The colour change that is closest to the jump. */
  transition: Transition;
  fit: IndicatorFit;
  /** One sentence, ready to be read off the page. */
  message: string;
}

/**
 * Judge an indicator against the jump of the curve that was actually computed.
 *
 * The verdict comes from the curve rather than from a rule of thumb, because
 * the same indicator is right for one titration and useless for the next.
 * @param indicator - The indicator the student picked.
 * @param jump - The jump of the curve, or `null` when there is none.
 * @returns The assessment, or `null` when the indicator has no real transition.
 */
export function assessIndicator(
  indicator: Indicator,
  jump: PhJump | null,
): IndicatorAssessment | null {
  const usable = realTransitions(indicator);
  const first = usable[0];
  if (!first) return null;

  if (!jump?.usable) {
    return {
      transition: first,
      fit: 'outside',
      message: `${indicator.name} changes colour between pH ${formatPh(first.pH1)} and ${formatPh(first.pH2)}, but this curve has no sharp pH jump, so no colour indicator can mark its endpoint. Follow the pH with an electrode instead.`,
    };
  }

  const transition = closestTransition(usable, (jump.lowPh + jump.highPh) / 2);
  const { pH1, pH2 } = transition;
  const range = `between pH ${formatPh(pH1)} and ${formatPh(pH2)}`;
  const jumpRange = `pH ${formatPh(jump.lowPh)} to ${formatPh(jump.highPh)}`;

  if (pH1 >= jump.lowPh && pH2 <= jump.highPh) {
    return {
      transition,
      fit: 'inside',
      message: `${indicator.name} changes colour ${range}, which falls inside the jump (${jumpRange}): the whole colour change happens within a fraction of a drop of the equivalence point.`,
    };
  }
  if (pH2 >= jump.lowPh && pH1 <= jump.highPh) {
    return {
      transition,
      fit: 'overlapping',
      message: `${indicator.name} changes colour ${range}, which only partly overlaps the jump (${jumpRange}). Part of the colour change happens away from the equivalence point, so the endpoint is read with a small error.`,
    };
  }
  return {
    transition,
    fit: 'outside',
    message: `${indicator.name} changes colour ${range}, which is far from the jump (${jumpRange}); this indicator would give a large error.`,
  };
}

/**
 * Every colour change of an indicator that spans a real pH range.
 *
 * The source table holds one degenerate row with `pH1 === pH2`, which is not a
 * transition anyone can read; it is dropped here rather than printed as a
 * zero-width range.
 * @param indicator - The indicator.
 * @returns The transitions that span a range, in table order.
 */
export function realTransitions(indicator: Indicator): Transition[] {
  return indicator.transitions.filter((entry) => entry.pH2 > entry.pH1);
}

/**
 * Describe a stored indicator colour, naming the colourless forms.
 * @param hex - The colour as the source table records it.
 * @returns A word a student reads rather than a hex code.
 */
export function describeColor(hex: string): string {
  return hex.toLowerCase() === '#ffffff' ? 'colourless' : hex;
}

/**
 * The transition ranges of an indicator, as `3.1–4.4` joined by commas.
 * @param indicator - The indicator.
 * @returns The ranges, or an empty string when it has none.
 */
export function formatRanges(indicator: Indicator): string {
  return realTransitions(indicator)
    .map((entry) => `${formatPh(entry.pH1)}–${formatPh(entry.pH2)}`)
    .join(', ');
}

function closestTransition(transitions: Transition[], ph: number): Transition {
  let best = transitions[0] as Transition;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of transitions) {
    const distance = Math.abs((entry.pH1 + entry.pH2) / 2 - ph);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }
  return best;
}
