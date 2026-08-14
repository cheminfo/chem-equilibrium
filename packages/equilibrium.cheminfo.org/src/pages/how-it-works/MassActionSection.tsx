import { Species } from '../../components/Species.tsx';

import { Formula, Inline, Sub, Sup } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { SourceLink } from './SourceLink.tsx';

/**
 * The one equation every formed species obeys, and what a negative coefficient
 * means.
 * @returns The section.
 */
export function MassActionSection() {
  return (
    <HowSection
      id="mass-action"
      source={
        <>
          <SourceLink file="core/NewtonRaphton.ts" />, the block that computes{' '}
          <Inline>cSpec</Inline> at the top of each iteration.
        </>
      }
      tools={[
        {
          path: '/speciation',
          hint: 'See the formed species follow the components',
        },
      ]}
    >
      <div className="prose">
        <p>
          A formed species <Inline>S</Inline> is built from{' '}
          <Inline>
            a<Sub>iℓ</Sub>
          </Inline>{' '}
          units of each component. Its formation constant β is the equilibrium
          constant of that assembly, and the law of mass action turns it into a
          plain product:
        </p>
      </div>

      <Formula
        caption={
          <>
            β<Sub>ℓ</Sub> is the formation constant of species ℓ, a<Sub>iℓ</Sub>{' '}
            its stoichiometric coefficient on component i. The product runs over
            every component.
          </>
        }
      >
        [S<Sub>ℓ</Sub>] = β<Sub>ℓ</Sub> · ∏<Sub>i</Sub> [C<Sub>i</Sub>]
        <Sup>
          a<Sub>iℓ</Sub>
        </Sup>
      </Formula>

      <div className="prose">
        <p>
          That is the whole of the chemistry. There is no iteration in it, no
          approximation, no ordering: given the free components, every formed
          concentration is one line of arithmetic. In the bundled database{' '}
          <Species label="HCO3-" /> is written from <Species label="CO3--" />{' '}
          and <Species label="H+" /> with pK 10.33, so
        </p>
      </div>

      <Formula>
        [<Species label="HCO3-" withName={false} />] = 10<Sup>10.33</Sup> × [
        <Species label="CO3--" withName={false} />] × [
        <Species label="H+" withName={false} />] = 2.138 × 10<Sup>10</Sup> × [
        <Species label="CO3--" withName={false} />] × [
        <Species label="H+" withName={false} />]
      </Formula>

      <h3>The sign of a coefficient</h3>
      <div className="prose">
        <p>
          A <strong>positive</strong> coefficient means the component is
          consumed to build the species: one <Species label="CO3--" /> and one{' '}
          <Species label="H+" /> disappear to make one <Species label="HCO3-" />
          .
        </p>
        <p>
          A <strong>negative</strong> coefficient means the component is{' '}
          <em>released</em> — the species is built by taking that component
          away. This is not a trick, it is what lets the solvent disappear from
          the model. Water has unit activity and is never carried as a species,
          so autoprotolysis is stored as a definition of hydroxide from the
          proton alone:
        </p>
      </div>

      <Formula
        caption={
          <>
            One component, coefficient −1, β = 10<Sup>−14</Sup> — this is K
            <Sub>w</Sub> in the form the solver reads.
          </>
        }
      >
        [<Species label="OH-" withName={false} />] = 10<Sup>−14</Sup> × [
        <Species label="H+" withName={false} />]<Sup>−1</Sup> = K<Sub>w</Sub> /
        [<Species label="H+" withName={false} />]
      </Formula>

      <div className="prose">
        <p>
          Every hydroxide, every hydroxo complex and every metal hydroxide
          precipitate in this database is written the same way, with a negative
          coefficient on <Species label="H+" /> rather than a positive one on{' '}
          <Species label="OH-" />. It is why you will see{' '}
          <Species label="Cu(OH)2" /> carrying a coefficient of −2 on the proton
          throughout the site, and why a pK can be negative without anything
          being wrong.
        </p>
      </div>
    </HowSection>
  );
}
