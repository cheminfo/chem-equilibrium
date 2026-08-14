import { Callout } from '@blueprintjs/core';

import { Species } from '../../components/Species.tsx';

import { HowSection } from './HowSection.tsx';
import { SourceLink } from './SourceLink.tsx';
import { TableauTable } from './TableauTable.tsx';

const SEEDS = [
  { label: 'Ag+', quantity: 0.01 },
  { label: 'NH3', quantity: 0.1 },
  { label: 'Cl-', quantity: 0.01 },
];

/**
 * Why the unknowns are only the free components.
 * @returns The section.
 */
export function IdeaSection() {
  return (
    <HowSection
      id="idea"
      source={
        <>
          <SourceLink file="core/EquationSet.ts" /> builds the tableau,{' '}
          <SourceLink file="core/Equilibrium.ts" /> turns it into matrices.
        </>
      }
      tools={[
        { path: '/equilibrium', hint: 'Build a system and read its tableau' },
      ]}
    >
      <div className="prose">
        <p>
          Put silver, ammonia and chloride in the same flask and you have not
          made three chemicals: you have made a dozen. Silver is partly free,
          partly bound to two ammonias, partly bound to two chlorides, partly
          sitting at the bottom of the beaker as silver chloride. Ammonia is
          partly protonated. Water is partly dissociated. Writing one unknown
          per species and one equation per equilibrium works, but it is a large
          and badly conditioned problem.
        </p>
        <p>
          The trick this solver is built on — it comes from Morel and
          Morgan&rsquo;s tableau method, the same one behind MINEQL and PHREEQC
          — is that almost none of those species is really unknown. Choose a
          small, chemically independent set of <strong>components</strong>, and
          every other species is an explicit function of them. Nothing has to be
          searched for: it is one multiplication.
        </p>
        <p>
          A species that is written from the components is called a{' '}
          <strong>formed species</strong>. It never enters the search. Only the
          free concentrations of the components do.
        </p>
      </div>

      <Callout intent="primary" icon="lightbulb" style={{ margin: '12px 0' }}>
        Twelve concentrations to report, four numbers to look for. The other
        eight are recomputed from those four every time they are needed.
      </Callout>

      <p className="prose">
        Here is the real system for 0.01 mol/L of <Species label="Ag+" />, 0.1
        mol/L of <Species label="NH3" /> and 0.01 mol/L of{' '}
        <Species label="Cl-" />, exactly as the library assembles it from the
        bundled database. The first four rows are the components; each is its
        own species, with a coefficient of one on itself and a constant of one.
        Everything below them is computed.
      </p>

      <TableauTable seeds={SEEDS} />

      <div className="prose">
        <p>
          Notice what you never asked for. You never mentioned{' '}
          <Species label="Ag(NH3)2+" />, or <Species label="AgCl2-" />, or{' '}
          <Species label="AgOH" />; the library walked the database and pulled
          in every equilibrium reachable from what you did declare. You never
          mentioned <Species label="NH2-" /> either, and yet it is a component:
          normalization picked the basis, not you. Section 5 explains how.
        </p>
        <p>
          The rest of this page is what happens next: how a formed species is
          computed from the components (2 and 3), what the four equations
          actually are (4), how the basis was chosen (5), what changes when you
          impose one of the components (6), how the four numbers are found (7),
          and why the two solid rows are the hard part (8).
        </p>
      </div>
    </HowSection>
  );
}
