import { Button, Callout } from '@blueprintjs/core';

import type { AcidKind, ExerciseContext } from '../../../data/exercises.ts';
import { HINT_LADDERS, solutionSteps } from '../../../data/exercises.ts';

import { StrongAcidFormula, WeakAcidFormula } from './PhFormulas.tsx';

interface ExerciseHintsProps {
  kind: AcidKind;
  context: ExerciseContext;
  /** How many hints of the ladder are already showing. */
  revealed: number;
  showSolution: boolean;
  onRevealHint: () => void;
  onToggleSolution: () => void;
}

/**
 * The help a stuck student can ask for: hints one at a time, then the worked
 * solution.
 *
 * Both are always available. Getting stuck and reading the reasoning is part of
 * how the two formulas are learned, and the badge on the list records how much
 * help a question took so it can be revisited later.
 * @param props - The question and what is currently revealed.
 * @returns The hint and solution controls.
 */
export function ExerciseHints(props: ExerciseHintsProps) {
  const {
    kind,
    context,
    revealed,
    showSolution,
    onRevealHint,
    onToggleSolution,
  } = props;
  const ladder = HINT_LADDERS[kind];
  const shown = Math.min(revealed, ladder.length);
  const hints = ladder.slice(0, shown).map((hint) => hint(context));

  return (
    <div className="panel-stack">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          icon="lightbulb"
          variant="outlined"
          disabled={shown >= ladder.length}
          onClick={onRevealHint}
          text={
            shown >= ladder.length
              ? 'All hints revealed'
              : `Reveal hint (${shown + 1}/${ladder.length})`
          }
        />
        <Button
          icon={showSolution ? 'eye-off' : 'eye-open'}
          variant="outlined"
          intent={showSolution ? 'none' : 'warning'}
          onClick={onToggleSolution}
          text={showSolution ? 'Hide solution' : 'Reveal solution'}
        />
      </div>

      {hints.map((hint, position) => (
        <Callout
          key={hint}
          intent="primary"
          icon="lightbulb"
          compact
          title={`Hint ${position + 1}`}
        >
          {hint}
        </Callout>
      ))}

      {showSolution ? (
        <Callout intent="warning" icon="key" compact title="Solution">
          <div style={{ margin: '4px 0 10px' }}>
            {kind === 'strong' ? <StrongAcidFormula /> : <WeakAcidFormula />}
          </div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {solutionSteps(kind, context).map((step) => (
              <li key={step.title} style={{ lineHeight: 1.6 }}>
                <strong>{step.title}.</strong> {step.detail}
              </li>
            ))}
          </ol>
        </Callout>
      ) : null}
    </div>
  );
}
