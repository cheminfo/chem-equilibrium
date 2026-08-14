import { FormGroup, NumericInput } from '@blueprintjs/core';

import { ACID_BASE_SPECIES } from '../../../chemistry/species.ts';

import { SpeciesChoice } from './SpeciesChoice.tsx';
import type { TitrationState } from './state.ts';

interface TitrationInputsProps {
  state: TitrationState;
  onChange: (patch: Partial<TitrationState>) => void;
}

/**
 * The two solutions, their concentrations and volumes, and the sweep density.
 * @param props - Current values and how to change them.
 * @returns The input form.
 */
export function TitrationInputs(props: TitrationInputsProps) {
  const { state, onChange } = props;

  return (
    <div className="panel-stack">
      <div>
        <h3 style={HEADING_STYLE}>Solution to be titrated</h3>
        <FormGroup label="Acid or base">
          <SpeciesChoice
            value={state.analyte}
            options={ACID_BASE_SPECIES}
            ariaLabel="Species of the solution to be titrated"
            onChange={(analyte) => onChange({ analyte })}
          />
        </FormGroup>
        <FormGroup label="Concentration (mol/L)">
          <Amount
            value={state.analyteConcentration}
            step={0.01}
            minorStep={CONCENTRATION_PRECISION}
            onChange={(analyteConcentration) =>
              onChange({ analyteConcentration })
            }
          />
        </FormGroup>
        <FormGroup label="Volume in the flask (mL)">
          <Amount
            value={state.analyteVolume}
            step={1}
            minorStep={0.001}
            onChange={(analyteVolume) => onChange({ analyteVolume })}
          />
        </FormGroup>
      </div>

      <div>
        <h3 style={HEADING_STYLE}>Titrant solution</h3>
        <FormGroup label="Acid or base">
          <SpeciesChoice
            value={state.titrant}
            options={ACID_BASE_SPECIES}
            ariaLabel="Species of the titrant solution"
            onChange={(titrant) => onChange({ titrant })}
          />
        </FormGroup>
        <FormGroup label="Concentration (mol/L)">
          <Amount
            value={state.titrantConcentration}
            step={0.01}
            minorStep={CONCENTRATION_PRECISION}
            onChange={(titrantConcentration) =>
              onChange({ titrantConcentration })
            }
          />
        </FormGroup>
        <FormGroup
          label="Titrate up to (mL)"
          helperText="Where the curve stops, not the size of the burette."
        >
          <Amount
            value={state.titrantVolume}
            step={1}
            minorStep={0.001}
            onChange={(titrantVolume) => onChange({ titrantVolume })}
          />
        </FormGroup>
        <FormGroup
          label="Number of points"
          helperText="Every point is a full multi-equilibrium solve."
        >
          <Amount
            value={state.points}
            step={50}
            minorStep={1}
            min={10}
            max={2000}
            onChange={(points) => onChange({ points })}
          />
        </FormGroup>
      </div>
    </div>
  );
}

interface AmountProps {
  value: number;
  step: number;
  /**
   * Finest value the field keeps. Blueprint rounds anything more precise away,
   * which would silently turn a 1e-6 mol/L concentration into zero.
   * @default step / 10
   */
  minorStep?: number;
  /**
   * Smallest accepted value.
   * @default 0
   */
  min?: number;
  /** Largest accepted value; unbounded when omitted. */
  max?: number;
  onChange: (value: number) => void;
}

function Amount(props: AmountProps) {
  const { value, step, minorStep = step / 10, min = 0, max, onChange } = props;

  return (
    <NumericInput
      value={value}
      min={min}
      max={max}
      stepSize={step}
      minorStepSize={minorStep}
      majorStepSize={step * 10}
      fill
      onValueChange={(next) => {
        if (Number.isFinite(next)) onChange(next);
      }}
    />
  );
}

/** Concentrations reach down to trace level, so nine decimals are kept. */
const CONCENTRATION_PRECISION = 1e-9;

const HEADING_STYLE = { margin: '0 0 8px', fontSize: 14 } as const;
