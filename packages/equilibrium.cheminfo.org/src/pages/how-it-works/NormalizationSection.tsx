import { Callout } from '@blueprintjs/core';
import type { EquationJSON } from 'chem-equilibrium';
import { useMemo } from 'react';

import { buildHelper } from '../../chemistry/solve.ts';
import { EquationTable } from '../../components/EquationTable.tsx';
import { Species } from '../../components/Species.tsx';

import { Formula, Inline, Sub, Sup } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { SourceLink } from './SourceLink.tsx';

/**
 * How a chain of equilibria is flattened onto a basis of terminal components.
 * @returns The section.
 */
export function NormalizationSection() {
  const ammonia = useMemo(() => rewrite('NH4+'), []);
  const copper = useMemo(() => rewrite('Cu++'), []);

  return (
    <HowSection
      id="normalization"
      source={
        <>
          <SourceLink file="core/EquationSet.ts" /> for the substitution, and{' '}
          <SourceLink file="core/Equation.ts" /> for the solvent.
        </>
      }
      tools={[
        {
          path: '/equilibrium',
          hint: 'Compare raw and normalized equilibria side by side',
        },
      ]}
    >
      <div className="prose">
        <p>
          The database is written the way a chemist writes: ammonium from
          ammonia, ammonia from amide, carbonic acid from bicarbonate. That is
          convenient to read and useless to solve, because{' '}
          <Species label="NH3" /> appears both as a formed species and as a
          component of another equilibrium — so it would be both an unknown and
          not an unknown.
        </p>
        <p>
          Normalization removes every such intermediate. An equilibrium whose
          component is itself formed elsewhere is substituted until only{' '}
          <strong>terminal</strong> components are left. Two things happen at
          once:
        </p>
        <ul>
          <li>the stoichiometric coefficients are multiplied;</li>
          <li>
            the log-constants are <strong>added</strong>, weighted by the
            multiplier.
          </li>
        </ul>
      </div>

      <Formula
        caption={
          <>
            ν<Sub>k</Sub> is how many units of the substituted species the
            equilibrium consumed. Multiplying constants is adding logarithms,
            which is exactly why the database stores pK rather than β.
          </>
        }
      >
        pK(overall) = pK(self) + ∑<Sub>k</Sub> ν<Sub>k</Sub> · pK(substituted
        reaction)
      </Formula>

      <h3>Worked example: ammonium</h3>
      <div className="prose">
        <p>
          <Species label="NH4+" /> is stored as a formation from{' '}
          <Species label="NH3" /> with pK 9.25 — its familiar pKa. But{' '}
          <Species label="NH3" /> is itself formed from <Species label="NH2-" />{' '}
          with pK 23. Substituting one into the other gives 9.25 + 1 × 23 ={' '}
          <strong>32.25</strong>, and the proton coefficient goes from 1 to 2:
        </p>
      </div>

      <EquationTable
        equations={ammonia.raw}
        normalized={ammonia.normalized}
        withType
      />

      <Callout intent="primary" icon="info-sign" style={{ margin: '12px 0' }}>
        This is why the basis of an ammonia system on this site is{' '}
        <Species label="NH2-" />, a species no one would ever weigh out. It is
        not a chemical claim — the amide is at 10⁻²³ mol/L — only the algebraic
        end of the chain.
      </Callout>

      <h3>Worked example: the solvent, and copper hydroxide</h3>
      <div className="prose">
        <p>
          Water is a special case, and it is handled before anything else. The
          row <Species label="H2O" /> formed from <Species label="OH-" /> and{' '}
          <Species label="H+" /> with pK 14 is <em>inverted</em>: the first
          component is promoted to the formed species, the others change sign,
          and the constant changes sign with them.
        </p>
      </div>

      <Formula
        caption={
          <>
            The solvent has unit activity, so it leaves the model entirely — and
            hydroxide enters it as a formed species with a negative coefficient
            and β = 10<Sup>−14</Sup> = K<Sub>w</Sub>.
          </>
        }
      >
        <Species label="H2O" withName={false} /> ⇄{' '}
        <Species label="OH-" withName={false} /> +{' '}
        <Species label="H+" withName={false} /> (pK 14) becomes{' '}
        <Species label="OH-" withName={false} /> ⇄ −{' '}
        <Species label="H+" withName={false} /> (pK −14)
      </Formula>

      <div className="prose">
        <p>
          Now put the two mechanisms together. Copper hydroxide is tabulated as
          a formation from <Species label="Cu++" /> and two{' '}
          <Species label="OH-" /> with pK 18.8. Substituting the rewritten water
          equilibrium twice gives 18.8 + 2 × (−14) = <strong>−9.20</strong>, and
          the two positive hydroxides turn into two negative protons:
        </p>
      </div>

      <EquationTable
        equations={copper.raw}
        normalized={copper.normalized}
        withType
      />

      <div className="prose">
        <p>
          One practical consequence, visible in the Ignore checkboxes of the
          tools: the equilibria are keyed by the species they{' '}
          <em>originally</em> formed. Switching off hydroxide means switching
          off <Species label="H2O" />, not <Species label="OH-" /> — the
          hydroxide row no longer exists under its own name once the solvent has
          been eliminated.
        </p>
        <p>
          Substitution is repeated until nothing is left to resolve. If two
          equilibria define each other in a circle, no basis exists and the
          library refuses to build the model with{' '}
          <Inline>There may be a circular dependency in the equations</Inline>.
        </p>
      </div>
    </HowSection>
  );
}

/**
 * The raw and normalized forms of the equilibria a species pulls in.
 * @param seed - Species to put in the flask.
 * @returns Both lists, aligned index by index.
 */
function rewrite(seed: string): {
  raw: EquationJSON[];
  normalized: EquationJSON[];
} {
  try {
    const helper = buildHelper([{ label: seed, quantity: 0.1 }]);
    return {
      raw: helper.getEquations({ filtered: true }),
      normalized: helper.getEquations({ filtered: true, normalized: true }),
    };
  } catch {
    return { raw: [], normalized: [] };
  }
}
