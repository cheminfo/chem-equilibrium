import type { ToolStateCodec } from '../../../router/useToolState.ts';
import { ifChanged, numberParam } from '../../../router/useToolState.ts';

/** Everything the titration tool needs to reproduce a curve, all of it in the URL. */
export interface TitrationState {
  /** Acid or base being titrated. */
  analyte: string;
  /** Concentration of the analyte, in mol/L. */
  analyteConcentration: number;
  /** Volume of analyte in the flask, in mL. */
  analyteVolume: number;
  /** Acid or base added from the burette. */
  titrant: string;
  /** Concentration of the titrant, in mol/L. */
  titrantConcentration: number;
  /** Volume of titrant the sweep ends at, in mL. */
  titrantVolume: number;
  /** How many points the curve is computed at. */
  points: number;
  /** Name of the colour indicator, empty for none. */
  indicator: string;
}

/** The defaults of the original teaching view. */
export const DEFAULT_TITRATION: TitrationState = {
  analyte: 'CO3--',
  analyteConcentration: 0.1,
  analyteVolume: 20,
  titrant: 'HCl',
  titrantConcentration: 0.1,
  titrantVolume: 50,
  points: 200,
  indicator: '',
};

/** Short parameter names, so a shared link stays readable. */
export const TITRATION_CODEC: ToolStateCodec<TitrationState> = {
  encode: (state) => ({
    a: ifChanged(state.analyte, DEFAULT_TITRATION.analyte),
    ac: ifChanged(
      state.analyteConcentration,
      DEFAULT_TITRATION.analyteConcentration,
    ),
    av: ifChanged(state.analyteVolume, DEFAULT_TITRATION.analyteVolume),
    t: ifChanged(state.titrant, DEFAULT_TITRATION.titrant),
    tc: ifChanged(
      state.titrantConcentration,
      DEFAULT_TITRATION.titrantConcentration,
    ),
    tv: ifChanged(state.titrantVolume, DEFAULT_TITRATION.titrantVolume),
    n: ifChanged(state.points, DEFAULT_TITRATION.points),
    ind: ifChanged(state.indicator, DEFAULT_TITRATION.indicator),
  }),
  decode: (query, defaults) => ({
    analyte: query.a ?? defaults.analyte,
    analyteConcentration: numberParam(query.ac, defaults.analyteConcentration),
    analyteVolume: numberParam(query.av, defaults.analyteVolume),
    titrant: query.t ?? defaults.titrant,
    titrantConcentration: numberParam(query.tc, defaults.titrantConcentration),
    titrantVolume: numberParam(query.tv, defaults.titrantVolume),
    points: numberParam(query.n, defaults.points),
    indicator: query.ind ?? defaults.indicator,
  }),
};

/**
 * Keep the sweep to a size that stays instant and cannot divide by zero.
 * @param points - What the user asked for.
 * @returns A usable number of points.
 */
export function clampPoints(points: number): number {
  if (!Number.isFinite(points)) return DEFAULT_TITRATION.points;
  return Math.min(Math.max(Math.round(points), 10), 2000);
}
