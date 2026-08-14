import { Callout, Tag } from '@blueprintjs/core';
import type { Model } from 'chem-equilibrium';
import { useMemo } from 'react';

import { buildHelper } from '../../chemistry/solve.ts';
import { Species } from '../../components/Species.tsx';
import type { SelectedSpecies } from '../../components/SpeciesPicker.tsx';

interface TableauTableProps {
  /** What is put in the flask. */
  seeds: SelectedSpecies[];
}

/**
 * The tableau of a real system: one row per species, one column per component.
 *
 * The first rows are the components themselves, with the identity block and a
 * constant of 1 — that is how the mass balance can be written as a single sum
 * over every row, and why only those rows are unknowns.
 * @param props - What is put in the flask.
 * @returns The tableau.
 */
export function TableauTable(props: TableauTableProps) {
  const { seeds } = props;
  const model = useMemo(() => buildModel(seeds), [seeds]);

  if (!model) {
    return (
      <Callout intent="warning" compact>
        That system could not be built from the bundled database.
      </Callout>
    );
  }

  const labels = model.components.map((component) => component.label);

  return (
    <div className="scroll-x">
      <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
        <thead>
          <tr>
            <th>Species</th>
            {labels.map((label) => (
              <th key={label} className="numeric">
                <Species label={label} />
              </th>
            ))}
            <th className="numeric">log₁₀ β</th>
            <th>Kind</th>
          </tr>
        </thead>
        <tbody>
          {model.components.map((component, index) => (
            <tr key={component.label}>
              <td>
                <Species label={component.label} />
              </td>
              {labels.map((label, column) => (
                <td key={label} className="numeric">
                  {column === index ? 1 : 0}
                </td>
              ))}
              <td className="numeric">0</td>
              <td>
                <Tag minimal intent="primary">
                  component — an unknown
                </Tag>
              </td>
            </tr>
          ))}
          {model.formedSpecies.map((species) => (
            <tr key={species.label}>
              <td>
                <Species label={species.label} />
              </td>
              {labels.map((label, column) => (
                <td key={label} className="numeric">
                  {species.components[column] ?? 0}
                </td>
              ))}
              <td className="numeric">{Math.log10(species.beta).toFixed(2)}</td>
              <td>
                <Tag minimal intent={species.solid ? 'warning' : 'success'}>
                  {species.solid ? 'solid' : 'formed — computed'}
                </Tag>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Total put in</th>
            {model.components.map((component) => (
              <th key={component.label} className="numeric">
                {component.total ?? 0}
              </th>
            ))}
            <th />
            <th />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/**
 * Build the numerical model of a flask, tolerating a system the database cannot
 * assemble.
 * @param seeds - What is put in the flask.
 * @returns The model, or `null`.
 */
function buildModel(seeds: SelectedSpecies[]): Model | null {
  try {
    return buildHelper(seeds).getModel();
  } catch {
    return null;
  }
}
