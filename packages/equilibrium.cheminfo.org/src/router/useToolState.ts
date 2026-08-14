import { useCallback, useMemo } from 'react';

import { replaceQuery } from './location.ts';
import { useHashLocation } from './useHashLocation.ts';

/** Translates a tool's state to and from URL query parameters. */
export interface ToolStateCodec<T> {
  /** Only the values that differ from the defaults need to be written. */
  encode: (state: T) => Record<string, string | undefined>;
  decode: (query: Record<string, string>, defaults: T) => T;
}

/**
 * Keep a tool's whole configuration in the URL, so it can be shared as a link.
 *
 * The URL is the single source of truth: there is no second copy of the state
 * that could drift from it, which is what makes every shared link reproduce
 * exactly what the sender was looking at. It is rewritten in place rather than
 * pushed, otherwise every keystroke would land in the browser history.
 * @param path - Path of the tool.
 * @param defaults - State used when the URL carries nothing.
 * @param codec - How that state maps to query parameters.
 * @returns The current state and a function to patch it.
 */
export function useToolState<T extends object>(
  path: string,
  defaults: T,
  codec: ToolStateCodec<T>,
): [T, (patch: Partial<T>) => void] {
  const { query } = useHashLocation();

  const state = useMemo(
    () => codec.decode(query, defaults),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults and codec are module constants
    [query],
  );

  const update = useCallback(
    (patch: Partial<T>) => {
      replaceQuery(path, codec.encode({ ...state, ...patch }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- codec is a module constant
    [path, state],
  );

  return [state, update];
}

/**
 * Read a number from the URL, falling back when it is absent or malformed.
 * @param value - Raw query parameter.
 * @param fallback - Value to use instead.
 * @returns A finite number.
 */
export function numberParam(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Read a boolean from the URL.
 * @param value - Raw query parameter.
 * @param fallback - Value to use when absent.
 * @returns Whether the flag is set.
 */
export function booleanParam(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined) return fallback;
  return value === '1' || value === 'true';
}

/**
 * Write a value only when it differs from the default, keeping URLs short.
 * @param value - Current value.
 * @param fallback - Default value.
 * @returns The serialized value, or `undefined` to leave it out.
 */
export function ifChanged<T>(value: T, fallback: T): string | undefined {
  return value === fallback ? undefined : String(value);
}

/**
 * Serialize a boolean the short way, and only when it is not the default.
 * @param value - Current value.
 * @param fallback - Default value.
 * @returns `'1'`, `'0'`, or `undefined`.
 */
export function flagParam(
  value: boolean,
  fallback: boolean,
): string | undefined {
  return value === fallback ? undefined : value ? '1' : '0';
}
