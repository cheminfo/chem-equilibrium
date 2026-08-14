import { Callout } from '@blueprintjs/core';

import { Species } from '../../components/Species.tsx';

import { Formula, Inline, Sub, Sup } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { SourceLink } from './SourceLink.tsx';

const SETTINGS = [
  {
    name: 'tolerance',
    value: '10⁻¹⁵',
    what: 'Largest absolute mass-balance residual accepted, in mol/L, on every component at once.',
    caution:
      'It is absolute. For totals around 1 mol/L that is four or five units in the last place — about as tight as double precision can deliver.',
  },
  {
    name: 'solidTolerance',
    value: '10⁻⁵',
    what: 'How close the ion product of a present solid must be to its solubility product. The tools on this site tighten it to 10⁻⁸.',
    caution:
      'Tested both absolutely, |Ksp − IAP|, and relatively, |1 − IAP/Ksp|. Passing either is enough, and the relative test is what makes hydroxides converge.',
  },
  {
    name: 'maxIterations',
    value: '99',
    what: 'Iterations before the solver gives up and returns null. The tools on this site raise it to 200.',
    caution:
      'Running out is not an error, it is an answer of "I could not find it from here". Nothing is thrown.',
  },
];

/**
 * When the solver decides it is done, when it decides it has failed, and what
 * either verdict is worth.
 * @returns The section.
 */
export function ConvergenceSection() {
  return (
    <HowSection
      id="convergence"
      source={
        <>
          <SourceLink file="core/NewtonRaphton.ts" /> — the two check functions
          at the bottom of the file.
        </>
      }
      tools={[
        { path: '/equilibrium', hint: 'Change the tolerances yourself' },
        { path: '/titration', hint: 'See a missing point on a curve' },
      ]}
    >
      <div className="scroll-x">
        <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
          <thead>
            <tr>
              <th>Setting</th>
              <th className="numeric">Default</th>
              <th>What it tests</th>
              <th>What to watch for</th>
            </tr>
          </thead>
          <tbody>
            {SETTINGS.map((setting) => (
              <tr key={setting.name}>
                <td>
                  <Inline>{setting.name}</Inline>
                </td>
                <td className="numeric">{setting.value}</td>
                <td style={{ whiteSpace: 'normal', minWidth: 240 }}>
                  {setting.what}
                </td>
                <td style={{ whiteSpace: 'normal', minWidth: 260 }}>
                  {setting.caution}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose">
        <h3>What a non-converged point means</h3>
        <p>
          When the budget runs out the solver returns <Inline>null</Inline>.
          That is not an exception and not a wrong answer: it is the honest
          statement that Newton did not reach the tolerance from the starting
          point it was given. A sweep counts those points, leaves them out of
          its output arrays, and carries on — which is why a diagram can have a
          visible gap, and why every tool on this site reports the number of
          failed points above the chart rather than quietly shortening the
          curve.
        </p>
        <p>
          A failure is almost always a starting-point problem rather than a
          chemistry problem. Widening the tolerance, raising the iteration
          count, or taking more, smaller steps across the sweep are the three
          things that fix it.
        </p>

        <h3>Why the solid criterion cannot be absolute</h3>
        <p>
          Solubility products are the widest-ranging numbers in the whole
          package. Written on the normalized basis, the bundled database runs
          from <Species label="Bi2S3" /> at 1.6 × 10⁻⁷² to{' '}
          <Species label="Ca(OH)2" /> at 5.0 × 10²² — a span of{' '}
          <strong>94 decades</strong>. No single absolute threshold can mean
          anything across that range.
        </p>
      </div>

      <Formula
        caption={
          <>
            Silver chloride: K<Sub>sp</Sub> = 1.8 × 10⁻¹⁰, so |K<Sub>sp</Sub> −
            IAP| is 2.8 × 10⁻¹⁵ at the answer — an absolute test at 10⁻⁵ can
            never fail, and says nothing.
          </>
        }
      >
        |K<Sub>sp</Sub> − IAP| &lt; tolerance <em>or</em> |1 − IAP / K
        <Sub>sp</Sub>| &lt; tolerance
      </Formula>

      <div className="prose">
        <p>
          The other end is the interesting one. Put 0.1 mol of{' '}
          <Species label="Ca++" /> and 0.1 mol of <Species label="OH-" /> in a
          litre. The solver settles on 0.045218 mol of{' '}
          <Species label="Ca(OH)2" />, leaving 0.054782 mol/L of{' '}
          <Species label="Ca++" /> at pH 11.98, and its ion product matches the
          solubility product of 5.01187 × 10²² to seven significant digits — a
          relative gap of about 10⁻⁷, while their <em>absolute</em> difference
          is still around 10¹⁶. An absolute-only test would reject a correct
          answer forever; the relative one accepts it.
        </p>
      </div>

      <Callout intent="primary" icon="info-sign">
        The formation constants themselves span 187 decades, from{' '}
        <Species label="Zn(OH)4--" /> at β = 2.8 × 10<Sup>−41</Sup> to{' '}
        <Species label="Ni(NH3)6++" /> at β = 2.0 × 10<Sup>146</Sup>. A single
        product of a dozen such factors can overflow to infinity or underflow to
        zero from a bad starting guess — which is exactly what the random
        restarts of the next section exist to survive.
      </Callout>
    </HowSection>
  );
}
