/**
 * Hash-based location: `#/titration?analyte=CO3--&concentration=0.1`.
 *
 * Everything a tool needs to be reproduced lives in the query part, so any
 * configuration a teacher reaches can be shared as a plain link.
 */
export interface HashLocation {
  path: string;
  query: Record<string, string>;
}

/**
 * Read the current location out of `window.location.hash`.
 * @returns The path and the decoded query parameters.
 */
export function readLocation(): HashLocation {
  return parseHash(globalThis.location?.hash ?? '');
}

/**
 * Parse a hash string, tolerating every shape a user may paste.
 * @param hash - The raw hash, with or without its leading `#`.
 * @returns The path and the decoded query parameters.
 */
export function parseHash(hash: string): HashLocation {
  const withoutHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const [rawPath, rawQuery] = splitOnce(withoutHash, '?');
  const path = normalizePath(rawPath);
  const query: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(rawQuery)) {
    query[key] = value;
  }
  return { path, query };
}

/**
 * Build the hash of a location, leaving out empty parameters.
 * @param path - Path of the page.
 * @param query - Parameters to carry, `undefined` entries are dropped.
 * @returns A hash string starting with `#`.
 */
export function buildHash(
  path: string,
  query: Record<string, string | undefined> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.append(key, value);
  }
  const search = params.toString();
  return `#${normalizePath(path)}${search ? `?${search}` : ''}`;
}

/**
 * Go to another location, adding a history entry.
 * @param path - Path of the page.
 * @param query - Parameters to carry.
 */
export function navigate(
  path: string,
  query: Record<string, string | undefined> = {},
): void {
  globalThis.location.hash = buildHash(path, query);
}

/**
 * Fired after {@link replaceQuery}, because `history.replaceState` does not
 * emit `hashchange` and the subscribers would otherwise never hear about it.
 */
export const LOCATION_EVENT = 'equilibrium:locationchange';

/**
 * Update the query of the current page without adding a history entry, so
 * dragging a slider does not fill the back button with hundreds of steps.
 * @param path - Path of the page.
 * @param query - Parameters to carry.
 */
export function replaceQuery(
  path: string,
  query: Record<string, string | undefined> = {},
): void {
  const hash = buildHash(path, query);
  if (hash === globalThis.location.hash) return;
  globalThis.history.replaceState(
    null,
    '',
    `${globalThis.location.pathname}${globalThis.location.search}${hash}`,
  );
  globalThis.dispatchEvent(new Event(LOCATION_EVENT));
}

function normalizePath(path: string): string {
  if (path === '' || path === '/') return '/';
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
}

function splitOnce(value: string, separator: string): [string, string] {
  const index = value.indexOf(separator);
  if (index === -1) return [value, ''];
  return [value.slice(0, index), value.slice(index + 1)];
}
