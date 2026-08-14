import { Button, InputGroup, Tag } from '@blueprintjs/core';
import type { EquationType } from 'chem-equilibrium';

import { EQUATION_TYPES, TYPE_LABELS } from './dataset.ts';

interface DataFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  /**
   * Kinds of equilibria kept, empty meaning all of them. Left out on the
   * species tab, where the filter does not apply.
   */
  types?: EquationType[];
  onTypesChange?: (types: EquationType[]) => void;
  /** How many rows the filters keep, and out of how many. */
  shown: number;
  total: number;
  /** What a row is called, e.g. `equilibria`. */
  noun: string;
  /**
   * How many of the shown rows carry no literature reference, spelled out
   * rather than left to be discovered cell by cell.
   */
  missingSource?: number;
}

/**
 * The search box and the type capsules that drive both tables.
 * @param props - Current filters and how many rows they keep.
 * @returns The filter bar.
 */
export function DataFilters(props: DataFiltersProps) {
  const {
    query,
    onQueryChange,
    types,
    onTypesChange,
    shown,
    total,
    noun,
    missingSource,
  } = props;

  function toggle(type: EquationType): void {
    if (!types || !onTypesChange) return;
    onTypesChange(
      types.includes(type)
        ? types.filter((kept) => kept !== type)
        : [...types, type],
    );
  }

  return (
    <div className="panel-stack no-print">
      <InputGroup
        leftIcon="search"
        placeholder="Search a formula, an English name or a synonym…"
        value={query}
        onValueChange={onQueryChange}
        rightElement={
          query ? (
            <Button
              icon="cross"
              variant="minimal"
              aria-label="Clear the search"
              onClick={() => onQueryChange('')}
            />
          ) : undefined
        }
      />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {types && onTypesChange ? (
          <>
            <Tag
              interactive
              minimal={types.length > 0}
              onClick={() => onTypesChange([])}
            >
              all types ({total})
            </Tag>
            {EQUATION_TYPES.map((type) => (
              <Tag
                key={type}
                interactive
                minimal={!types.includes(type)}
                intent={INTENTS[type]}
                onClick={() => toggle(type)}
              >
                {TYPE_LABELS[type]}
              </Tag>
            ))}
          </>
        ) : null}
        <span className="bp6-text-muted" style={{ alignSelf: 'center' }}>
          {shown === total
            ? `${total} ${noun}`
            : `${shown} of ${total} ${noun}`}
          {missingSource !== undefined && missingSource > 0
            ? `, ${missingSource} of them with no documented source`
            : ''}
        </span>
      </div>
    </div>
  );
}

const INTENTS = {
  acidoBasic: 'primary',
  complexation: 'success',
  precipitation: 'warning',
} as const;
