import type { EquationType } from 'chem-equilibrium';

import type { ToolStateCodec } from '../../router/useToolState.ts';
import {
  booleanParam,
  flagParam,
  ifChanged,
} from '../../router/useToolState.ts';

import { EQUATION_TYPES } from './dataset.ts';

/** Which of the two tables is on screen. */
export type DataTab = 'equilibria' | 'species';

/** How the equilibria table is ordered. */
export type DataSort = 'table' | 'pK' | 'formed';

/** Everything the data page shows, so the URL reproduces it exactly. */
export interface DataState {
  tab: DataTab;
  /** Free text matched against formulas, names and synonyms. */
  query: string;
  /** Kinds of equilibria kept, empty meaning all of them. */
  types: EquationType[];
  sort: DataSort;
  descending: boolean;
}

/** The page as it opens: the whole table, in the order of the source file. */
export const DEFAULT_DATA_STATE: DataState = {
  tab: 'equilibria',
  query: '',
  types: [],
  sort: 'table',
  descending: false,
};

/** Maps {@link DataState} to and from the query part of the URL. */
export const DATA_CODEC: ToolStateCodec<DataState> = {
  encode: (state) => ({
    tab: ifChanged(state.tab, DEFAULT_DATA_STATE.tab),
    q: state.query || undefined,
    type: state.types.length > 0 ? state.types.join(',') : undefined,
    sort: ifChanged(state.sort, DEFAULT_DATA_STATE.sort),
    desc: flagParam(state.descending, DEFAULT_DATA_STATE.descending),
  }),
  decode: (query, defaults) => ({
    tab: query.tab === 'species' ? 'species' : defaults.tab,
    query: query.q ?? defaults.query,
    types: decodeTypes(query.type, defaults.types),
    sort: decodeSort(query.sort, defaults.sort),
    descending: booleanParam(query.desc, defaults.descending),
  }),
};

function decodeTypes(
  value: string | undefined,
  fallback: EquationType[],
): EquationType[] {
  if (value === undefined) return fallback;
  const requested = new Set(value.split(','));
  return EQUATION_TYPES.filter((type) => requested.has(type));
}

const SORTS: DataSort[] = ['table', 'pK', 'formed'];

function decodeSort(value: string | undefined, fallback: DataSort): DataSort {
  return SORTS.find((sort) => sort === value) ?? fallback;
}
