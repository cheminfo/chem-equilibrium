import { Callout } from '@blueprintjs/core';

import { Formula, Inline, Sub, Sup } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { NewtonWidget } from './NewtonWidget.tsx';
import { SourceLink } from './SourceLink.tsx';

interface NewtonSectionProps {
  acid: string;
  amount: number;
  guess: number;
  onChange: (patch: { acid?: string; amount?: number; guess?: number }) => void;
}

/**
 * How the free component concentrations are actually found.
 * @param props - The system and starting point of the live illustration.
 * @returns The section.
 */
export function NewtonSection(props: NewtonSectionProps) {
  const { acid, amount, guess, onChange } = props;

  return (
    <HowSection
      id="newton"
      source={
        <>
          <SourceLink file="core/NewtonRaphton.ts" /> — the whole iteration is
          one loop, and the misspelling is the exported name.
        </>
      }
      tools={[
        { path: '/ph', hint: 'Solve one flask and read the residual' },
        { path: '/equilibrium', hint: 'Change the tolerance and watch' },
      ]}
    >
      <div className="prose">
        <p>
          Sections 4 and 2 leave one equation per component and one unknown per
          component, all of them nonlinear. Newton-Raphson does what it always
          does: linearise, solve, step, repeat. The only interesting choices are
          what to differentiate with respect to, and what to do when the step
          overshoots.
        </p>

        <h3>The residual</h3>
        <p>
          What has to be driven to zero is the gap between the matter you put in
          and the matter the current guess accounts for:
        </p>
      </div>

      <Formula>
        d<Sub>i</Sub> = T<Sub>i</Sub> − ( ∑<Sub>ℓ</Sub> a<Sub>iℓ</Sub> [S
        <Sub>ℓ</Sub>] + ∑<Sub>p</Sub> s<Sub>ip</Sub> n<Sub>p</Sub> )
      </Formula>

      <div className="prose">
        <h3>The Jacobian, and why it is symmetric</h3>
        <p>
          Concentrations span decades, so the sensible variable is not [C] but
          ln[C] — a change of 10 % is the same size wherever you are on the
          scale. Differentiating the calculated total against the logarithms
          gives a strikingly simple block:
        </p>
      </div>

      <Formula
        caption={
          <>
            Because a<Sub>jℓ</Sub> a<Sub>kℓ</Sub> = a<Sub>kℓ</Sub> a
            <Sub>jℓ</Sub>, the matrix is symmetric — cheaper to build and to
            invert. The code fills only the upper triangle and mirrors it.
          </>
        }
      >
        J*<Sub>jk</Sub> = ∂T<Sub>j</Sub>
        <Sup>calc</Sup> / ∂ln[C<Sub>k</Sub>] = ∑<Sub>ℓ</Sub> a<Sub>jℓ</Sub> · a
        <Sub>kℓ</Sub> · [S<Sub>ℓ</Sub>]
      </Formula>

      <div className="prose">
        <h3>The update is multiplicative</h3>
        <p>
          Solving <Inline>J* · Δln c = d</Inline> gives a step in log space,
          which has to be brought back to a step in concentration. The chain
          rule does it in one multiplication:
        </p>
      </div>

      <Formula
        caption={
          <>
            The step is proportional to the concentration itself, so a component
            at 10⁻¹² moves by 10⁻¹³ and one at 0.1 moves by 0.01. That is what
            makes the iteration behave the same over every decade — and what
            makes an initial guess ten decades off cost roughly ten extra
            iterations rather than diverging.
          </>
        }
      >
        Δc<Sub>i</Sub> = c<Sub>i</Sub> · Δln c<Sub>i</Sub>
      </Formula>

      <div className="prose">
        <h3>Step halving</h3>
        <p>
          A concentration must stay positive, and{' '}
          <Inline>c · (1 + Δln c)</Inline> is not guaranteed to be — the true
          multiplicative update <Inline>c · exp(Δln c)</Inline> would be, but it
          is not what a linear solve produces. So the step is simply backed off
          geometrically: try <Inline>c + Δ</Inline>; if anything came out zero
          or negative, halve and retry at <Inline>c + Δ/2</Inline>, then{' '}
          <Inline>c + Δ/4</Inline>, until every entry is positive. The whole
          vector is damped together, not just the offending coordinate.
        </p>
      </div>

      <Callout intent="primary" icon="lightbulb" style={{ marginTop: 12 }}>
        Start 0.1 mol/L phosphoric acid at 10⁻⁷ mol/L and the iteration needs
        111 halvings before it settles — then converges to pH 1.6196 anyway.
        Start it at 10⁻³ and it does not converge at all within 40 iterations.
        Try both below.
      </Callout>

      <NewtonWidget
        acid={acid}
        amount={amount}
        guess={guess}
        onChange={onChange}
      />

      <div className="prose">
        <p>
          The curves are the p-values of the free components, one per iteration.
          A well-started run drops onto its answer in four or five steps with
          the residual falling quadratically — 10⁻⁴, 10⁻⁷, 10⁻¹³ — which is the
          signature of Newton actually working. A badly started one crawls down
          one decade at a time, because at that point the halving loop, not the
          Jacobian, is choosing the step length.
        </p>
      </div>
    </HowSection>
  );
}
