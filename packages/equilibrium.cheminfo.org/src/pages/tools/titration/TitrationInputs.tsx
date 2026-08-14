import { Icon, NumericInput, Tooltip } from '@blueprintjs/core';

import { ACID_BASE_SPECIES } from '../../../chemistry/species.ts';

import { SpeciesChoice } from './SpeciesChoice.tsx';
import type { TitrationState } from './state.ts';

interface TitrationInputsProps {
  state: TitrationState;
  onChange: (patch: Partial<TitrationState>) => void;
}

/**
 * The two solutions, their concentrations and volumes, and the sweep density.
 *
 * Both solutions carry the same three fields, so they are laid out as two
 * columns of one grid: each label is written once, and the pair of values that
 * a titration is about can be read across.
 * @param props - Current values and how to change them.
 * @returns The input form.
 */
export function TitrationInputs(props: TitrationInputsProps) {
  const { state, onChange } = props;

  return (
    <div className="field-grid">
      <span />
      <ColumnHead label="Titrated" hint="The solution in the flask." />
      <ColumnHead label="Titrant" hint="The solution added from the burette." />

      <RowLabel label="Acid or base" />
      <SpeciesChoice
        value={state.analyte}
        options={ACID_BASE_SPECIES}
        ariaLabel="Species of the solution to be titrated"
        size="small"
        onChange={(analyte) => onChange({ analyte })}
      />
      <SpeciesChoice
        value={state.titrant}
        options={ACID_BASE_SPECIES}
        ariaLabel="Species of the titrant solution"
        size="small"
        onChange={(titrant) => onChange({ titrant })}
      />

      <RowLabel label="Concentration" unit="mol/L" />
      <Amount
        value={state.analyteConcentration}
        step={0.01}
        minorStep={CONCENTRATION_PRECISION}
        ariaLabel="Concentration of the solution to be titrated, in mol/L"
        onChange={(analyteConcentration) => onChange({ analyteConcentration })}
      />
      <Amount
        value={state.titrantConcentration}
        step={0.01}
        minorStep={CONCENTRATION_PRECISION}
        ariaLabel="Concentration of the titrant solution, in mol/L"
        onChange={(titrantConcentration) => onChange({ titrantConcentration })}
      />

      <RowLabel
        label="Volume"
        unit="mL"
        hint="What the flask holds, and how far the curve goes — not the size of the burette."
      />
      <Amount
        value={state.analyteVolume}
        step={1}
        minorStep={0.001}
        ariaLabel="Volume in the flask, in mL"
        onChange={(analyteVolume) => onChange({ analyteVolume })}
      />
      <Amount
        value={state.titrantVolume}
        step={1}
        minorStep={0.001}
        ariaLabel="Volume of titrant the curve stops at, in mL"
        onChange={(titrantVolume) => onChange({ titrantVolume })}
      />

      <RowLabel
        label="Points"
        hint="Every point is a full multi-equilibrium solve."
      />
      <Amount
        value={state.points}
        step={50}
        minorStep={1}
        min={10}
        max={2000}
        ariaLabel="Number of points on the curve"
        onChange={(points) => onChange({ points })}
      />
    </div>
  );
}

interface ColumnHeadProps {
  label: string;
  hint: string;
}

function ColumnHead(props: ColumnHeadProps) {
  const { label, hint } = props;

  return (
    <span className="field-head">
      {label}
      <Hint content={hint} />
    </span>
  );
}

interface RowLabelProps {
  label: string;
  /** Unit both columns of the row are expressed in. */
  unit?: string;
  /** What the row means, when the label alone is not enough. */
  hint?: string;
}

function RowLabel(props: RowLabelProps) {
  const { label, unit, hint } = props;

  return (
    <span className="field-label">
      {label}
      {unit ? <span className="bp6-text-muted">{unit}</span> : null}
      {hint ? <Hint content={hint} /> : null}
    </span>
  );
}

function Hint(props: { content: string }) {
  return (
    <Tooltip content={props.content} className="help-icon" compact>
      <Icon icon="info-sign" size={12} className="bp6-text-muted" />
    </Tooltip>
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
  /** Accessible name, since the grid label is not tied to the input. */
  ariaLabel: string;
  onChange: (value: number) => void;
}

function Amount(props: AmountProps) {
  const {
    value,
    step,
    minorStep = step / 10,
    min = 0,
    max,
    ariaLabel,
    onChange,
  } = props;

  return (
    <NumericInput
      value={value}
      min={min}
      max={max}
      stepSize={step}
      minorStepSize={minorStep}
      majorStepSize={step * 10}
      size="small"
      fill
      aria-label={ariaLabel}
      onValueChange={(next) => {
        if (Number.isFinite(next)) onChange(next);
      }}
    />
  );
}

/** Concentrations reach down to trace level, so nine decimals are kept. */
const CONCENTRATION_PRECISION = 1e-9;
