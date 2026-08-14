import { Tooltip } from '@blueprintjs/core';
import { MF } from 'react-mf';

import { nameOf, normalizeMF } from '../chemistry/species.ts';

interface SpeciesProps {
  /** Species label as stored in the database, e.g. `CO3--`. */
  label: string;
  /**
   * Show the English name in a tooltip.
   * @default true
   */
  withName?: boolean;
  className?: string;
}

/**
 * Render a species formula with proper subscripts and charges.
 * @param props - The species to render.
 * @returns The typeset formula.
 */
export function Species(props: SpeciesProps) {
  const { label, withName = true, className } = props;
  const formula = (
    <MF
      mf={normalizeMF(label)}
      className={className ? `species ${className}` : 'species'}
    />
  );

  const name = withName ? nameOf(label) : undefined;
  if (!name) return formula;

  return (
    <Tooltip content={name} hoverOpenDelay={300} compact>
      {formula}
    </Tooltip>
  );
}
