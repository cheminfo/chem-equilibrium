import { Callout, Card, H5, Switch } from '@blueprintjs/core';
import { useMemo, useState } from 'react';

import { buildHelper, runSpeciation, toSeries } from '../chemistry/solve.ts';
import { useToolState } from '../router/useToolState.ts';

import { EquationTable } from './EquationTable.tsx';
import type { ChartSeries } from './EquilibriumChart.tsx';
import { EquilibriumChart } from './EquilibriumChart.tsx';
import { SpeciationReadout } from './SpeciationReadout.tsx';
import type { SelectedSpecies } from './SpeciesPicker.tsx';
import { SpeciesPicker } from './SpeciesPicker.tsx';
import { SweepControls } from './SweepControls.tsx';
import { ToolHeader } from './ToolHeader.tsx';
import type { WorkbenchPreset } from './workbenchPreset.ts';
import { createWorkbenchCodec, sweepAxisLabel } from './workbenchPreset.ts';

interface SpeciationWorkbenchProps {
  /** What the tool sweeps, which species it offers, and how it explains itself. */
  preset: WorkbenchPreset;
}

/**
 * The machine behind the three sweep tools: solve the system at every value of
 * one component, and plot every species against it.
 *
 * The whole configuration lives in the URL, so any diagram reached here can be
 * handed to a class as a link.
 * @param props - The preset that configures the tool.
 * @returns The workbench.
 */
export function SpeciationWorkbench(props: SpeciationWorkbenchProps) {
  const { preset } = props;
  const codec = useMemo(() => createWorkbenchCodec(preset), [preset]);
  const [state, update] = useToolState(preset.path, preset.defaults, codec);
  const [hovered, setHovered] = useState<number | null>(null);

  const components = useMemo(
    () => componentsOf(state.species, state.disabled),
    [state.species, state.disabled],
  );
  const varying =
    preset.exposeSweep && !components.includes(state.varying)
      ? (components[0] ?? state.varying)
      : state.varying;

  const result = useMemo(
    () =>
      runSpeciation(state.species, state.disabled, {
        varying,
        isFixed: state.isFixed,
        log: state.log,
        from: state.from,
        to: state.to,
        tolerance: state.tolerance,
        solidTolerance: state.solidTolerance,
        maxIterations: state.maxIterations,
        chunks: state.chunks,
      }),
    [state, varying],
  );

  const solids = useMemo(() => {
    const labels = new Set<string>();
    if (!preset.markSolids) return labels;
    for (const equation of result.equations) {
      if (equation.type === 'precipitation') labels.add(equation.formed);
    }
    return labels;
  }, [result, preset.markSolids]);

  const series = useMemo<ChartSeries[]>(() => {
    const raw = toSeries(result);
    if (solids.size === 0) return raw;
    return raw.map((entry) =>
      solids.has(entry.label)
        ? { ...entry, label: `${entry.label} (s)` }
        : entry,
    );
  }, [result, solids]);

  const pointCount = result.x.length + result.errorCount;
  const middle =
    result.solutions.length > 0
      ? Math.floor(result.solutions.length / 2)
      : Number.NaN;
  const isFallback =
    hovered === null || hovered < 0 || hovered >= result.solutions.length;
  const index = isFallback ? middle : hovered;
  const xLabel = sweepAxisLabel(varying, state.isFixed, state.log);

  function toggleDisabled(formed: string): void {
    update({
      disabled: state.disabled.includes(formed)
        ? state.disabled.filter((label) => label !== formed)
        : [...state.disabled, formed],
    });
  }

  return (
    <div>
      <ToolHeader
        title={preset.title}
        errorCount={result.errorCount}
        pointCount={pointCount}
      >
        {preset.description}
      </ToolHeader>

      {result.error ? (
        <Callout intent="danger" icon="error" style={{ marginBottom: 12 }}>
          This sweep could not be computed: {result.error}. Try another range,
          another swept component, or looser tolerances.
        </Callout>
      ) : null}

      <div className="tool-layout">
        <div className="panel-stack">
          <Card>
            <H5>Solution</H5>
            <SpeciesPicker
              available={preset.available}
              selected={state.species}
              onChange={(species) => update({ species })}
            />
          </Card>
          <Card>
            <H5>Sweep</H5>
            <SweepControls
              state={state}
              onChange={update}
              components={components}
              varying={varying}
              exposeSweep={preset.exposeSweep}
              note={preset.note}
            />
          </Card>
        </div>

        <div className="panel-stack">
          <Card>
            <Switch
              checked={state.logY}
              label="Logarithmic ordinate — without it every minor species is crushed onto the axis"
              onChange={(event) =>
                update({ logY: event.currentTarget.checked })
              }
            />
            {series.length === 0 ? (
              <p className="bp6-text-muted">
                {state.species.length === 0
                  ? (preset.emptyMessage ??
                    'Add a species to the solution to draw a diagram.')
                  : 'Not one point of this sweep could be solved, so there is nothing to draw.'}
              </p>
            ) : (
              <div className="chart-container">
                <EquilibriumChart
                  x={result.x}
                  series={series}
                  xLabel={xLabel}
                  yLabel={
                    solids.size > 0
                      ? 'Amount at equilibrium (mol/L, solids in mol)'
                      : 'Concentration at equilibrium (mol/L)'
                  }
                  logY={state.logY}
                  onHover={setHovered}
                />
              </div>
            )}
          </Card>

          <Card>
            <H5>At one point of the sweep</H5>
            <SpeciationReadout
              solution={result.solutions[index]}
              species={result.species}
              solids={solids}
              value={result.x[index]}
              valueLabel={xLabel}
              isFallback={isFallback}
            />
          </Card>

          <Card>
            <H5>Equilibria pulled into the system</H5>
            <p className="bp6-text-muted" style={{ marginTop: 0 }}>
              Ticking <em>Ignore</em> drops that equilibrium from the model,
              which is how you find out what it actually contributes.
            </p>
            <EquationTable
              equations={result.equations}
              normalized={preset.normalized ? result.normalized : undefined}
              withType={preset.withType}
              disabled={state.disabled}
              onToggleDisabled={toggleDisabled}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * The independent components of the current system, which are the quantities a
 * sweep can vary.
 * @param species - What the user put in the solution.
 * @param disabled - Equilibria that are switched off.
 * @returns The component labels, empty when the system cannot be built.
 */
function componentsOf(
  species: SelectedSpecies[],
  disabled: string[],
): string[] {
  if (species.length === 0) return [];
  try {
    return buildHelper(species, disabled).getComponents({ filtered: true });
  } catch {
    return [];
  }
}
