import { Callout } from '@blueprintjs/core';

import { Species } from '../../components/Species.tsx';

import { FoldingWidget } from './FoldingWidget.tsx';
import { Formula, Inline, Sub, Sup } from './Formula.tsx';
import { HowSection } from './HowSection.tsx';
import { SourceLink } from './SourceLink.tsx';

interface FixedSectionProps {
  family: string;
  ph: number;
  onChange: (patch: { family?: string; ph?: number }) => void;
}

/**
 * What "work at a fixed pH" does to the system — the reduction behind every
 * speciation diagram on the site.
 * @param props - The family and pH of the live illustration.
 * @returns The section.
 */
export function FixedSection(props: FixedSectionProps) {
  const { family, ph, onChange } = props;

  return (
    <HowSection
      id="fixed"
      source={
        <>
          <SourceLink file="core/Equilibrium.ts" />, the{' '}
          <Inline>foldFixedComponents</Inline> function.
        </>
      }
      tools={[
        {
          path: '/speciation',
          hint: 'The whole diagram, one fixed pH at a time',
        },
        { path: '/precipitation', hint: 'The same reduction with a solid' },
      ]}
    >
      <div className="prose">
        <p>
          A speciation diagram is not a titration. Nobody adds acid until the pH
          happens to be 6.4: the pH is <em>declared</em>, as if an infinitely
          strong buffer held it there, and the question is what the rest of the
          solution does under that constraint. The solver supports that
          directly, and the way it does is worth understanding, because it is
          the single most common thing this library is asked to do.
        </p>
        <p>
          Imposing a component means it is no longer unknown. And a known
          concentration inside a product of powers is just a number, so it can
          be multiplied into the formation constant and forgotten:
        </p>
      </div>

      <Formula
        caption={
          <>
            v is the imposed concentration, a<Sub>iℓ</Sub> the coefficient of
            that component in species ℓ. Every constant of the model is rescaled
            once, and the component&rsquo;s row and column are deleted.
          </>
        }
      >
        β′<Sub>ℓ</Sub> = β<Sub>ℓ</Sub> · v
        <Sup>
          a<Sub>iℓ</Sub>
        </Sup>
      </Formula>

      <div className="prose">
        <p>
          The system loses one unknown and one equation. For an acid family that
          is decisive: every remaining species carries exactly one unit of the
          same component, so the mass balance stops being a product of powers
          and becomes <strong>linear</strong>. It can be solved in one line,
          with no iteration at all —{' '}
          <Inline>[C] = T / (1 + β′₁ + β′₂ + …)</Inline>.
        </p>
        <p>
          Move the slider below. The left-hand columns are the database
          constants, which never change; the folded ones slide by one decade per
          pH unit per proton, which is why the fractions swing so sharply around
          each pK. The last two columns are the same numbers computed twice: by
          the one-line algebra, and by the full Newton-Raphson solver of the
          next section.
        </p>
      </div>

      <FoldingWidget family={family} ph={ph} onChange={onChange} />

      <Callout intent="primary" icon="info-sign" style={{ marginTop: 12 }}>
        The imposed value never enters the iteration and is written back into
        the result untouched, so a diagram drawn at pH 7 reports{' '}
        <Species label="H+" /> = 10⁻⁷ mol/L exactly, not 1.0000003 × 10⁻⁷.
      </Callout>

      <div className="prose">
        <p>
          One caveat, since the site exposes both: imposing a concentration and
          declaring a total are different questions. A total says how much
          matter is present and lets the solver find the pH; imposing says the
          pH is held and lets the matter balance be whatever it must. Only the
          first conserves protons.
        </p>
      </div>
    </HowSection>
  );
}
