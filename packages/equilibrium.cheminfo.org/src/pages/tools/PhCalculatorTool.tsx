import {
  Button,
  Callout,
  Card,
  FormGroup,
  NumericInput,
} from '@blueprintjs/core';
import { useMemo } from 'react';

import { findCouple } from '../../chemistry/acidCouples.ts';
import { phOf } from '../../chemistry/format.ts';
import { runSingleSolve } from '../../chemistry/solve.ts';
import { ALL_SPECIES } from '../../chemistry/species.ts';
import { AcidList } from '../../components/AcidList.tsx';
import { EquationTable } from '../../components/EquationTable.tsx';
import { PkaScale } from '../../components/PkaScale.tsx';
import { Species } from '../../components/Species.tsx';
import { SpeciesReadout } from '../../components/SpeciesReadout.tsx';
import { ToolHeader } from '../../components/ToolHeader.tsx';
import type { ToolStateCodec } from '../../router/useToolState.ts';
import {
  ifChanged,
  numberParam,
  useToolState,
} from '../../router/useToolState.ts';

import { ApproximationNote, PhHeadline } from './PhResult.tsx';

/** Everything this tool needs to be reproduced from its URL. */
interface PhState {
  /** Label of the acid put in the solution. */
  acid: string;
  /** Analytical concentration, in mol/L. */
  concentration: number;
}

/**
 * The pH of a solution of a single acid, solved exactly.
 *
 * The point of the page is the gap between that exact value and the closed form
 * of the course: the solver keeps water autoprotolysis and every further
 * acidity of the species in the system, which is what makes a very weak or a
 * very dilute acid come out right.
 * @returns The tool.
 */
export function PhCalculatorTool() {
  const [state, update] = useToolState(PATH, DEFAULTS, CODEC);
  const { acid, concentration } = state;

  const result = useMemo(
    () => runSingleSolve([{ label: acid, quantity: concentration }]),
    [acid, concentration],
  );

  const couple = findCouple(acid);
  const ph = phOf(result.solution);

  return (
    <div>
      <ToolHeader title="Calculating the pH of a solution">
        <p>
          Enter a concentration and pick an acid — or any conjugate form, the
          intermediates of a polyprotic acid included. Every equilibrium those
          species can take part in is pulled in, water autoprotolysis included,
          and the whole system is solved numerically: no closed-form
          approximation is used anywhere on this page.
        </p>
      </ToolHeader>

      <div className="tool-layout">
        <div className="panel-stack">
          <Card>
            <h3 style={HEADING_STYLE}>The solution</h3>
            <FormGroup
              label="Concentration (mol/L)"
              labelFor="ph-concentration"
              helperText="Between 0 and 6 mol/L. Dilute far enough and the exact pH stops following the closed form."
            >
              <NumericInput
                id="ph-concentration"
                value={concentration}
                min={0}
                max={MAX_CONCENTRATION}
                minorStepSize={CONCENTRATION_PRECISION}
                stepSize={0.01}
                majorStepSize={0.1}
                fill
                onValueChange={(value) => {
                  if (Number.isFinite(value)) {
                    update({ concentration: clampConcentration(value) });
                  }
                }}
              />
            </FormGroup>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant="minimal"
                  active={preset === concentration}
                  text={`${preset} M`}
                  onClick={() => update({ concentration: preset })}
                />
              ))}
            </div>
            <p style={{ margin: '8px 0 0' }}>
              Acid in the beaker: <Species label={acid} />
            </p>
          </Card>

          <Card>
            <h3 style={HEADING_STYLE}>Click to choose the acid</h3>
            <AcidList
              selected={acid}
              onSelect={(next) => update({ acid: next })}
            />
          </Card>

          <Card>
            <h3 style={HEADING_STYLE}>
              Some pKa values to get a feel for the scale
            </h3>
            <PkaScale
              marker={couple ? { acid: couple.acid, pK: couple.pK } : null}
            />
          </Card>
        </div>

        <div className="panel-stack">
          {result.error ? (
            <Callout intent="danger" icon="error" title="No solution">
              {result.error}
            </Callout>
          ) : null}

          <Card>
            <PhHeadline
              acid={acid}
              concentration={concentration}
              solution={result.solution}
              ph={ph}
            />
          </Card>

          {couple ? (
            <Card>
              <ApproximationNote
                pK={couple.pK}
                concentration={concentration}
                exact={ph}
              />
            </Card>
          ) : null}

          <Card>
            <h3 style={HEADING_STYLE}>Equations used for the calculations</h3>
            <EquationTable equations={result.equations} />
          </Card>

          <Card>
            <h3 style={HEADING_STYLE}>Equilibrium concentrations</h3>
            <SpeciesReadout
              solution={result.solution}
              emptyMessage="Pick an acid to see its equilibrium concentrations."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

const PATH = '/ph';
const MAX_CONCENTRATION = 6;
/** Precision the concentration field keeps, so a very dilute solution survives it. */
const CONCENTRATION_PRECISION = 1e-12;
const PRESETS = [1, 0.1, 0.01, 0.001, 0.0001];
const HEADING_STYLE = { margin: '0 0 8px' } as const;

const DEFAULTS: PhState = { acid: 'CH3CO2H', concentration: 0.1 };

/** Anything the database knows about can be dropped in the beaker. */
const KNOWN_SPECIES = new Set(ALL_SPECIES);

const CODEC: ToolStateCodec<PhState> = {
  encode: (state) => ({
    acid: ifChanged(state.acid, DEFAULTS.acid),
    c: ifChanged(state.concentration, DEFAULTS.concentration),
  }),
  decode: (query, defaults) => {
    const requested = query.acid;
    return {
      acid:
        requested !== undefined && KNOWN_SPECIES.has(requested)
          ? requested
          : defaults.acid,
      concentration: clampConcentration(
        numberParam(query.c, defaults.concentration),
      ),
    };
  },
};

function clampConcentration(value: number): number {
  return Math.min(Math.max(value, 0), MAX_CONCENTRATION);
}
