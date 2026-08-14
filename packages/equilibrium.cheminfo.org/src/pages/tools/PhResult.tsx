import { Callout } from '@blueprintjs/core';
import type { Solution } from 'chem-equilibrium';

import {
  concentrationOf,
  formatConcentration,
} from '../../chemistry/format.ts';
import {
  isStrongAcid,
  strongAcidPh,
  weakAcidPh,
} from '../../chemistry/simplifiedPh.ts';
import { Species } from '../../components/Species.tsx';

interface PhHeadlineProps {
  /** Label of the acid the solution was made with. */
  acid: string;
  /** Analytical concentration, in mol/L. */
  concentration: number;
  solution: Solution | null;
  /** pH of that solution, `undefined` when the solve failed. */
  ph: number | undefined;
}

/**
 * The exact pH, as the headline of the result panel.
 * @param props - The solution and its pH.
 * @returns The headline.
 */
export function PhHeadline(props: PhHeadlineProps) {
  const { acid, concentration, solution, ph } = props;

  return (
    <div>
      <h3 style={{ margin: '0 0 2px' }}>Calculation results</h3>
      <p className="bp6-text-muted" style={{ margin: 0 }}>
        pH of a {formatConcentration(concentration)} mol/L solution of{' '}
        <Species label={acid} />
      </p>
      <div style={HEADLINE_STYLE}>
        pH = {ph === undefined ? '—' : ph.toFixed(2)}
      </div>
      <p className="bp6-text-muted" style={{ margin: 0 }}>
        <Species label="H+" withName={false} /> ={' '}
        {formatConcentration(concentrationOf(solution, 'H+'))} mol/L ·{' '}
        <Species label="OH-" withName={false} /> ={' '}
        {formatConcentration(concentrationOf(solution, 'OH-'))} mol/L
      </p>
    </div>
  );
}

interface ApproximationNoteProps {
  /** pKa of the couple that was picked. */
  pK: number;
  /** Analytical concentration, in mol/L. */
  concentration: number;
  /** pH of the exact solution, `undefined` when the solve failed. */
  exact: number | undefined;
}

/**
 * The closed form of the course next to the exact result, and how far apart
 * they are.
 * @param props - The couple, the concentration and the exact pH.
 * @returns The comparison.
 */
export function ApproximationNote(props: ApproximationNoteProps) {
  const { pK, concentration, exact } = props;
  const strong = isStrongAcid(pK);
  const simplified =
    concentration > 0
      ? strong
        ? strongAcidPh(concentration)
        : weakAcidPh(pK, concentration)
      : undefined;
  const gap =
    exact === undefined || simplified === undefined
      ? undefined
      : Math.abs(exact - simplified);

  return (
    <div>
      <h3 style={{ margin: '0 0 8px' }}>Why not pH = ½ (pKa − log C)?</h3>
      <p style={{ marginTop: 0, marginBottom: 4 }}>
        The course treats this couple as {strong ? 'a strong' : 'a weak'} acid,
        so its closed form is
      </p>
      <div className="formula" style={{ marginTop: 0, background: '#f6f7f9' }}>
        {strong ? 'pH = −log C' : 'pH = ½ (pKa − log C)'}
      </div>

      <table className="data-table bp6-html-table bp6-compact">
        <tbody>
          <tr>
            <td>Exact, every equilibrium solved together</td>
            <td className="numeric">
              {exact === undefined ? '—' : exact.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>Simplified closed form</td>
            <td className="numeric">
              {simplified === undefined ? '—' : simplified.toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>Difference</td>
            <td className="numeric">
              {gap === undefined ? '—' : gap.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      <Callout
        intent={intentOf(gap)}
        compact
        style={{ marginTop: 8 }}
        icon={null}
      >
        {gap !== undefined && gap < 0.05
          ? 'The approximation holds here. '
          : 'The approximation is off here. '}
        It assumes the acid is barely dissociated and that water releases no
        proton of its own, so it drifts in dilute solutions, for very weak
        acids, and whenever a second acidity of a polyprotic acid contributes.
      </Callout>
    </div>
  );
}

const HEADLINE_STYLE = {
  margin: '6px 0',
  fontSize: 40,
  fontWeight: 700,
  lineHeight: 1.15,
  color: '#c22762',
} as const;

function intentOf(gap: number | undefined) {
  if (gap === undefined) return 'none' as const;
  if (gap < 0.05) return 'success' as const;
  if (gap < 0.3) return 'warning' as const;
  return 'danger' as const;
}
