import { Callout, Tag } from '@blueprintjs/core';
import type { Solution } from 'chem-equilibrium';
import { useMemo } from 'react';

import { runSingleSolve } from '../../chemistry/solve.ts';
import { Species } from '../../components/Species.tsx';
import { SpeciesReadout } from '../../components/SpeciesReadout.tsx';

/** Dissociation constant of AgCl, the inverse of its tabulated formation β. */
const KSP_AGCL = 10 ** -9.74;

const CASES = [
  { title: 'Supersaturated: 0.01 mol/L of each', amount: 0.01 },
  { title: 'Undersaturated: 10⁻⁶ mol/L of each', amount: 1e-6 },
];

/**
 * The same salt on both sides of its solubility product, solved live.
 * @returns The two solutions side by side.
 */
export function SolidExample() {
  const solved = useMemo(
    () =>
      CASES.map((entry) => ({
        ...entry,
        solution: solveSilverChloride(entry.amount),
      })),
    [],
  );

  return (
    <div className="tool-layout" style={{ marginTop: 12 }}>
      {solved.map((entry) => {
        const silver = entry.solution?.['Ag+'];
        const chloride = entry.solution?.['Cl-'];
        const product =
          silver !== undefined && chloride !== undefined
            ? silver * chloride
            : undefined;
        const precipitated = (entry.solution?.AgCl ?? 0) > 0;
        return (
          <div key={entry.title} className="panel-stack">
            <div>
              <strong>{entry.title}</strong>{' '}
              <Tag minimal intent={precipitated ? 'warning' : 'success'}>
                {precipitated ? 'solid present' : 'nothing precipitates'}
              </Tag>
            </div>
            <Callout compact icon={precipitated ? 'lock' : 'tick'}>
              Ion product [<Species label="Ag+" withName={false} />
              ][
              <Species label="Cl-" withName={false} />] ={' '}
              {product === undefined ? '—' : product.toExponential(4)}
              {product === undefined
                ? ''
                : product > KSP_AGCL * 0.99
                  ? ' — pinned to Ksp'
                  : ` — below Ksp = ${KSP_AGCL.toExponential(4)}`}
            </Callout>
            <SpeciesReadout
              solution={entry.solution}
              emptyMessage="This one did not converge."
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Solve equal amounts of silver and chloride in a litre.
 * @param amount - Amount of each, in mol.
 * @returns The solution, or `null`.
 */
function solveSilverChloride(amount: number): Solution | null {
  return runSingleSolve([
    { label: 'Ag+', quantity: amount },
    { label: 'Cl-', quantity: amount },
  ]).solution;
}
