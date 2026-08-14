import { Callout } from '@blueprintjs/core';
import { Fragment } from 'react';

import type { SaturationPoint } from '../chemistry/saturation.ts';

import { Species } from './Species.tsx';

interface SaturationNoteProps {
  points: SaturationPoint[];
  /** Name of the swept quantity, e.g. `pH`. */
  quantity: string;
}

/**
 * Name the corners a precipitating solid puts in the curves.
 * @param props - Where each solid appears, and what is being swept.
 * @returns The note, or nothing when no solid forms.
 */
export function SaturationNote(props: SaturationNoteProps) {
  const { points, quantity } = props;
  if (points.length === 0) return null;

  return (
    <Callout intent="primary" icon="layers" compact style={{ marginTop: 8 }}>
      <strong>Where the curves bend.</strong>{' '}
      {points.map((point, index) => (
        <Fragment key={point.label}>
          {index > 0 ? ' ' : ''}
          <Species label={point.label} /> starts to precipitate at {quantity} ={' '}
          <strong>{format(point.at, point.uncertainty)}</strong>.
        </Fragment>
      ))}{' '}
      Up to that point the solid is absent and the ions are free; past it the
      solubility product pins them, so every curve that involves those ions
      changes slope. That corner is the phase boundary itself, not a numerical
      artefact — the ion product reaches the solubility product exactly there.
      {points.some((point) => point.uncertainty > 0) ? (
        <>
          {' '}
          The sweep can only place it to within one step, so add points to
          locate it more precisely.
        </>
      ) : null}
    </Callout>
  );
}

/**
 * Show the onset with no more precision than the sweep resolves.
 * @param at - Value at which the solid first appears.
 * @param uncertainty - Width of one sweep step.
 * @returns The formatted value.
 */
function format(at: number, uncertainty: number): string {
  if (uncertainty <= 0) return at.toPrecision(4);
  const decimals = Math.max(0, Math.ceil(-Math.log10(uncertainty)));
  return at.toFixed(Math.min(decimals, 6));
}
