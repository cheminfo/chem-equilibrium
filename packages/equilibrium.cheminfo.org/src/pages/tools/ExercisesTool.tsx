import { useMemo } from 'react';

import {
  MAX_SERIES_LENGTH,
  generateSeries,
} from '../../chemistry/randomSeries.ts';
import { ToolHeader } from '../../components/ToolHeader.tsx';
import type { ToolStateCodec } from '../../router/useToolState.ts';
import {
  ifChanged,
  numberParam,
  useToolState,
} from '../../router/useToolState.ts';

import { ExerciseWorkspace } from './exercises/ExerciseWorkspace.tsx';
import { solveSeries } from './exercises/computation.ts';

/** Everything that makes one exercise set, all of it carried by the URL. */
interface ExercisesState {
  /** Seed the series is generated from. */
  seed: number;
  /** How many questions the series holds. */
  count: number;
  /** 1-based number of the question being worked on. */
  open: number;
}

const DEFAULTS: ExercisesState = { seed: 1, count: 20, open: 1 };

const CODEC: ToolStateCodec<ExercisesState> = {
  encode: (state) => ({
    seed: ifChanged(state.seed, DEFAULTS.seed),
    n: ifChanged(state.count, DEFAULTS.count),
    q: ifChanged(state.open, DEFAULTS.open),
  }),
  decode: (query, defaults) => {
    const count = clamp(
      numberParam(query.n, defaults.count),
      1,
      MAX_SERIES_LENGTH,
    );
    return {
      seed: clamp(numberParam(query.seed, defaults.seed), 0, 999_999_999),
      count,
      open: clamp(numberParam(query.q, defaults.open), 1, count),
    };
  },
};

/**
 * A drill on the two simplified pH formulas, generated from a shareable seed.
 *
 * The whole set — which questions, how many, which one is open — is in the URL,
 * so a teacher hands out one link and every student gets the same series. The
 * answers themselves stay in the browser.
 * @returns The exercises page.
 */
export function ExercisesTool() {
  const [state, update] = useToolState('/exercises', DEFAULTS, CODEC);
  const series = useMemo(
    () => generateSeries(state.seed, state.count),
    [state.seed, state.count],
  );
  const solved = useMemo(() => solveSeries(series), [series]);

  return (
    <div className="panel-stack">
      <ToolHeader title="pH of strong and weak acids">
        <p>
          Each question gives you an acid, the equilibrium it takes part in, its
          pK<sub>a</sub>, and a concentration. Decide whether the acid is strong
          or weak, apply the matching simplified formula, and type the pH — an
          answer within 0.05 pH unit counts as right. Once you have answered,
          the exact multi-equilibrium value computed by the solver is shown next
          to yours.
        </p>
      </ToolHeader>

      <ExerciseWorkspace
        key={state.seed}
        seed={state.seed}
        count={state.count}
        openIndex={state.open}
        solved={solved}
        onSeedChange={(seed) => update({ seed, open: 1 })}
        onCountChange={(count) =>
          update({ count, open: Math.min(state.open, count) })
        }
        onOpen={(open) => update({ open })}
      />
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}
