import type { Solution } from 'chem-equilibrium';

import { formatMillilitres } from '../../../chemistry/format.ts';
import type { Indicator } from '../../../chemistry/indicators.ts';
import { colorAt } from '../../../chemistry/indicators.ts';
import { ColorSwatch } from '../../../components/IndicatorBar.tsx';
import { SpeciesReadout } from '../../../components/SpeciesReadout.tsx';

interface TitrationReadoutProps {
  /** Point under the cursor, or `null` when the cursor is off the curve. */
  index: number | null;
  /** Volume of titrant added at each point, in mL. */
  volumes: number[];
  /** pH at each point. */
  ph: number[];
  /** Volume of analyte in the flask, in mL. */
  analyteVolume: number;
  solutions: Solution[];
  species: string[];
  /** The chosen indicator, or `null` when none is. */
  indicator: Indicator | null;
}

/**
 * Everything that is true at the point under the cursor.
 *
 * The full speciation is shown next to the pH because the pH alone hides what
 * the titration is doing: at the buffer plateau the two forms of the couple are
 * both present, and that is only visible in the concentrations.
 * @param props - The curve and which point of it to read.
 * @returns The readout.
 */
export function TitrationReadout(props: TitrationReadoutProps) {
  const { index, volumes, ph, analyteVolume, solutions, species, indicator } =
    props;

  const added = index === null ? undefined : volumes[index];
  const value = index === null ? undefined : ph[index];
  const solution = index === null ? undefined : solutions[index];

  return (
    <div className="panel-stack">
      <table className="data-table bp6-html-table bp6-compact">
        <tbody>
          <tr>
            <td>Volume added</td>
            <td className="numeric">{millilitres(added)}</td>
          </tr>
          <tr>
            <td>Total volume</td>
            <td className="numeric">
              {millilitres(
                added === undefined ? undefined : added + analyteVolume,
              )}
            </td>
          </tr>
          <tr>
            <td>pH</td>
            <td className="numeric" style={{ fontSize: 18 }}>
              {value === undefined || !Number.isFinite(value)
                ? '—'
                : value.toFixed(2)}
            </td>
          </tr>
          {indicator ? (
            <tr>
              <td>Indicator colour</td>
              <td className="numeric">
                {value === undefined || !Number.isFinite(value) ? (
                  '—'
                ) : (
                  <ColorSwatch
                    color={colorAt(indicator, value)}
                    label={`${indicator.name} at pH ${value.toFixed(2)}`}
                    size={22}
                  />
                )}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <SpeciesReadout
        solution={solution}
        species={species}
        emptyMessage="Hover the curve to read the whole speciation at that point."
      />
    </div>
  );
}

function millilitres(value: number | undefined): string {
  return formatMillilitres(value === undefined ? undefined : value / 1000);
}
