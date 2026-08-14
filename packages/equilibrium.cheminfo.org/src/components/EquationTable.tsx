import { Checkbox, Tag } from '@blueprintjs/core';
import type { EquationJSON } from 'chem-equilibrium';

import { formatPK } from '../chemistry/format.ts';

import { EquationText } from './EquationText.tsx';

interface EquationTableProps {
  equations: EquationJSON[];
  /** Equations rewritten on the independent-component basis, shown side by side. */
  normalized?: EquationJSON[];
  /** Labels of the formed species whose equilibrium is switched off. */
  disabled?: string[];
  onToggleDisabled?: (formed: string) => void;
  /**
   * Show the equilibrium type as a tag.
   * @default false
   */
  withType?: boolean;
}

/**
 * The equilibria the solver pulled in, with their constants.
 *
 * Switching one off is the pedagogic point of this table: it shows what a given
 * equilibrium actually contributes to the result.
 * @param props - The equations to display.
 * @returns The table.
 */
export function EquationTable(props: EquationTableProps) {
  const { equations, normalized, disabled, onToggleDisabled, withType } = props;
  const off = new Set(disabled);

  if (equations.length === 0) {
    return (
      <p className="bp6-text-muted">
        No equilibrium yet — add a species to the solution.
      </p>
    );
  }

  return (
    <div className="scroll-x">
      <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
        <thead>
          <tr>
            <th>Equilibrium</th>
            <th className="numeric">pK</th>
            {normalized ? <th>On independent components</th> : null}
            {normalized ? <th className="numeric">pK</th> : null}
            {withType ? <th>Type</th> : null}
            {onToggleDisabled ? <th>Ignore</th> : null}
          </tr>
        </thead>
        <tbody>
          {equations.map((equation, index) => {
            const isOff = off.has(equation.formed);
            const normalizedEquation = normalized?.[index];
            return (
              <tr
                key={equation.formed}
                style={isOff ? { opacity: 0.45 } : undefined}
              >
                <td>
                  <EquationText equation={equation} />
                </td>
                <td className="numeric">{formatPK(equation.pK)}</td>
                {normalized ? (
                  <td>
                    {normalizedEquation ? (
                      <EquationText equation={normalizedEquation} />
                    ) : null}
                  </td>
                ) : null}
                {normalized ? (
                  <td className="numeric">
                    {normalizedEquation ? formatPK(normalizedEquation.pK) : ''}
                  </td>
                ) : null}
                {withType ? (
                  <td>
                    <Tag minimal intent={intentOf(equation.type)}>
                      {LABELS[equation.type]}
                    </Tag>
                  </td>
                ) : null}
                {onToggleDisabled ? (
                  <td>
                    <Checkbox
                      checked={isOff}
                      aria-label={`Ignore the equilibrium forming ${equation.formed}`}
                      onChange={() => onToggleDisabled(equation.formed)}
                    />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const LABELS = {
  acidoBasic: 'acid/base',
  complexation: 'complexation',
  precipitation: 'precipitation',
} as const;

function intentOf(type: keyof typeof LABELS) {
  if (type === 'acidoBasic') return 'primary' as const;
  if (type === 'complexation') return 'success' as const;
  return 'warning' as const;
}
