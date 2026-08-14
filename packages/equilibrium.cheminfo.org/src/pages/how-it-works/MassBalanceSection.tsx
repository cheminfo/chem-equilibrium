import { Species } from '../../components/Species.tsx';

import { Formula, Inline, Sub, Sup } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { SourceLink } from './SourceLink.tsx';

/**
 * The equations that are actually solved, and how an amount put in the flask
 * reaches them.
 * @returns The section.
 */
export function MassBalanceSection() {
  return (
    <HowSection
      id="mass-balance"
      source={
        <>
          <SourceLink file="core/NewtonRaphton.ts" /> for the residual,{' '}
          <SourceLink file="core/EquationSet.ts" /> for the distribution of the
          totals.
        </>
      }
      tools={[{ path: '/ph', hint: 'Check a mass balance on a real solution' }]}
    >
      <div className="prose">
        <p>
          Matter is conserved. Whatever you weighed into the flask is still
          there, spread over the species it formed. That is one equation per
          component — and since there is also exactly one unknown per component,
          the system is square.
        </p>
      </div>

      <Formula
        caption={
          <>
            T<Sub>i</Sub> is the analytical total of component i, n<Sub>p</Sub>{' '}
            the amount of solid p and s<Sub>ip</Sub> its stoichiometry. The
            first sum runs over every dissolved species, the components
            included.
          </>
        }
      >
        T<Sub>i</Sub> = ∑<Sub>ℓ</Sub> a<Sub>iℓ</Sub> [S<Sub>ℓ</Sub>] + ∑
        <Sub>p</Sub> s<Sub>ip</Sub> n<Sub>p</Sub>
      </Formula>

      <div className="prose">
        <p>
          Substituting the law of mass action into the first sum leaves nothing
          but the components:
        </p>
      </div>

      <Formula>
        T<Sub>i</Sub> = ∑<Sub>ℓ</Sub> a<Sub>iℓ</Sub> β<Sub>ℓ</Sub> ∏<Sub>k</Sub>{' '}
        [C<Sub>k</Sub>]
        <Sup>
          a<Sub>kℓ</Sub>
        </Sup>{' '}
        + ∑<Sub>p</Sub> s<Sub>ip</Sub> n<Sub>p</Sub>
      </Formula>

      <h3>Worked example: 0.1 mol/L acetic acid</h3>
      <div className="prose">
        <p>
          Two components, <Species label="CH3COO-" /> and <Species label="H+" />
          , so two equations. Adding <Species label="CH3CO2H" /> counts as one
          acetate <em>and</em> one proton, so both totals are 0.1 mol/L:
        </p>
      </div>

      <Formula
        caption={
          <>
            The solver returns 1.402596 × 10⁻³ for both{' '}
            <Species label="CH3COO-" /> and <Species label="H+" />, 9.859740 ×
            10⁻² for <Species label="CH3CO2H" />, and 7.1296 × 10⁻¹² for{' '}
            <Species label="OH-" />, in mol/L. Both balances close to 10⁻¹⁷ — pH
            2.853.
          </>
        }
      >
        T(
        <Species label="CH3COO-" withName={false} />) = [
        <Species label="CH3COO-" withName={false} />] + [
        <Species label="CH3CO2H" withName={false} />] = 0.1
        <br />T (<Species label="H+" withName={false} />) = [
        <Species label="H+" withName={false} />] − [
        <Species label="OH-" withName={false} />] + [
        <Species label="CH3CO2H" withName={false} />] = 0.1
      </Formula>

      <div className="prose">
        <p>
          The minus sign in front of hydroxide is not a special case: it is the
          −1 coefficient of section 2 appearing in the sum. The same mechanism
          lets you raise the pH of a system by declaring hydroxide — adding 0.05
          mol of <Species label="OH-" /> is recorded as{' '}
          <strong>
            −0.05 mol of <Species label="H+" />
          </strong>
          , a proton deficit. Negative totals are legal and mean exactly that.
        </p>
        <p>
          Two bookkeeping details are worth knowing. Amounts you declare on a
          formed species are pushed onto its components first: one mole of{' '}
          <Species label="HCO3-" /> is stored as one mole of{' '}
          <Species label="CO3--" /> and one mole of <Species label="H+" />. And{' '}
          <Inline>total</Inline> is an <em>amount</em>, not a concentration —
          the solver divides it by the volume of the solution, which is how a
          titration accounts for dilution as the burette empties.
        </p>
        <p>
          The solid term is the odd one out. A pure solid has unit activity, so
          n<Sub>p</Sub> never appears in any mass-action product; it is only a
          reservoir in the balance. That makes it an amount of matter rather
          than a concentration, and it is why solids need their own treatment in
          section 8.
        </p>
      </div>
    </HowSection>
  );
}
