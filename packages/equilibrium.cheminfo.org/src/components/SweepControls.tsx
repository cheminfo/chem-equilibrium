import {
  Button,
  Collapse,
  FormGroup,
  NumericInput,
  SegmentedControl,
  Switch,
  Tag,
} from '@blueprintjs/core';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Species } from './Species.tsx';
import type { WorkbenchState } from './workbenchPreset.ts';

interface SweepControlsProps {
  state: WorkbenchState;
  onChange: (patch: Partial<WorkbenchState>) => void;
  /** Independent components of the current system, any of which can be swept. */
  components: string[];
  /** The component actually swept: the chosen one, or the first one available. */
  varying: string;
  /**
   * Let the user choose the swept component, its range and its scale.
   * @default false
   */
  exposeSweep?: boolean;
  /** One line describing a sweep that is hard-wired instead. */
  note?: ReactNode;
}

/**
 * The sweep parameters and the solver settings of a speciation tool.
 *
 * The solver settings stay folded away: they only matter once a point fails to
 * converge, and a student who has to reach for them should know why.
 * @param props - Current state and the components that can be swept.
 * @returns The control panel.
 */
export function SweepControls(props: SweepControlsProps) {
  const { state, onChange, components, varying, exposeSweep, note } = props;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="panel-stack">
      {exposeSweep ? (
        <>
          <FormGroup label="Varying component">
            {components.length === 0 ? (
              <span className="bp6-text-muted">
                Pick some species to begin.
              </span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {components.map((label) => (
                  <Tag
                    key={label}
                    interactive
                    intent="primary"
                    minimal={label !== varying}
                    onClick={() => onChange({ varying: label })}
                  >
                    <Species label={label} />
                  </Tag>
                ))}
              </div>
            )}
          </FormGroup>

          <SegmentedControl
            fill
            value={state.isFixed ? 'fixed' : 'total'}
            options={[
              { value: 'fixed', label: 'Fixed at equilibrium' },
              { value: 'total', label: 'Total amount' },
            ]}
            onValueChange={(value) => onChange({ isFixed: value === 'fixed' })}
          />

          <Switch
            checked={state.log}
            label="Sweep on a p-scale (the abscissa is −log₁₀ of the amount)"
            onChange={(event) => onChange({ log: event.currentTarget.checked })}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <FormGroup label="From" style={{ flex: 1 }}>
              <NumericInput
                fill
                value={state.from}
                minorStepSize={0.001}
                onValueChange={(value) => {
                  if (Number.isFinite(value)) onChange({ from: value });
                }}
              />
            </FormGroup>
            <FormGroup label="To" style={{ flex: 1 }}>
              <NumericInput
                fill
                value={state.to}
                minorStepSize={0.001}
                onValueChange={(value) => {
                  if (Number.isFinite(value)) onChange({ to: value });
                }}
              />
            </FormGroup>
          </div>
        </>
      ) : (
        <p className="bp6-text-muted" style={{ margin: 0 }}>
          {note}
        </p>
      )}

      <Button
        variant="minimal"
        alignText="start"
        icon={settingsOpen ? 'chevron-down' : 'chevron-right'}
        text="Solver settings"
        onClick={() => setSettingsOpen(!settingsOpen)}
      />
      <Collapse isOpen={settingsOpen}>
        <div className="panel-stack">
          <DecadeInput
            label="Tolerance on the dissolved species"
            value={state.tolerance}
            onChange={(tolerance) => onChange({ tolerance })}
          />
          <DecadeInput
            label="Tolerance on the solubility products"
            value={state.solidTolerance}
            onChange={(solidTolerance) => onChange({ solidTolerance })}
          />
          <FormGroup
            label="Iterations before giving up"
            helperText="Raise it when points fail to converge."
          >
            <NumericInput
              fill
              min={10}
              max={2000}
              stepSize={10}
              value={state.maxIterations}
              onValueChange={(value) => {
                if (Number.isFinite(value)) {
                  onChange({ maxIterations: Math.round(value) });
                }
              }}
            />
          </FormGroup>
          <FormGroup
            label="Points in the sweep"
            helperText="One more point than the number of intervals."
          >
            <NumericInput
              fill
              min={10}
              max={2000}
              stepSize={50}
              value={state.chunks}
              onValueChange={(value) => {
                if (Number.isFinite(value)) {
                  onChange({ chunks: Math.round(value) });
                }
              }}
            />
          </FormGroup>
        </div>
      </Collapse>
    </div>
  );
}

interface DecadeInputProps {
  label: string;
  /** The tolerance itself, always a power of ten. */
  value: number;
  onChange: (value: number) => void;
}

/**
 * Edit a tolerance through its decade, because `1e-15` is unusable in a spinner.
 * @param props - Label and current value.
 * @returns The input.
 */
function DecadeInput(props: DecadeInputProps) {
  const { label, value, onChange } = props;
  const decade = Math.round(-Math.log10(value));

  return (
    <FormGroup label={label} helperText={`Currently ${value.toExponential(0)}`}>
      <NumericInput
        fill
        min={2}
        max={30}
        value={decade}
        leftElement={<Tag minimal>10⁻</Tag>}
        onValueChange={(next) => {
          if (Number.isFinite(next)) onChange(10 ** -Math.round(next));
        }}
      />
    </FormGroup>
  );
}
