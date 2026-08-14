import { Callout } from '@blueprintjs/core';

import { Species } from '../../components/Species.tsx';

import { Formula, Inline } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { SourceLink } from './SourceLink.tsx';

const MEASURED = [
  {
    strategy: 'One random start per point',
    converged: '158 / 201',
    time: '≈ 130 ms',
    note: 'Forty-three gaps in the curve, from nothing but bad luck on the starting guess.',
  },
  {
    strategy: 'Up to ten random restarts per point',
    converged: '201 / 201',
    time: '≈ 160 ms',
    note: 'Complete, but most of the work is spent rediscovering an answer that was already known.',
  },
  {
    strategy: 'Continuation from the previous point',
    converged: '201 / 201',
    time: '≈ 15 ms',
    note: 'One Newton run per point, no restart needed anywhere along the sweep.',
  },
];

/**
 * Why a curve is not a hundred independent problems.
 * @returns The section.
 */
export function ContinuationSection() {
  return (
    <HowSection
      id="continuation"
      source={
        <>
          <SourceLink file="helpers/Serie.ts" /> — the same four lines drive
          both the titration and the sweep.
        </>
      }
      tools={[
        { path: '/titration', hint: 'A titration, point by point' },
        { path: '/speciation', hint: 'A sweep, point by point' },
      ]}
    >
      <div className="prose">
        <p>
          A titration curve or a speciation diagram is two hundred equilibria in
          a row, and consecutive ones are almost identical. Solving each from
          scratch throws that away. Continuation — the numerical analyst&rsquo;s
          homotopy, the chemist&rsquo;s &ldquo;the previous point is a good
          guess&rdquo; — keeps it.
        </p>
      </div>

      <Formula
        caption={
          <>
            The first point has nothing to inherit, so it is solved cold with up
            to ten random restarts. Every later point gets one Newton run from
            the previous answer.
          </>
        }
      >
        point 0: <Inline>solveRobust()</Inline>
        <br />
        point i: <Inline>setInitial(solution of i−1)</Inline> then{' '}
        <Inline>solve()</Inline>
      </Formula>

      <div className="prose">
        <p>
          The argument is simple and it is the same one behind every parameter
          continuation method: if the step in the parameter is small enough, the
          previous root lies inside the basin of attraction of the new one, so a
          single Newton run reaches it. Section 7 showed the cost of a bad
          guess; here there are no bad guesses left after the first.
        </p>
        <p>
          The cold start it falls back on is a log-uniform draw: a uniform
          random number raised to the tenth power, which spreads the guesses
          over decades rather than over the interval [0, 1] — a concentration is
          much more likely to be 10⁻⁶ than 0.4. That is the right prior, and it
          is still only a prior, which is why it is tried up to ten times.
        </p>
      </div>

      <h3>Measured on a real sweep</h3>
      <p className="prose">
        0.01 mol/L <Species label="Ag+" /> and 0.01 mol/L{' '}
        <Species label="Cl-" />, pH imposed from 0 to 14 in 201 points, with{' '}
        <Species label="AgCl" /> and <Species label="AgOH" /> as candidate
        solids. Same seed, same machine, same system — only the starting
        strategy changes:
      </p>

      <div className="scroll-x">
        <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
          <thead>
            <tr>
              <th>Strategy</th>
              <th className="numeric">Points converged</th>
              <th className="numeric">Time</th>
              <th>What it costs</th>
            </tr>
          </thead>
          <tbody>
            {MEASURED.map((row) => (
              <tr key={row.strategy}>
                <td>{row.strategy}</td>
                <td className="numeric">{row.converged}</td>
                <td className="numeric">{row.time}</td>
                <td style={{ whiteSpace: 'normal', minWidth: 280 }}>
                  {row.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Callout intent="success" icon="tick-circle" style={{ margin: '12px 0' }}>
        Ten times faster <em>and</em> more reliable. That is unusual enough to
        be worth stating plainly: continuation is not a speed optimisation with
        a robustness cost, it is a better-conditioned way of asking the same
        question.
      </Callout>

      <div className="prose">
        <p>
          It also fails gracefully. When a point does not converge, the sweep
          keeps the last successful solution as its reference; the next point
          finds nothing to warm-start from and falls back to random restarts on
          its own. A single hard point therefore costs one gap in the curve, not
          the rest of the run.
        </p>
        <p>
          A titration adds one more piece of bookkeeping: it works entirely in{' '}
          <strong>moles</strong>. At each point it recomputes how much titrant
          has been delivered, hands the solver the current total volume, and
          lets it divide. Dilution enters at exactly one place, which is why the
          curve stays right all the way past the equivalence point instead of
          drifting as the burette empties.
        </p>
        <p>
          The practical advice that follows: if a curve has gaps, add points.
          Doubling the number of chunks halves every parameter step, which makes
          each warm start better, and often costs less total time than the
          restarts it avoids.
        </p>
      </div>
    </HowSection>
  );
}
