import { Button, Callout, Card } from '@blueprintjs/core';
import { useMemo, useState } from 'react';

import { assessIndicator } from '../../chemistry/indicatorFit.ts';
import { sampleBands } from '../../chemistry/indicators.ts';
import {
  equivalenceVolume,
  findJump,
  titrationTsv,
  volumeAtPh,
} from '../../chemistry/titration.ts';
import { EquationTable } from '../../components/EquationTable.tsx';
import type { ChartBand } from '../../components/EquilibriumChart.tsx';
import { EquilibriumChart } from '../../components/EquilibriumChart.tsx';
import { IndicatorPicker } from '../../components/IndicatorPicker.tsx';
import { ToolHeader } from '../../components/ToolHeader.tsx';
import { INDICATORS } from '../../data/indicators.ts';
import { useToolState } from '../../router/useToolState.ts';

import { EquivalenceMarker } from './titration/EquivalenceMarker.tsx';
import { TitrationInputs } from './titration/TitrationInputs.tsx';
import { TitrationReadout } from './titration/TitrationReadout.tsx';
import { TitrationSummary } from './titration/TitrationSummary.tsx';
import { TsvExportDialog } from './titration/TsvExportDialog.tsx';
import { runTitration } from './titration/runTitration.ts';
import {
  DEFAULT_TITRATION,
  TITRATION_CODEC,
  clampPoints,
} from './titration/state.ts';

/**
 * Titrate one acid/base solution with another, solving the whole system at
 * every point of the curve.
 * @returns The titration page.
 */
export function TitrationTool() {
  const [state, update] = useToolState(
    '/titration',
    DEFAULT_TITRATION,
    TITRATION_CODEC,
  );
  const [hovered, setHovered] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const curve = useMemo(() => runTitration(state), [state]);
  const jump = useMemo(() => findJump(curve.volumes, curve.ph), [curve]);
  const series = useMemo(() => [{ label: 'pH', y: curve.ph }], [curve.ph]);

  const indicator = useMemo(
    () => INDICATORS.find((entry) => entry.name === state.indicator) ?? null,
    [state.indicator],
  );
  const bands = useMemo(
    () => (indicator ? sampleBands(indicator, 100) : NO_BANDS),
    [indicator],
  );
  const assessment = useMemo(
    () => (indicator ? assessIndicator(indicator, jump) : null),
    [indicator, jump],
  );
  const endpoint = useMemo(() => {
    if (!assessment) return undefined;
    const { pH1, pH2 } = assessment.transition;
    return volumeAtPh(curve.volumes, curve.ph, (pH1 + pH2) / 2);
  }, [assessment, curve]);
  const tsv = useMemo(
    () => (exportOpen ? titrationTsv(curve.volumes, curve.ph) : ''),
    [exportOpen, curve],
  );

  const equivalence = equivalenceVolume(
    state.analyteConcentration,
    state.analyteVolume,
    state.titrantConcentration,
  );
  const lastVolume = curve.volumes.at(-1) ?? 0;

  return (
    <div className="panel-stack">
      <ToolHeader
        title="Acid/base titration"
        errorCount={curve.result?.errorCount}
        pointCount={clampPoints(state.points) + 1}
      >
        <p>
          Add a titrant to an acid or a base and follow the pH. Every point is a
          full multi-equilibrium solve, not the textbook piecewise
          approximation, so the buffer plateau, the dilution and the further
          equivalence points of a polyprotic system all appear on their own.
          Pick a colour indicator to flood the plot with the colour it would
          show at each pH, and see whether it turns where the curve jumps.
        </p>
      </ToolHeader>

      <div className="tool-layout">
        <div className="panel-stack">
          <Card>
            <TitrationInputs state={state} onChange={update} />
          </Card>
          <Card>
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Indicators</h3>
            <IndicatorPicker
              indicators={INDICATORS}
              selected={state.indicator}
              onSelect={(name) => update({ indicator: name })}
            />
          </Card>
        </div>

        <div className="panel-stack">
          {curve.error ? (
            <Callout intent="danger" icon="error" title="Nothing to plot">
              {curve.error}
            </Callout>
          ) : null}

          <Card>
            <div style={TITLE_ROW_STYLE}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Titration curve</h3>
              <Button
                icon="th"
                text="Export as TSV"
                variant="minimal"
                disabled={curve.volumes.length === 0}
                onClick={() => setExportOpen(true)}
              />
            </div>
            <div className="chart-container" style={{ position: 'relative' }}>
              <EquilibriumChart
                x={curve.volumes}
                series={series}
                xLabel="Volume of titrant added [mL]"
                yLabel="pH"
                yRange={[0, 14]}
                bands={bands}
                onHover={setHovered}
              />
              {equivalence !== undefined && curve.volumes.length > 0 ? (
                <EquivalenceMarker
                  value={equivalence}
                  from={curve.volumes[0] ?? 0}
                  to={lastVolume}
                  label={`equivalence ${equivalence.toPrecision(3)} mL`}
                />
              ) : null}
            </div>
            <TitrationSummary
              analyte={state.analyte}
              titrant={state.titrant}
              equivalence={equivalence}
              analyteMillimoles={
                state.analyteConcentration * state.analyteVolume
              }
              maxVolume={lastVolume}
              jump={jump}
              assessment={assessment}
              endpoint={endpoint}
            />
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>
              At the point under the cursor
            </h3>
            <TitrationReadout
              index={hovered}
              volumes={curve.volumes}
              ph={curve.ph}
              analyteVolume={state.analyteVolume}
              solutions={curve.result?.solutions ?? []}
              species={curve.result?.species ?? []}
              indicator={indicator}
            />
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>
              Equilibria the solver used
            </h3>
            <EquationTable equations={curve.result?.equations ?? []} />
          </Card>
        </div>
      </div>

      <TsvExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        text={tsv}
        pointCount={curve.volumes.length}
      />
    </div>
  );
}

/**
 * An empty band list rather than no list at all: the chart substitutes its grid
 * layer when the prop is absent, and then draws that layer twice.
 */
const NO_BANDS: ChartBand[] = [];

const TITLE_ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 8,
} as const;
