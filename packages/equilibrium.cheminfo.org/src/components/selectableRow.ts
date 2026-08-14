import type { KeyboardEvent } from 'react';

/**
 * Activate the focused row of a selectable table.
 *
 * A row carries its handler on the `<tr>` itself, so `Enter` and `Space` have
 * to be wired by hand: without them the row is a target the mouse can reach
 * and the keyboard cannot.
 * @param event - Key event of the focused row.
 * @param activate - What clicking the row would do.
 */
export function activateRowOnKey(
  event: KeyboardEvent<HTMLTableRowElement>,
  activate: () => void,
): void {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  // Space would otherwise scroll the list away from the row being activated.
  event.preventDefault();
  activate();
}

/**
 * Move the focus onto the selected row, but only when the list already holds
 * it: the arrow keys are listened to on the document, so pressing one while
 * reading somewhere else must not pull the focus into the list.
 * @param container - The scrolling element of the list.
 */
export function followSelectionWithFocus(container: HTMLElement | null): void {
  if (!container?.contains(document.activeElement)) return;
  const row = container.querySelector('[data-selected="true"]');
  if (row instanceof HTMLElement) row.focus({ preventScroll: true });
}
