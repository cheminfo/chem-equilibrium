import { Callout } from '@blueprintjs/core';
import type { EquationData } from 'chem-equilibrium';

import { EquationText } from '../../components/EquationText.tsx';
import { Species } from '../../components/Species.tsx';

import { Formula, Inline, Sub, Sup } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { SourceLink } from './SourceLink.tsx';

interface ConventionRow {
  type: string;
  equation: Pick<EquationData, 'formed' | 'components'>;
  pK: number;
  /** The name the constant carries in a textbook. */
  usually: string;
  beta: string;
  /** Why that textbook name still describes the stored number. */
  why: string;
}

const ROWS: ConventionRow[] = [
  {
    type: 'acid / base',
    equation: { formed: 'CH3CO2H', components: { 'CH3COO-': 1, 'H+': 1 } },
    pK: 4.7,
    usually: 'pKa',
    beta: '10^4.7 = 5.0119 × 10^4',
    why: 'Ka = [A⁻][H⁺]/[HA] = 1/β, so −log Ka = +log β. The two agree by construction.',
  },
  {
    type: 'precipitation',
    equation: { formed: 'AgCl', components: { 'Ag+': 1, 'Cl-': 1 } },
    pK: 9.74,
    usually: 'pKs',
    beta: '10^9.74 = 5.4954 × 10^9',
    why: 'The product of the two free ion concentrations is Ksp = 1/β = 1.8197 × 10⁻¹⁰ (literature 1.77 × 10⁻¹⁰).',
  },
  {
    type: 'complexation',
    equation: { formed: 'AgCl2-', components: { 'Ag+': 1, 'Cl-': 2 } },
    pK: 5.26,
    usually: '+log β₂',
    beta: '10^5.26 = 1.8197 × 10^5',
    why: 'Here nothing is inverted at all: the column already holds a formation constant.',
  },
];

/**
 * What `pK` means in this database, which is not what the letter suggests.
 * @returns The section.
 */
export function PkSection() {
  return (
    <HowSection
      id="pk"
      source={
        <>
          <SourceLink file="core/EquationSet.ts" /> computes{' '}
          <Inline>beta: 10 ** pK</Inline> with no sign flip;{' '}
          <SourceLink file="core/Equilibrium.ts" /> inverts the solids only.
        </>
      }
      tools={[
        { path: '/data', hint: 'Browse every constant in the database' },
        { path: '/precipitation', hint: 'Watch a solubility product at work' },
      ]}
    >
      <Callout
        intent="warning"
        icon="warning-sign"
        style={{ marginBottom: 12 }}
      >
        In this database{' '}
        <strong>pK is always log₁₀ of the formation constant</strong> of the
        species on the left from the components on the right. Never −log₁₀. The
        conversion is{' '}
        <Inline>
          β = 10<Sup>pK</Sup>
        </Inline>
        , with no sign flip, for all three kinds of equilibrium.
      </Callout>

      <div className="prose">
        <p>
          This is the single most confusing point of the whole package, and it
          is confusing precisely because the naming works out anyway. Each kind
          of equilibrium is conventionally quoted with a different constant —
          pKa, pKs, log β — and writing everything as a formation reaction makes
          those three names collapse onto the same number. Read the table row by
          row and the coincidence stops being one.
        </p>
      </div>

      <div className="scroll-x">
        <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Row as it is stored</th>
              <th className="numeric">pK</th>
              <th>Usually called</th>
              <th className="numeric">β = 10^pK</th>
              <th>Why the name still fits</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.equation.formed}>
                <td>{row.type}</td>
                <td>
                  <EquationText equation={row.equation} />
                </td>
                <td className="numeric">{row.pK}</td>
                <td>{row.usually}</td>
                <td className="numeric">{row.beta}</td>
                <td style={{ whiteSpace: 'normal', minWidth: 280 }}>
                  {row.why}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Worked example: silver chloride</h3>
      <div className="prose">
        <p>
          The database row is <Species label="AgCl" /> formed from{' '}
          <Species label="Ag+" /> and <Species label="Cl-" /> with pK 9.74. The
          model therefore carries β = 5.4954 × 10⁹, and the saturation test
          needs the dissociation constant, which is its inverse:
        </p>
      </div>

      <Formula
        caption={
          <>
            Put 0.01 mol/L of each in a litre and the solver returns 1.3490 ×
            10⁻⁵ mol/L of <Species label="Ag+" /> and 1.3489 × 10⁻⁵ mol/L of{' '}
            <Species label="Cl-" />. Their product is 1.81967 × 10⁻¹⁰ — the
            solubility product, to five digits.
          </>
        }
      >
        K<Sub>sp</Sub> = 1 / β = 10<Sup>−9.74</Sup> = 1.8197 × 10<Sup>−10</Sup>
      </Formula>

      <div className="prose">
        <p>
          Two consequences worth remembering. First, a negative pK in the tables
          on this site is perfectly normal: after normalization,{' '}
          <Species label="Cu(OH)2" /> is stored with pK −9.20 because it is
          written as a formation from <Species label="Cu++" /> that{' '}
          <em>releases</em> two protons. Second, a large positive pK is not a
          weak species but a strong one — <Species label="Ni(NH3)6++" /> reaches
          pK 146.3 once written on the <Species label="NH2-" /> basis.
        </p>
      </div>
    </HowSection>
  );
}
