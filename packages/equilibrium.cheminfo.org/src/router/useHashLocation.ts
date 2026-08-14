import { useSyncExternalStore } from 'react';

import type { HashLocation } from './location.ts';
import { LOCATION_EVENT, readLocation } from './location.ts';

/**
 * Subscribe to the hash location.
 * @returns The current path and query, updated on every navigation.
 */
export function useHashLocation(): HashLocation {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

let snapshot: HashLocation = readLocation();
let snapshotHash: string | null = null;

function subscribe(onChange: () => void): () => void {
  globalThis.addEventListener('hashchange', onChange);
  globalThis.addEventListener(LOCATION_EVENT, onChange);
  return () => {
    globalThis.removeEventListener('hashchange', onChange);
    globalThis.removeEventListener(LOCATION_EVENT, onChange);
  };
}

/**
 * `useSyncExternalStore` compares snapshots by identity, so the parsed location
 * is cached until the hash string itself changes.
 * @returns The current location.
 */
function getSnapshot(): HashLocation {
  const hash = globalThis.location.hash;
  if (hash !== snapshotHash) {
    snapshotHash = hash;
    snapshot = readLocation();
  }
  return snapshot;
}

function getServerSnapshot(): HashLocation {
  return { path: '/', query: {} };
}
