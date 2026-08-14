import { Button, InputGroup } from '@blueprintjs/core';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { AcidCouple } from '../chemistry/acidCouples.ts';
import { ACID_COUPLES, matchesCouple } from '../chemistry/acidCouples.ts';
import { formatPK } from '../chemistry/format.ts';
import { STRENGTH_BANDS, nameOf, strengthBand } from '../chemistry/species.ts';

import { EquationText } from './EquationText.tsx';
import { activateRowOnKey, followSelectionWithFocus } from './selectableRow.ts';

interface AcidListProps {
  /** Label of the acid currently picked, i.e. the protonated species. */
  selected: string;
  onSelect: (acid: string) => void;
}

/**
 * The acid/base couples of the database, banded by strength and searchable.
 *
 * The colour of a row is the whole pedagogic point: it places the couple with
 * respect to the water levelling window before any number is computed.
 * @param props - The picked acid and what to do when another one is picked.
 * @returns The searchable list.
 */
export function AcidList(props: AcidListProps) {
  const { selected, onSelect } = props;
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => ACID_COUPLES.filter((couple) => matchesCouple(couple, query)),
    [query],
  );

  // The row that holds the tab stop; the search can hide the picked couple, and
  // a list no key can reach would then be left behind.
  const tabbable = visible.some((couple) => couple.acid === selected)
    ? selected
    : visible[0]?.acid;

  useArrowSelection(visible, selected, onSelect);

  useEffect(() => {
    followSelectionWithFocus(listRef.current);
    revealSelectedRow(listRef.current);
  }, [selected]);

  return (
    <div className="panel-stack">
      <InputGroup
        leftIcon="search"
        placeholder="Search an acid, a base or a pKa…"
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

      <div className="scroll-y scroll-x" ref={listRef}>
        <table
          className="data-table bp6-html-table bp6-compact"
          role="grid"
          aria-label="Acid/base couples of the database"
        >
          <thead>
            <tr>
              <th style={HEADER_STYLE}>Equilibrium</th>
              <th className="numeric" style={HEADER_STYLE}>
                pKa
              </th>
              <th style={HEADER_STYLE}>Name</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((couple) => {
              const isSelected = couple.acid === selected;
              return (
                <tr
                  key={couple.acid}
                  className="selectable"
                  data-selected={isSelected ? 'true' : undefined}
                  aria-selected={isSelected}
                  aria-label={describeCouple(couple)}
                  // Roving tab stop: Tab reaches the picked couple, the arrow
                  // keys walk the list from there.
                  tabIndex={couple.acid === tabbable ? 0 : -1}
                  style={{
                    backgroundColor:
                      STRENGTH_BANDS[strengthBand(couple.pK)].color,
                    outline: isSelected ? '2px solid #2d72d2' : undefined,
                    outlineOffset: isSelected ? '-2px' : undefined,
                    fontWeight: isSelected ? 600 : undefined,
                  }}
                  onClick={() => onSelect(couple.acid)}
                  onKeyDown={(event) =>
                    activateRowOnKey(event, () => onSelect(couple.acid))
                  }
                >
                  <td>
                    <EquationText equation={couple.equation} />
                  </td>
                  <td className="numeric">{formatPK(couple.pK)}</td>
                  <td className="bp6-text-muted">
                    {nameOf(couple.acid) ?? ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="bp6-text-muted">No couple matches “{query}”.</p>
        ) : null}
      </div>

      <p className="bp6-text-muted" style={{ margin: 0, fontSize: 12 }}>
        {visible.length} of {ACID_COUPLES.length} couples, strongest acid first.
        Click a row, or use the arrow keys.
      </p>
    </div>
  );
}

/**
 * What a row is called when it is read out rather than looked at: the cells
 * hold a typeset equation and a bare number, which name nothing on their own.
 * @param couple - The couple the row shows.
 * @returns The accessible name of the row.
 */
function describeCouple(couple: AcidCouple): string {
  const name = nameOf(couple.acid);
  return `${couple.acid}${name ? `, ${name}` : ''}, pKa ${formatPK(couple.pK)}`;
}

const HEADER_STYLE = {
  position: 'sticky',
  top: 0,
  background: 'white',
  zIndex: 1,
} as const;

/**
 * Bring the selected row inside the list, scrolling the list only: letting the
 * browser do it would scroll the page itself when the tool is first opened.
 * @param container - The scrolling element of the list.
 */
function revealSelectedRow(container: HTMLDivElement | null): void {
  const row = container?.querySelector('[data-selected="true"]');
  if (!container || !(row instanceof HTMLElement)) return;
  const listBox = container.getBoundingClientRect();
  const rowBox = row.getBoundingClientRect();
  const headerHeight =
    container.querySelector('thead')?.getBoundingClientRect().height ?? 0;
  if (rowBox.top < listBox.top + headerHeight) {
    container.scrollTop -= listBox.top + headerHeight - rowBox.top;
  } else if (rowBox.bottom > listBox.bottom) {
    container.scrollTop += rowBox.bottom - listBox.bottom;
  }
}

/**
 * Move the selection with the arrow keys, as long as the student is not typing
 * in a field.
 * @param couples - The rows currently listed.
 * @param selected - The acid currently picked.
 * @param onSelect - Called with the acid the arrow lands on.
 */
function useArrowSelection(
  couples: AcidCouple[],
  selected: string,
  onSelect: (acid: string) => void,
): void {
  const couplesRef = useRef(couples);
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);

  useLayoutEffect(() => {
    couplesRef.current = couples;
    selectedRef.current = selected;
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const active = globalThis.document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement
      ) {
        return;
      }
      const list = couplesRef.current;
      if (list.length === 0) return;
      event.preventDefault();
      const current = list.findIndex(
        (couple) => couple.acid === selectedRef.current,
      );
      const next =
        event.key === 'ArrowDown'
          ? Math.min(current + 1, list.length - 1)
          : Math.max(current - 1, 0);
      const couple = list[next];
      if (couple && next !== current) onSelectRef.current(couple.acid);
    }

    globalThis.document.addEventListener('keydown', handleKeyDown);
    return () => {
      globalThis.document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
