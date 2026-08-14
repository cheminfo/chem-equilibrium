import { Icon } from '@blueprintjs/core';
import { useEffect, useLayoutEffect, useRef } from 'react';

import type { AnswerStatus } from '../../../chemistry/answers.ts';
import { formatConcentration } from '../../../chemistry/format.ts';
import { Species } from '../../../components/Species.tsx';
import {
  activateRowOnKey,
  followSelectionWithFocus,
} from '../../../components/selectableRow.ts';

import type { SolvedExercise } from './computation.ts';
import { STATUS_STYLES } from './status.ts';

interface ExerciseListProps {
  solved: SolvedExercise[];
  /** Status of every question, in the same order as `solved`. */
  statuses: AnswerStatus[];
  /** What the student typed for every question, in the same order. */
  answers: string[];
  /** 1-based number of the question being worked on. */
  openIndex: number;
  onOpen: (index: number) => void;
}

/**
 * The whole series at a glance: what was asked, what was typed, how it went.
 *
 * The arrow keys move from one question to the next, so a student can work
 * through the series without going back to the mouse between two answers.
 * @param props - The questions, their statuses, and the open one.
 * @returns The list.
 */
export function ExerciseList(props: ExerciseListProps) {
  const { solved, statuses, answers, openIndex, onOpen } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(solved.length);
  const openRef = useRef(openIndex);
  const onOpenRef = useRef(onOpen);

  useLayoutEffect(() => {
    countRef.current = solved.length;
    openRef.current = openIndex;
    onOpenRef.current = onOpen;
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
      const count = countRef.current;
      if (count === 0) return;
      event.preventDefault();
      const next =
        event.key === 'ArrowDown'
          ? Math.min(openRef.current + 1, count)
          : Math.max(openRef.current - 1, 1);
      if (next !== openRef.current) onOpenRef.current(next);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    followSelectionWithFocus(listRef.current);
    const row = listRef.current?.querySelector('[data-selected="true"]');
    row?.scrollIntoView({ block: 'nearest' });
  }, [openIndex]);

  return (
    <div className="scroll-y" ref={listRef} style={{ maxHeight: 460 }}>
      <table
        className="data-table bp6-html-table bp6-compact bp6-interactive"
        role="grid"
        aria-label="Questions of the series"
      >
        <thead>
          <tr>
            <th>No.</th>
            <th>Solution of</th>
            <th className="numeric">C (mol/L)</th>
            <th className="numeric">My answer</th>
            <th aria-label="Status" />
          </tr>
        </thead>
        <tbody>
          {solved.map((exercise, position) => {
            const { index, formed, concentration } = exercise.question;
            const status = statuses[position] ?? 'unanswered';
            const style = STATUS_STYLES[status];
            const selected = index === openIndex;
            return (
              <tr
                key={index}
                className="selectable"
                data-selected={selected ? 'true' : undefined}
                aria-selected={selected}
                aria-label={`Question ${index}, solution of ${formed}, ${formatConcentration(concentration)} mol/L, ${style.label}`}
                // Roving tab stop: Tab reaches the open question, the arrow
                // keys walk the series from there.
                tabIndex={selected ? 0 : -1}
                onClick={() => onOpen(index)}
                onKeyDown={(event) =>
                  activateRowOnKey(event, () => onOpen(index))
                }
                style={{
                  background: style.background,
                  boxShadow: selected ? 'inset 3px 0 0 #2d72d2' : undefined,
                  fontWeight: selected ? 600 : undefined,
                }}
              >
                <td>{index}</td>
                <td>
                  <Species label={formed} />
                </td>
                <td className="numeric">
                  {formatConcentration(concentration)}
                </td>
                <td className="numeric">{answers[position] ?? ''}</td>
                <td style={{ width: 24 }}>
                  <Icon
                    icon={style.icon}
                    intent={style.intent}
                    title={style.label}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
