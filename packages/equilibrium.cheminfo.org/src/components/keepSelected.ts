/** A filtered list that still holds what the user picked. */
export interface FilteredEntries<T> {
  /** What the list shows: the picked entries a query hides come first. */
  entries: T[];
  /** How many entries the query itself matched. */
  matchCount: number;
}

/**
 * Filter a list without ever dropping the current selection.
 *
 * A search that hides what is already picked leaves the user unable to see, or
 * to undo, their own choice; the picked entries are therefore always shown,
 * above whatever the query matched.
 * @param entries - Every entry, in the order the list shows them.
 * @param matches - Whether an entry matches the query.
 * @param isSelected - Whether an entry is currently picked.
 * @returns The entries to render, and the number of real matches.
 */
export function filterKeepingSelected<T>(
  entries: readonly T[],
  matches: (entry: T) => boolean,
  isSelected: (entry: T) => boolean,
): FilteredEntries<T> {
  const matched: T[] = [];
  const picked: T[] = [];
  for (const entry of entries) {
    if (matches(entry)) {
      matched.push(entry);
    } else if (isSelected(entry)) {
      picked.push(entry);
    }
  }
  return { entries: [...picked, ...matched], matchCount: matched.length };
}
