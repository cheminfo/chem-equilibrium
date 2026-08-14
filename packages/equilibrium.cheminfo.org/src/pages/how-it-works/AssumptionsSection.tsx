import { Callout } from '@blueprintjs/core';

import { Species } from '../../components/Species.tsx';

import { HowSection } from './HowSection.tsx';

/**
 * What the model leaves out, which is what decides whether a number off this
 * site can be trusted.
 * @returns The section.
 */
export function AssumptionsSection() {
  return (
    <HowSection
      id="assumptions"
      tools={[
        {
          path: '/data',
          hint: 'See which constants document a temperature and a source',
        },
      ]}
    >
      <p>
        Everything above is exact: given the constants, the solver finds the
        root of the mass-balance system to fifteen digits. That precision says
        nothing about accuracy. Four approximations sit between this model and a
        real beaker, and the first one is by far the largest.
      </p>

      <h3>1. Concentrations stand in for activities</h3>
      <p>
        The law of mass action is written on <em>activities</em>, and this model
        uses concentrations instead — that is, it assumes an activity
        coefficient of one for every species. That assumption is good in a
        dilute solution and progressively worse as the ionic strength rises. At
        an ionic strength around 0.1 M the coefficients of singly charged ions
        are already near 0.8, and of doubly charged ions near 0.4; the error
        enters squared or cubed into a solubility product.
      </p>
      <Callout intent="warning" icon="warning-sign" compact>
        So a diagram drawn at 1 mol/L is qualitatively right and quantitatively
        approximate. Below roughly 10<sup>−3</sup> mol/L the difference is
        usually smaller than the spread between literature values of the
        constants themselves. There is no Debye-Hückel correction anywhere in
        this code, and no ionic strength is ever computed.
      </Callout>

      <h3>2. Solids are pure phases that appear the instant they can</h3>
      <p>
        A precipitate is treated as a pure solid of unit activity, so its
        solubility product is a constant. Nothing here knows about
        supersaturation, nucleation, crystal size, ageing, or solid solutions —
        all of which delay or shift a real precipitation. The diagram shows
        where a solid <em>may</em> form at equilibrium, not when it will be seen
        in a beaker.
      </p>

      <h3>3. The constants are a mixed bag</h3>
      <p>
        They were collected from more than one compilation, and the table does
        not record the ionic strength any of them was measured at. Most carry
        298 K, many carry nothing, and a third of them name no source at all.
        Mixing constants measured under different conditions in one system is an
        approximation in itself — an honest one only because the data page shows
        you exactly which entry is which.
      </p>

      <h3>4. The solvent is inert and its activity is one</h3>
      <p>
        Water is eliminated from every equation, which is what lets{' '}
        <Species label="H2O" /> ⇄ <Species label="OH-" /> +{' '}
        <Species label="H+" /> become the definition of hydroxide. That is exact
        in dilute aqueous solution and drifts in a concentrated one, for the
        same reason as the first point.
      </p>

      <h3>
        What is <em>not</em> an approximation
      </h3>
      <p>
        The corner a curve takes when a solid appears is real. It is the phase
        boundary: below it the solid is absent, above it the solubility product
        pins the free ions, and the slope of everything containing them changes
        there. The solver places it where the ion product reaches the solubility
        product, to the last digit — the only imprecision is that a sweep can
        bracket that point no more finely than one step, so adding points moves
        the drawn corner onto its true position.
      </p>
    </HowSection>
  );
}
