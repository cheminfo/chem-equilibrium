import { Tag } from '@blueprintjs/core';
import type { Solution } from 'chem-equilibrium';

import { formatConcentration } from '../chemistry/format.ts';

import { Species } from './Species.tsx';
import { SpeciesReadout } from './SpeciesReadout.tsx';

interface SpeciationReadoutProps {
  solution: Solution | undefined;
  /** Every species of the sweep, in the solver's order. */
  species: string[];
  /** Labels formed by a precipitation equilibrium, read as amounts. */
  solids: ReadonlySet<string>;
  /** Value of the swept quantity at the point being read. */
  value: number | undefined;
  /** Name of the swept quantity, as on the abscissa. */
  valueLabel: string;
  /**
   * Whether the point shown is the middle of the sweep because the cursor is
   * not on the chart.
   * @default false
   */
  isFallback?: boolean;
}

/**
 * The full speciation at one point of the sweep.
 *
 * Solid phases are listed apart: their number is an amount of matter that has
 * left the solution, not a concentration, and reading it off the same column as
 * `[Ag+]` is the classic mistake this table exists to prevent.
 * @param props - The point to read.
 * @returns The readout.
 */
export function SpeciationReadout(props: SpeciationReadoutProps) {
  const { solution, species, solids, value, valueLabel, isFallback } = props;

  if (!solution) {
    return <p className="bp6-text-muted">No solved point to read yet.</p>;
  }

  const dissolved: string[] = [];
  const precipitated: string[] = [];
  for (const label of species) {
    if (solids.has(label)) {
      precipitated.push(label);
    } else {
      dissolved.push(label);
    }
  }

  return (
    <div className="panel-stack">
      <div>
        <strong>
          {valueLabel} = {value === undefined ? '—' : value.toPrecision(4)}
        </strong>
        {isFallback ? (
          <span className="bp6-text-muted">
            {' '}
            — middle of the sweep. Hover the chart to read another point.
          </span>
        ) : null}
      </div>

      <SpeciesReadout solution={solution} species={dissolved} />

      {precipitated.length > 0 ? (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Tag minimal intent="warning">
              solid phases
            </Tag>{' '}
            <span className="bp6-text-muted">
              an amount that has left the solution, in mol
            </span>
          </div>
          <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
            <thead>
              <tr>
                <th>Phase</th>
                <th className="numeric">Amount (mol)</th>
              </tr>
            </thead>
            <tbody>
              {precipitated.map((label) => (
                <tr key={label}>
                  <td>
                    <Species label={label} /> <Tag minimal>s</Tag>
                  </td>
                  <td className="numeric">
                    {formatConcentration(solution[label])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
