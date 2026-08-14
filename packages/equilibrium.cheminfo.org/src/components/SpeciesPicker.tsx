import { Button, Checkbox, InputGroup, NumericInput } from '@blueprintjs/core';
import { useMemo, useState } from 'react';

import { matchesSpecies, nameOf } from '../chemistry/species.ts';

import { Species } from './Species.tsx';

/** A species the user put in the beaker, with the amount introduced. */
export interface SelectedSpecies {
  label: string;
  /** Analytical amount, in mol/L. */
  quantity: number;
}

interface SpeciesPickerProps {
  /** Every label the user may pick from. */
  available: string[];
  selected: SelectedSpecies[];
  onChange: (selected: SelectedSpecies[]) => void;
  /**
   * Amount given to a newly ticked species.
   * @default 1
   */
  defaultQuantity?: number;
}

/**
 * Pick the species that go into the solution and set how much of each.
 *
 * Searching matches the formula and the English name alike, so a student who
 * knows "carbonate" but not `CO3--` still finds it.
 * @param props - Available and selected species.
 * @returns The picker.
 */
export function SpeciesPicker(props: SpeciesPickerProps) {
  const { available, selected, onChange, defaultQuantity = 1 } = props;
  const [query, setQuery] = useState('');

  const selectedByLabel = useMemo(
    () => new Map(selected.map((entry) => [entry.label, entry])),
    [selected],
  );

  const visible = useMemo(
    () => available.filter((label) => matchesSpecies(label, query)),
    [available, query],
  );

  function toggle(label: string): void {
    onChange(
      selectedByLabel.has(label)
        ? selected.filter((entry) => entry.label !== label)
        : [...selected, { label, quantity: defaultQuantity }],
    );
  }

  function setQuantity(label: string, quantity: number): void {
    onChange(
      selected.map((entry) =>
        entry.label === label ? { ...entry, quantity } : entry,
      ),
    );
  }

  return (
    <div className="panel-stack">
      <InputGroup
        leftIcon="search"
        placeholder="Search a formula or a name…"
        value={query}
        onValueChange={setQuery}
        rightElement={
          query ? (
            <Button
              icon="cross"
              variant="minimal"
              onClick={() => setQuery('')}
            />
          ) : undefined
        }
      />

      {selected.length > 0 ? (
        <table className="data-table bp6-html-table bp6-compact">
          <thead>
            <tr>
              <th>In solution</th>
              <th className="numeric">Amount (mol/L)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {selected.map((entry) => (
              <tr key={entry.label}>
                <td>
                  <Species label={entry.label} />
                </td>
                <td>
                  <NumericInput
                    value={entry.quantity}
                    min={0}
                    minorStepSize={0.001}
                    stepSize={0.01}
                    majorStepSize={0.1}
                    fill
                    onValueChange={(value) => {
                      if (Number.isFinite(value)) {
                        setQuantity(entry.label, value);
                      }
                    }}
                  />
                </td>
                <td>
                  <Button
                    icon="cross"
                    variant="minimal"
                    aria-label={`Remove ${entry.label}`}
                    onClick={() => toggle(entry.label)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="bp6-text-muted">
          Tick the species you put in the solution. Every equilibrium they can
          take part in is pulled in automatically.
        </p>
      )}

      <div className="scroll-y">
        {visible.map((label) => (
          <Checkbox
            key={label}
            checked={selectedByLabel.has(label)}
            onChange={() => toggle(label)}
            labelElement={
              <span>
                <Species label={label} withName={false} />
                <span className="bp6-text-muted"> {nameOf(label) ?? ''}</span>
              </span>
            }
          />
        ))}
        {visible.length === 0 ? (
          <p className="bp6-text-muted">No species matches “{query}”.</p>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <Button
          icon="eraser"
          text="Clear selection"
          variant="minimal"
          onClick={() => onChange([])}
        />
      ) : null}
    </div>
  );
}
