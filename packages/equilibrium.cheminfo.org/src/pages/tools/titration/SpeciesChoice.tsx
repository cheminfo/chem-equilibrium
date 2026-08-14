import { Button, InputGroup, PopoverNext } from '@blueprintjs/core';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

import { matchesSpecies, nameOf } from '../../../chemistry/species.ts';
import { Species } from '../../../components/Species.tsx';

interface SpeciesChoiceProps {
  /** Label of the species currently chosen. */
  value: string;
  /** Every label the user may pick from. */
  options: string[];
  onChange: (label: string) => void;
  /** Accessible name of the control. */
  ariaLabel: string;
}

/**
 * Choose one species, with the formula typeset rather than spelled out.
 *
 * A native `select` can only hold plain text, which would print `CO3--`
 * verbatim; the popover shows the same list with real subscripts and charges,
 * and searches the English names as well as the formulas.
 * @param props - The current choice and what may be chosen.
 * @returns The picker.
 */
export function SpeciesChoice(props: SpeciesChoiceProps) {
  const { value, options, onChange, ariaLabel } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () => options.filter((label) => matchesSpecies(label, query)),
    [options, query],
  );

  function choose(label: string): void {
    onChange(label);
    setOpen(false);
    setQuery('');
  }

  return (
    <PopoverNext
      isOpen={open}
      onInteraction={setOpen}
      placement="bottom-start"
      content={
        <div style={PANEL_STYLE}>
          <InputGroup
            leftIcon="search"
            placeholder="Search a formula or a name…"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <div className="scroll-y" style={{ maxHeight: 280 }}>
            {visible.map((label) => (
              <button
                key={label}
                type="button"
                style={{
                  ...OPTION_STYLE,
                  background:
                    label === value
                      ? 'rgba(45, 114, 210, 0.15)'
                      : 'transparent',
                }}
                onClick={() => choose(label)}
              >
                <Species label={label} withName={false} />
                <span className="bp6-text-muted">{nameOf(label) ?? ''}</span>
              </button>
            ))}
            {visible.length === 0 ? (
              <p className="bp6-text-muted" style={{ padding: 8 }}>
                No species matches “{query}”.
              </p>
            ) : null}
          </div>
        </div>
      }
    >
      <Button
        variant="outlined"
        endIcon="caret-down"
        alignText="start"
        fill
        aria-label={ariaLabel}
      >
        <Species label={value} />
      </Button>
    </PopoverNext>
  );
}

const PANEL_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 6,
  width: 300,
};

const OPTION_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '3px 6px',
  border: 'none',
  textAlign: 'left',
  font: 'inherit',
  cursor: 'pointer',
};
