import { Button, InputGroup } from '@blueprintjs/core';
import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  describeColor,
  formatRanges,
  realTransitions,
} from '../chemistry/indicatorFit.ts';
import type { Indicator } from '../chemistry/indicators.ts';

import { ColorSwatch, IndicatorBar, PhRuler } from './IndicatorBar.tsx';

interface IndicatorPickerProps {
  indicators: Indicator[];
  /** Name of the selected indicator; the empty string selects none. */
  selected: string;
  onSelect: (name: string) => void;
}

/**
 * The laboratory indicators, each with its transition range and colour bar.
 *
 * Picking one here is the whole point of the tool: the colour bar and the
 * curve are drawn on the same pH axis, so the student sees straight away
 * whether the indicator turns where the curve jumps.
 * @param props - The indicators and the current choice.
 * @returns The searchable list.
 */
export function IndicatorPicker(props: IndicatorPickerProps) {
  const { indicators, selected, onSelect } = props;
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return indicators;
    return indicators.filter((entry) =>
      entry.name.toLowerCase().includes(needle),
    );
  }, [indicators, query]);

  const names = useMemo(
    () => ['', ...visible.map((entry) => entry.name)],
    [visible],
  );
  const listRef = useArrowKeys(names, selected, onSelect);

  return (
    <div className="panel-stack">
      <InputGroup
        leftIcon="search"
        placeholder="Search an indicator…"
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

      <div>
        {/* Matches the row padding plus the list border, so the ruler lines up. */}
        <div style={{ padding: '0 9px' }}>
          <PhRuler />
        </div>
        <div className="scroll-y" ref={listRef} style={LIST_STYLE}>
          <IndicatorRow
            name=""
            title="No indicator"
            selected={selected === ''}
            onSelect={onSelect}
          />
          {visible.map((indicator) => (
            <IndicatorRow
              key={indicator.name}
              name={indicator.name}
              title={indicator.name}
              indicator={indicator}
              selected={selected === indicator.name}
              onSelect={onSelect}
            />
          ))}
          {visible.length === 0 ? (
            <p className="bp6-text-muted" style={{ padding: 8 }}>
              No indicator matches “{query}”.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface IndicatorRowProps {
  name: string;
  title: string;
  indicator?: Indicator;
  selected: boolean;
  onSelect: (name: string) => void;
}

function IndicatorRow(props: IndicatorRowProps) {
  const { name, title, indicator, selected, onSelect } = props;

  return (
    <button
      type="button"
      data-selected={selected ? 'true' : undefined}
      aria-pressed={selected}
      onClick={() => onSelect(name)}
      style={{
        ...ROW_STYLE,
        background: selected ? 'rgba(45, 114, 210, 0.15)' : 'transparent',
      }}
    >
      <span style={HEADER_STYLE}>
        <span style={{ fontWeight: selected ? 600 : 400 }}>{title}</span>
        {indicator ? (
          <span className="bp6-text-muted" style={{ marginLeft: 'auto' }}>
            pH {formatRanges(indicator)}
          </span>
        ) : null}
        {indicator ? <Swatches indicator={indicator} /> : null}
      </span>
      {indicator ? <IndicatorBar indicator={indicator} height={12} /> : null}
    </button>
  );
}

function Swatches({ indicator }: { indicator: Indicator }) {
  const transitions = realTransitions(indicator);
  const first = transitions[0];
  const last = transitions.at(-1);
  if (!first || !last) return null;

  return (
    <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      <ColorSwatch
        color={first.color1}
        label={`acid form: ${describeColor(first.color1)}`}
        size={13}
      />
      <span aria-hidden="true" style={{ fontSize: 10, color: '#5f6b7c' }}>
        →
      </span>
      <ColorSwatch
        color={last.color2}
        label={`base form: ${describeColor(last.color2)}`}
        size={13}
      />
    </span>
  );
}

/**
 * Move through the list with the arrow keys, as any list with a selection must.
 * @param names - Selectable values, in the order they are shown.
 * @param selected - The current value.
 * @param onSelect - Called with the value the user moved to.
 * @returns The ref to put on the scrolling container.
 */
function useArrowKeys(
  names: string[],
  selected: string,
  onSelect: (name: string) => void,
) {
  const listRef = useRef<HTMLDivElement>(null);
  const namesRef = useRef(names);
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);

  useLayoutEffect(() => {
    namesRef.current = names;
    selectedRef.current = selected;
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      ) {
        return;
      }
      const list = namesRef.current;
      if (list.length === 0) return;
      event.preventDefault();
      const current = list.indexOf(selectedRef.current);
      const next =
        event.key === 'ArrowDown'
          ? Math.min(current + 1, list.length - 1)
          : Math.max(current - 1, 0);
      if (next !== current) onSelectRef.current(list[next] ?? '');
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return listRef;
}

const LIST_STYLE: CSSProperties = {
  border: '1px solid rgba(17, 20, 24, 0.15)',
  borderRadius: 3,
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  width: '100%',
  padding: '5px 8px',
  border: 'none',
  borderBottom: '1px solid rgba(17, 20, 24, 0.08)',
  textAlign: 'left',
  font: 'inherit',
  cursor: 'pointer',
};

const HEADER_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};
