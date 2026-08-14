import { Callout } from '@blueprintjs/core';

import { Species } from '../../components/Species.tsx';

import { Formula, Inline, Sub, Sup } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { SolidExample } from './SolidExample.tsx';
import { SourceLink } from './SourceLink.tsx';

/**
 * Why a precipitate is harder than anything dissolved.
 * @returns The section.
 */
export function SolidsSection() {
  return (
    <HowSection
      id="solids"
      source={
        <>
          <SourceLink file="core/NewtonRaphton.ts" /> — the active-set block at
          the top of the loop, and the saddle-point rows of the Jacobian.
        </>
      }
      tools={[
        { path: '/precipitation', hint: 'Precipitate something and watch' },
      ]}
    >
      <div className="prose">
        <p>
          Everything so far was smooth. A dissolved species is a continuous
          function of the components, so the residual has derivatives everywhere
          and Newton is in its element. A solid is not like that. It is either
          there or it is not, and which of the two it is depends on the answer
          you are still looking for.
        </p>

        <h3>A switch, not a function</h3>
        <p>
          At equilibrium each candidate solid satisfies exactly one of two
          mutually exclusive conditions:
        </p>
      </div>

      <Formula
        caption={
          <>
            n<Sub>p</Sub> is the amount of solid p and IAP<Sub>p</Sub> = ∏
            <Sub>i</Sub> [C<Sub>i</Sub>]^s the ion product of the solution. In
            optimisation this is a complementarity condition; in a lab it is the
            difference between a clear beaker and a cloudy one.
          </>
        }
      >
        n<Sub>p</Sub> &gt; 0 and IAP<Sub>p</Sub> = K<Sub>sp,p</Sub> (phase
        present, solution saturated)
        <br />n<Sub>p</Sub> = 0 and IAP<Sub>p</Sub> ≤ K<Sub>sp,p</Sub> (phase
        absent, solution undersaturated)
      </Formula>

      <div className="prose">
        <p>
          With N candidate solids there are 2<sup>N</sup> possible phase
          assemblages, and picking the right one is a <em>discrete</em> choice
          sitting inside a continuous problem. The residual is only piecewise
          smooth: every time the set of present phases flips, the function being
          solved changes, and Newton&rsquo;s quadratic convergence is lost and
          has to be earned again. That, in one sentence, is why precipitation is
          the hard part.
        </p>

        <h3>The active set is re-decided every iteration</h3>
        <p>
          The solver does not enumerate the 2<sup>N</sup> possibilities. At the
          top of each iteration it looks at the current guess and admits a solid
          into the system if any of three things is true:
        </p>
        <ul>
          <li>
            its ion product <strong>exceeds</strong> its solubility product —
            the solution is supersaturated, so the phase must appear;
          </li>
          <li>
            it <strong>already holds matter</strong> from a previous iteration,
            so it stays in the basis and is allowed to redissolve gradually;
          </li>
          <li>
            it sits <strong>exactly at saturation</strong>, within the
            tolerance.
          </li>
        </ul>
        <p>
          There is no fourth rule for removing one. A solid leaves silently: its
          amount is clamped at zero by the step, and on the next sweep, if it is
          also undersaturated, none of the three tests fires and it is simply
          not part of the system any more. The number of unknowns therefore
          changes from iteration to iteration.
        </p>

        <h3>A zero block, and what it means</h3>
        <p>
          The amounts of the admitted solids join the free components as
          unknowns, and the Jacobian gains a border:
        </p>
      </div>

      <Formula
        caption={
          <>
            A is the symmetric block of section 7; S holds the solid
            stoichiometry. The bottom-right block is{' '}
            <strong>exactly zero</strong>, because the saturation condition does
            not depend on how much solid is present — the whole physics of a
            pure phase in one empty block. It also makes the matrix indefinite
            rather than positive definite.
          </>
        }
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span>J* =</span>
          <span style={{ fontSize: '2.4em', lineHeight: 1 }}>[</span>
          <span style={{ display: 'inline-grid', gap: '2px 18px' }}>
            <span style={{ gridArea: '1 / 1' }}>A</span>
            <span style={{ gridArea: '1 / 2' }}>S</span>
            <span style={{ gridArea: '2 / 1' }}>
              S<Sup>T</Sup>
            </span>
            <span style={{ gridArea: '2 / 2' }}>0</span>
          </span>
          <span style={{ fontSize: '2.4em', lineHeight: 1 }}>]</span>
        </span>
      </Formula>

      <div className="prose">
        <p>
          The consequence you can see in any result: a solid&rsquo;s
          &ldquo;concentration&rdquo; is not a concentration. Its activity is 1,
          so it never appears in a mass-action product; it appears only in the
          mass balance, as a reservoir. The number reported for{' '}
          <Species label="AgCl" /> below is an <em>amount</em> of matter parked
          out of solution — which is why it reaches 0.009987 mol while the
          dissolved silver stays at 1.35 × 10⁻⁵ mol/L.
        </p>
      </div>

      <SolidExample />

      <Callout intent="warning" icon="warning-sign" style={{ marginTop: 12 }}>
        Because the phase assemblage is discrete, this is where the solver is
        most likely to struggle: a solid can be admitted, pushed negative,
        clamped, dropped, then found supersaturated again. There is no
        anti-cycling rule. When a precipitation system misbehaves, the
        recommended manual fix is the two-stage one from the examples — solve
        the fully dissolved system first, then feed its components in as{' '}
        <Inline>setInitial</Inline> for the run with solids.
      </Callout>
    </HowSection>
  );
}
