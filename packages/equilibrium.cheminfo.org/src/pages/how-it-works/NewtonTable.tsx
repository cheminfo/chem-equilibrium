import { Tag } from '@blueprintjs/core';

import { formatConcentration } from '../../chemistry/format.ts';
import { Species } from '../../components/Species.tsx';

import type { NewtonStep, Tableau } from './newtonTrace.ts';

interface NewtonTableProps {
  tableau: Tableau;
  steps: NewtonStep[];
}

/**
 * Every iterate of a run, so the reader can watch the residual collapse.
 * @param props - The system and the iterations it went through.
 * @returns The table.
 */
export function NewtonTable(props: NewtonTableProps) {
  const { tableau, steps } = props;

  return (
    <div className="scroll-x scroll-y">
      <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
        <thead>
          <tr>
            <th className="numeric">#</th>
            {tableau.componentLabels.map((label) => (
              <th key={label} className="numeric">
                <Species label={label} />
              </th>
            ))}
            <th className="numeric">max |T − T꜀ₐₗ꜀|</th>
            <th className="numeric">halvings</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <tr key={step.iteration}>
              <td className="numeric">{step.iteration}</td>
              {tableau.componentLabels.map((label, index) => (
                <td key={label} className="numeric">
                  {formatConcentration(step.concentrations[index])}
                </td>
              ))}
              <td className="numeric">{step.residual.toExponential(2)}</td>
              <td className="numeric">
                {step.halvings > 0 ? (
                  <Tag minimal intent="warning">
                    {step.halvings}
                  </Tag>
                ) : (
                  <span className="bp6-text-muted">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
