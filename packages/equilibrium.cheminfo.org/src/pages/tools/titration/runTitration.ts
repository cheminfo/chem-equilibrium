import type { TitrationResult } from 'chem-equilibrium';
import { Helper, Serie } from 'chem-equilibrium';

import { ACID_BASE_SPECIES } from '../../../chemistry/species.ts';

import type { TitrationState } from './state.ts';
import { clampPoints } from './state.ts';

/** A computed curve, with the volumes already converted to millilitres. */
export interface TitrationCurve {
  result: TitrationResult | null;
  /** Volume of titrant added at each point, in mL. */
  volumes: number[];
  /** pH at each point. */
  ph: number[];
  /** Set when no curve could be computed at all. */
  error?: string;
}

/**
 * Run the titration and put its abscissa in the unit a burette is read in.
 *
 * The solver works in litres; plotting those would label the axis `0.05`,
 * which is not the number anyone writes in a lab notebook. Failures are
 * returned rather than thrown, because a link can carry any configuration and
 * the page still has to render.
 * @param state - The configuration of the tool.
 * @returns The curve, or the reason there is none.
 */
export function runTitration(state: TitrationState): TitrationCurve {
  const empty: TitrationCurve = { result: null, volumes: [], ph: [] };
  const unknown = [state.analyte, state.titrant].find(
    (label) => !ACID_BASE_SPECIES.includes(label),
  );
  if (unknown !== undefined) {
    return {
      ...empty,
      error: `${unknown} is not an acid/base of the database.`,
    };
  }
  if (!(state.analyteVolume > 0)) {
    return { ...empty, error: 'The flask must hold more than 0 mL.' };
  }
  if (!(state.titrantVolume > 0)) {
    return { ...empty, error: 'The titration must end past 0 mL.' };
  }

  try {
    const result = new Serie(new Helper()).getTitration({
      solution: {
        type: state.analyte,
        concentration: state.analyteConcentration,
        volume: state.analyteVolume / 1000,
      },
      titrationSolution: {
        type: state.titrant,
        concentration: state.titrantConcentration,
        volume: state.titrantVolume / 1000,
      },
      chunks: clampPoints(state.points),
    });

    const count = result.volumes.length;
    const volumes = new Array<number>(count);
    const ph = new Array<number>(count);
    for (let i = 0; i < count; i++) {
      volumes[i] = (result.volumes[i] ?? Number.NaN) * 1000;
      ph[i] = result.xy[2 * i + 1] ?? Number.NaN;
    }
    return { result, volumes, ph };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
