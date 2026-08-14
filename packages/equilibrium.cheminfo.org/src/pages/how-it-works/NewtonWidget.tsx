import {
  Callout,
  FormGroup,
  HTMLSelect,
  NumericInput,
} from '@blueprintjs/core';
import { useMemo } from 'react';

import { formatConcentration } from '../../chemistry/format.ts';
import { buildHelper } from '../../chemistry/solve.ts';
import { nameOf } from '../../chemistry/species.ts';
import { EquilibriumChart } from '../../components/EquilibriumChart.tsx';
import { Species } from '../../components/Species.tsx';

import { NewtonTable } from './NewtonTable.tsx';
import { NEWTON_ACIDS } from './choices.ts';
import type { NewtonStep, Tableau } from './newtonTrace.ts';
import { buildTableau, traceNewton } from './newtonTrace.ts';

const TOLERANCE = 1e-15;
const MAX_ITERATIONS = 40;

interface NewtonWidgetProps {
  acid: string;
  amount: number;
  /** Every component starts at 10^−guess mol/L. */
  guess: number;
  onChange: (patch: { acid?: string; amount?: number; guess?: number }) => void;
}

/**
 * Watch the iteration converge — or fail to.
 *
 * The starting guess is exposed because it is the whole point: the update is
 * multiplicative, so being ten decades away costs roughly ten extra iterations,
 * and a bad enough guess exhausts the budget.
 * @param props - The system to solve and the starting point.
 * @returns The widget.
 */
export function NewtonWidget(props: NewtonWidgetProps) {
  const { acid, amount, guess, onChange } = props;

  const run = useMemo(
    () => solveTrace(acid, amount, guess),
    [acid, amount, guess],
  );

  return (
    <div className="panel-stack" style={{ marginTop: 12 }}>
      <div
        className="no-print"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}
      >
        <FormGroup label="Acid put in the flask">
          <HTMLSelect
            value={acid}
            options={NEWTON_ACIDS.map((label) => ({
              value: label,
              label: nameOf(label) ?? label,
            }))}
            onChange={(event) => onChange({ acid: event.currentTarget.value })}
          />
        </FormGroup>
        <FormGroup label="Total amount (mol/L)">
          <NumericInput
            value={amount}
            min={1e-6}
            max={5}
            stepSize={0.05}
            minorStepSize={0.001}
            style={{ width: 100 }}
            onValueChange={(value) =>
              onChange({ amount: Number.isFinite(value) ? value : 0.1 })
            }
          />
        </FormGroup>
        <FormGroup label="Every component starts at 10^−p, p =">
          <NumericInput
            value={guess}
            min={0}
            max={14}
            stepSize={1}
            style={{ width: 80 }}
            onValueChange={(value) =>
              onChange({ guess: Number.isFinite(value) ? value : 3 })
            }
          />
        </FormGroup>
      </div>

      {run.error ? (
        <Callout intent="danger" icon="error" compact>
          {run.error}
        </Callout>
      ) : null}

      {run.tableau && run.steps.length > 0 ? (
        <>
          <Outcome tableau={run.tableau} steps={run.steps} />
          <div className="chart-container">
            <EquilibriumChart
              x={run.steps.map((step) => step.iteration)}
              series={run.tableau.componentLabels.map((label, index) => ({
                label,
                y: run.steps.map((step) =>
                  cologarithm(step.concentrations[index]),
                ),
              }))}
              xLabel="Iteration"
              yLabel="−log₁₀ of the free component"
            />
          </div>
          <NewtonTable tableau={run.tableau} steps={run.steps} />
        </>
      ) : null}
    </div>
  );
}

function Outcome(props: { tableau: Tableau; steps: NewtonStep[] }) {
  const { tableau, steps } = props;
  const last = steps.at(-1);
  if (!last) return null;
  const converged = last.residual < TOLERANCE;
  const protonIndex = tableau.speciesLabels.indexOf('H+');
  const proton = last.species[protonIndex];
  const halvings = totalHalvings(steps);

  if (!converged) {
    return (
      <Callout intent="warning" icon="warning-sign" compact>
        Still {last.residual.toExponential(2)} mol/L away from the mass balance
        after {MAX_ITERATIONS} iterations. The solver would return{' '}
        <code className="bp6-code">null</code> here, and the point would simply
        be missing from a curve. Start closer and it converges.
      </Callout>
    );
  }

  return (
    <Callout intent="success" icon="tick-circle" compact>
      Converged in {steps.length - 1} iterations, residual{' '}
      {last.residual.toExponential(2)} mol/L.
      {proton !== undefined && proton > 0 ? (
        <>
          {' '}
          Final <Species label="H+" withName={false} /> ={' '}
          {formatConcentration(proton)} mol/L, pH{' '}
          {(-Math.log10(proton)).toFixed(3)}.
        </>
      ) : null}{' '}
      {halvings > 0
        ? `The step had to be halved ${halvings} times to keep every concentration positive.`
        : 'No step ever pushed a concentration below zero, so no halving was needed.'}
    </Callout>
  );
}

/**
 * Build the system and replay the iteration on it.
 * @param acid - Species put in the flask.
 * @param amount - How much of it, in mol/L.
 * @param guess - The p-value every component starts at.
 * @returns The tableau and its iterates, or the reason it could not be built.
 */
function solveTrace(
  acid: string,
  amount: number,
  guess: number,
): { tableau?: Tableau; steps: NewtonStep[]; error?: string } {
  try {
    const helper = buildHelper([{ label: acid, quantity: amount }]);
    const tableau = buildTableau(helper.getModel());
    if (!tableau) {
      return { steps: [], error: 'That system has a solid phase.' };
    }
    const start = new Array<number>(tableau.componentLabels.length).fill(
      10 ** -guess,
    );
    return {
      tableau,
      steps: traceNewton(tableau, start, {
        tolerance: TOLERANCE,
        maxIterations: MAX_ITERATIONS,
      }),
    };
  } catch (error) {
    return {
      steps: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function totalHalvings(steps: NewtonStep[]): number {
  let total = 0;
  for (const step of steps) {
    total += step.halvings;
  }
  return total;
}

function cologarithm(value: number | undefined): number {
  if (value === undefined || !(value > 0)) return Number.NaN;
  return -Math.log10(value);
}
