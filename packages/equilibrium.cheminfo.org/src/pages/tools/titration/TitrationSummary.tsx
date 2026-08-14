import { Callout } from '@blueprintjs/core';

import type { IndicatorAssessment } from '../../../chemistry/indicatorFit.ts';
import type { PhJump } from '../../../chemistry/titration.ts';
import { formatPh } from '../../../chemistry/titration.ts';
import { Species } from '../../../components/Species.tsx';

interface TitrationSummaryProps {
  analyte: string;
  titrant: string;
  /** Volume at which the two amounts match one for one, in mL. */
  equivalence: number | undefined;
  /** Amount of analyte in the flask, in mmol. */
  analyteMillimoles: number;
  /** Highest volume the curve reaches, in mL. */
  maxVolume: number;
  jump: PhJump | null;
  /** What the chosen indicator would do here, or `null` when none is chosen. */
  assessment: IndicatorAssessment | null;
  /** Volume at which the indicator is half turned, in mL. */
  endpoint: number | undefined;
}

/**
 * What the curve teaches: where equivalence falls, where the pH actually jumps,
 * and whether the chosen indicator marks the one with the other.
 * @param props - The computed landmarks of the curve.
 * @returns The summary.
 */
export function TitrationSummary(props: TitrationSummaryProps) {
  const {
    analyte,
    titrant,
    equivalence,
    analyteMillimoles,
    maxVolume,
    jump,
    assessment,
    endpoint,
  } = props;

  const multiples = furtherEquivalences(equivalence, maxVolume);

  return (
    <Callout intent={intentOf(assessment)} icon="learning" compact>
      <p style={PARAGRAPH_STYLE}>
        <strong>Equivalence.</strong> The flask holds{' '}
        {formatAmount(analyteMillimoles)} mmol of <Species label={analyte} />,
        so the same amount of <Species label={titrant} /> has been added at{' '}
        {equivalence === undefined ? (
          '— (the titrant is infinitely dilute)'
        ) : (
          <strong>{formatVolume(equivalence)} mL</strong>
        )}
        .
        {multiples.length > 0
          ? ` If the analyte exchanges more than one proton, the next equivalence points fall at multiples of that volume: ${multiples
              .map((volume) => `${formatVolume(volume)} mL`)
              .join(', ')}.`
          : ''}
      </p>

      <p style={PARAGRAPH_STYLE}>
        <strong>The jump.</strong>{' '}
        {jump === null
          ? 'The curve has no steep part at all, so there is no endpoint to read.'
          : jump.usable
            ? `The pH runs from ${formatPh(jump.lowPh)} to ${formatPh(jump.highPh)} around ${formatVolume(jump.volume)} mL, at up to ${formatSlope(jump.slope)} pH units per mL. That is the jump an indicator has to sit on.`
            : `The steepest part of the curve is around ${formatVolume(jump.volume)} mL, but the pH only moves from ${formatPh(jump.lowPh)} to ${formatPh(jump.highPh)} there. That is not a usable jump: the analyte is too weak or too dilute for a colour endpoint, and the pH must be followed with an electrode.`}
      </p>

      {assessment ? (
        <p style={PARAGRAPH_STYLE}>
          <strong>The indicator.</strong> {assessment.message}
          {endpoint !== undefined && equivalence !== undefined && jump?.usable
            ? ` It is half turned at ${formatVolume(endpoint)} mL, ${describeError(
                endpoint,
                equivalence,
                jump,
                multiples.length > 0,
              )}`
            : ''}
        </p>
      ) : null}
    </Callout>
  );
}

/**
 * The equivalence volumes of a polyprotic analyte that still fall on the curve.
 * @param equivalence - The one-for-one equivalence volume, in mL.
 * @param maxVolume - Highest volume the curve reaches, in mL.
 * @returns The multiples that are plotted, at most three of them.
 */
function furtherEquivalences(
  equivalence: number | undefined,
  maxVolume: number,
): number[] {
  if (equivalence === undefined || equivalence <= 0) return [];
  const volumes: number[] = [];
  for (let factor = 2; factor <= 4; factor++) {
    const volume = equivalence * factor;
    if (volume > maxVolume) break;
    volumes.push(volume);
  }
  return volumes;
}

/**
 * Compare where the indicator turns with the equivalence point it is marking.
 *
 * A polyprotic analyte has several equivalence volumes, and an indicator marks
 * the one the jump belongs to — comparing it with the first one would report a
 * 100% error on a titration that is in fact exact.
 * @param endpoint - Volume at which the indicator is half turned, in mL.
 * @param equivalence - The one-for-one equivalence volume, in mL.
 * @param jump - The jump of the curve, which says which equivalence is meant.
 * @param polyprotic - Whether more than one equivalence point is on the curve.
 * @returns The clause that completes the sentence.
 */
function describeError(
  endpoint: number,
  equivalence: number,
  jump: PhJump | null,
  polyprotic: boolean,
): string {
  if (equivalence <= 0) return 'which no equivalence volume can be read from.';
  const order = jump ? Math.max(1, Math.round(jump.volume / equivalence)) : 1;
  const target = equivalence * order;
  const name =
    order === 1 && !polyprotic
      ? 'the equivalence point'
      : `the ${ORDINALS[order - 1] ?? `${order}th`} equivalence point`;
  const difference = endpoint - target;
  const relative = Math.abs(difference / target) * 100;
  if (relative < 0.05) {
    return `right on ${name} (${formatVolume(target)} mL).`;
  }
  const direction = difference > 0 ? 'past' : 'short of';
  return `${formatDelta(Math.abs(difference))} mL ${direction} ${name} (${formatVolume(target)} mL) — a ${relative.toFixed(1)}% error on the volume.`;
}

function intentOf(assessment: IndicatorAssessment | null) {
  if (!assessment) return 'primary' as const;
  if (assessment.fit === 'inside') return 'success' as const;
  if (assessment.fit === 'overlapping') return 'warning' as const;
  return 'danger' as const;
}

function formatVolume(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toPrecision(4).replace(/\.?0+$/, '');
}

function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toPrecision(2).replace(/\.?0+$/, '');
}

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toPrecision(3).replace(/\.?0+$/, '');
}

function formatSlope(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value < 10 ? value.toFixed(1) : Math.round(value).toString();
}

const ORDINALS = ['first', 'second', 'third', 'fourth'];

const PARAGRAPH_STYLE = { margin: '0 0 6px' } as const;
