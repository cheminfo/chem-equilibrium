import type { ReactNode } from 'react';

import type { SolverSettings } from '../chemistry/solve.ts';
import {
  decodeLabels,
  decodeSpecies,
  encodeLabels,
  encodeSpecies,
} from '../chemistry/speciesParam.ts';
import type { ToolStateCodec } from '../router/useToolState.ts';
import {
  booleanParam,
  flagParam,
  ifChanged,
  numberParam,
} from '../router/useToolState.ts';

import type { SelectedSpecies } from './SpeciesPicker.tsx';

/** Everything the sweep tools hold, and therefore everything their URL carries. */
export interface WorkbenchState extends SolverSettings {
  species: SelectedSpecies[];
  /** Formed species whose equilibrium is switched off. */
  disabled: string[];
  /** Component being swept. */
  varying: string;
  /** Impose the free concentration of `varying` instead of its total. */
  isFixed: boolean;
  /** Read `from` and `to` as p-values, so the real amount is `10 ** -x`. */
  log: boolean;
  from: number;
  to: number;
  /** Use a decade scale for the ordinate. */
  logY: boolean;
}

/** What distinguishes the three tools built on the shared workbench. */
export interface WorkbenchPreset {
  /** Route of the tool, which is where its state is written. */
  path: string;
  title: string;
  /** The paragraph under the title, explaining what the diagram means. */
  description: ReactNode;
  /** Species the picker offers. */
  available: string[];
  defaults: WorkbenchState;
  /**
   * Let the user choose the swept component, its range and its scale. When it
   * is off, the sweep is hard-wired and only `note` explains it.
   * @default false
   */
  exposeSweep?: boolean;
  /** One line describing a hard-wired sweep. */
  note?: ReactNode;
  /**
   * Show the equations rewritten on the independent-component basis.
   * @default false
   */
  normalized?: boolean;
  /**
   * Tag each equilibrium with its type.
   * @default false
   */
  withType?: boolean;
  /**
   * Read the solid phases separately from the dissolved species, because a
   * solid is an amount and not a concentration.
   * @default false
   */
  markSolids?: boolean;
  /** Shown in place of the chart when nothing is selected yet. */
  emptyMessage?: string;
}

/**
 * Map a workbench state to and from the URL, writing only what differs from the
 * preset's own defaults so a shared link stays short and readable.
 * @param preset - The tool the codec belongs to.
 * @returns The codec to hand to `useToolState`.
 */
export function createWorkbenchCodec(
  preset: WorkbenchPreset,
): ToolStateCodec<WorkbenchState> {
  const encodedDefault = encodeSpecies(preset.defaults.species);

  return {
    encode(state) {
      const species = encodeSpecies(state.species);
      const common: Record<string, string | undefined> = {
        s: species === encodedDefault ? undefined : species,
        off: encodeLabels(state.disabled),
        y: flagParam(state.logY, preset.defaults.logY),
        tol: ifChanged(state.tolerance, preset.defaults.tolerance),
        stol: ifChanged(state.solidTolerance, preset.defaults.solidTolerance),
        it: ifChanged(state.maxIterations, preset.defaults.maxIterations),
        n: ifChanged(state.chunks, preset.defaults.chunks),
      };
      if (!preset.exposeSweep) return common;
      return {
        ...common,
        v: ifChanged(state.varying, preset.defaults.varying),
        fix: flagParam(state.isFixed, preset.defaults.isFixed),
        lg: flagParam(state.log, preset.defaults.log),
        from: ifChanged(state.from, preset.defaults.from),
        to: ifChanged(state.to, preset.defaults.to),
      };
    },

    decode(query, defaults) {
      const common: WorkbenchState = {
        ...defaults,
        species: decodeSpecies(query.s, defaults.species),
        disabled: decodeLabels(query.off),
        logY: booleanParam(query.y, defaults.logY),
        tolerance: numberParam(query.tol, defaults.tolerance),
        solidTolerance: numberParam(query.stol, defaults.solidTolerance),
        maxIterations: numberParam(query.it, defaults.maxIterations),
        chunks: numberParam(query.n, defaults.chunks),
      };
      if (!preset.exposeSweep) return common;
      return {
        ...common,
        varying: query.v ?? defaults.varying,
        isFixed: booleanParam(query.fix, defaults.isFixed),
        log: booleanParam(query.lg, defaults.log),
        from: numberParam(query.from, defaults.from),
        to: numberParam(query.to, defaults.to),
      };
    },
  };
}

/**
 * Name the abscissa of a sweep the way a chemist would.
 *
 * An imposed proton concentration on a decade scale is a pH and must say so;
 * every other combination is named after what it actually is.
 * @param varying - Component being swept.
 * @param isFixed - Whether its free concentration is imposed.
 * @param log - Whether the abscissa is a p-scale.
 * @returns The axis legend.
 */
export function sweepAxisLabel(
  varying: string,
  isFixed: boolean,
  log: boolean,
): string {
  if (isFixed) {
    if (!log) return `[${varying}] at equilibrium (mol/L)`;
    return varying === 'H+' ? 'pH' : `p${varying}`;
  }
  return log ? `p(total ${varying})` : `Total ${varying} (mol/L)`;
}
