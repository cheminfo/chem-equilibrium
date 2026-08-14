import type { Solution } from 'chem-equilibrium';

import { formatConcentration, formatP } from '../chemistry/format.ts';

import { Species } from './Species.tsx';

interface SpeciesReadoutProps {
  solution: Solution | null | undefined;
  /** Order to display the species in; defaults to the solution's own order. */
  species?: string[];
  /** Shown when there is nothing to display. */
  emptyMessage?: string;
}

/**
 * The concentration of every species of a solution, with its cologarithm.
 *
 * This table is where trace species are actually read: on a linear chart they
 * are crushed against the axis, but `-log10` makes them legible.
 * @param props - The solution to display.
 * @returns The readout table.
 */
export function SpeciesReadout(props: SpeciesReadoutProps) {
  const {
    solution,
    species,
    emptyMessage = 'Hover the chart to read values.',
  } = props;

  if (!solution) {
    return <p className="bp6-text-muted">{emptyMessage}</p>;
  }

  const labels = species ?? Object.keys(solution);
  const sorted = labels.toSorted(
    (a, b) => (solution[b] ?? 0) - (solution[a] ?? 0),
  );

  return (
    <div className="scroll-y">
      <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
        <thead>
          <tr>
            <th>Species</th>
            <th className="numeric">[ ] (mol/L)</th>
            <th className="numeric">−log[ ]</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((label) => (
            <tr key={label}>
              <td>
                <Species label={label} />
              </td>
              <td className="numeric">
                {formatConcentration(solution[label])}
              </td>
              <td className="numeric">{formatP(solution[label])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
