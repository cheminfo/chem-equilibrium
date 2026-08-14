import { Callout, FormGroup, HTMLSelect, Slider } from '@blueprintjs/core';
import { useMemo } from 'react';

import { formatConcentration } from '../../chemistry/format.ts';
import { nameOf } from '../../chemistry/species.ts';
import { EquilibriumChart } from '../../components/EquilibriumChart.tsx';
import { Species } from '../../components/Species.tsx';

import { FAMILIES } from './choices.ts';
import {
  buildFamily,
  foldAt,
  fractionCurves,
  solveAtFixedPh,
} from './folding.ts';

/** The total the widget works at; the fractions do not depend on it. */
const TOTAL = 0.1;

interface FoldingWidgetProps {
  family: string;
  ph: number;
  onChange: (patch: { family?: string; ph?: number }) => void;
}

/**
 * Move the imposed pH and watch every formation constant move with it.
 *
 * This is what every speciation diagram on the site is doing at each of its
 * points: the proton stops being an unknown, so the system collapses to one
 * linear equation that can be solved by hand.
 * @param props - The family, the imposed pH, and how to change them.
 * @returns The widget.
 */
export function FoldingWidget(props: FoldingWidgetProps) {
  const { family, ph, onChange } = props;

  const system = useMemo(() => buildFamily(family, TOTAL), [family]);
  const folded = useMemo(
    () => (system ? foldAt(system, ph) : []),
    [system, ph],
  );
  const solved = useMemo(() => solveAtFixedPh(family, TOTAL, ph), [family, ph]);
  const curves = useMemo(
    () => (system ? fractionCurves(system) : null),
    [system],
  );

  if (!system) {
    return (
      <Callout intent="warning" compact>
        That family cannot be reduced to a single component.
      </Callout>
    );
  }

  const denominator = folded.reduce((sum, member) => sum + member.folded, 0);

  return (
    <div className="panel-stack" style={{ marginTop: 12 }}>
      <div
        className="no-print"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}
      >
        <FormGroup label="Family (0.1 mol/L)">
          <HTMLSelect
            value={family}
            options={FAMILIES.map((label) => ({
              value: label,
              label: nameOf(label) ?? label,
            }))}
            onChange={(event) =>
              onChange({ family: event.currentTarget.value })
            }
          />
        </FormGroup>
        <FormGroup label="Imposed pH" style={{ flex: '1 1 260px' }}>
          <Slider
            min={0}
            max={14}
            stepSize={0.1}
            labelStepSize={2}
            value={ph}
            onChange={(value) => onChange({ ph: value })}
          />
        </FormGroup>
      </div>

      <Callout intent="primary" icon="function" compact>
        The whole family is written from{' '}
        <Species label={system.componentLabel} />, so at pH {ph.toFixed(1)} the
        mass balance is just{' '}
        <strong>
          T = [<Species label={system.componentLabel} withName={false} />] ×{' '}
          {denominator.toPrecision(5)}
        </strong>{' '}
        and every concentration follows without a single iteration.
      </Callout>

      <div className="scroll-x">
        <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
          <thead>
            <tr>
              <th>Species</th>
              <th className="numeric">protons n</th>
              <th className="numeric">log₁₀ β</th>
              <th className="numeric">log₁₀ β′ = log₁₀ β − n·pH</th>
              <th className="numeric">fraction</th>
              <th className="numeric">from the algebra</th>
              <th className="numeric">from the solver</th>
            </tr>
          </thead>
          <tbody>
            {folded.map((member) => (
              <tr key={member.label}>
                <td>
                  <Species label={member.label} />
                </td>
                <td className="numeric">{member.protons}</td>
                <td className="numeric">
                  {Math.log10(member.beta).toFixed(2)}
                </td>
                <td className="numeric">
                  {Math.log10(member.folded).toFixed(2)}
                </td>
                <td className="numeric">
                  {(member.fraction * 100).toFixed(2)} %
                </td>
                <td className="numeric">
                  {formatConcentration(member.concentration)}
                </td>
                <td className="numeric">
                  {formatConcentration(solved?.[member.label])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {curves ? (
        <div className="chart-container">
          <EquilibriumChart
            x={curves.ph}
            series={curves.curves}
            xLabel="Imposed pH"
            yLabel="Fraction of the family"
            yRange={[0, 1]}
          />
        </div>
      ) : null}
    </div>
  );
}
