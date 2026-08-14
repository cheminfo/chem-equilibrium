import type { IconName, Intent } from '@blueprintjs/core';

import type { AnswerStatus } from '../../../chemistry/answers.ts';

/** How one state of an answer looks in the list and on the question card. */
export interface StatusStyle {
  label: string;
  intent: Intent;
  icon: IconName;
  /** Row background; a question nobody answered stays neutral. */
  background: string | undefined;
}

/**
 * The three states a question can be in, plus the unreadable-input one.
 *
 * A question nobody has answered stays colourless, so that only the questions
 * the student actually got wrong are ever painted as wrong.
 */
export const STATUS_STYLES: Record<AnswerStatus, StatusStyle> = {
  unanswered: {
    label: 'Not answered',
    intent: 'none',
    icon: 'circle',
    background: undefined,
  },
  invalid: {
    label: 'Unreadable',
    intent: 'warning',
    icon: 'help',
    background: 'rgb(217 130 43 / 12%)',
  },
  wrong: {
    label: 'Not yet',
    intent: 'danger',
    icon: 'cross-circle',
    background: 'rgb(205 66 70 / 12%)',
  },
  solved: {
    label: 'Solved',
    intent: 'success',
    icon: 'tick-circle',
    background: 'rgb(15 153 96 / 14%)',
  },
};
