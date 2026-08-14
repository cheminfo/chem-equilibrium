import { Button, Callout, Card, InputGroup, Tag } from '@blueprintjs/core';
import { useState } from 'react';

import { checkAnswer } from '../../../chemistry/answers.ts';
import { formatConcentration, formatPK } from '../../../chemistry/format.ts';
import { EquationText } from '../../../components/EquationText.tsx';
import { Species } from '../../../components/Species.tsx';
import type { ExerciseContext } from '../../../data/exercises.ts';
import { exactGapNote } from '../../../data/exercises.ts';

import { ExerciseHints } from './ExerciseHints.tsx';
import type { SolvedExercise } from './computation.ts';
import { STATUS_STYLES } from './status.ts';
import type { ExerciseProgress } from './useExerciseProgress.ts';

interface ExerciseCardProps {
  exercise: SolvedExercise;
  /** How many questions the series holds. */
  total: number;
  progress: ExerciseProgress;
  onAnswer: (answer: string) => void;
  onRevealHint: () => void;
  onSetSolution: (shown: boolean) => void;
  onReset: () => void;
  onOpen: (index: number) => void;
}

/**
 * The question the student is working on, with its answer box, its help, and —
 * once answered — the value the full solver gives.
 *
 * The typed answer is graded when the student commits it, not on every
 * keystroke, so that a half-typed `2.` is never reported as wrong.
 * @param props - The question, what is stored about it, and the actions.
 * @returns The question card.
 */
export function ExerciseCard(props: ExerciseCardProps) {
  const {
    exercise,
    total,
    progress,
    onAnswer,
    onRevealHint,
    onSetSolution,
    onReset,
    onOpen,
  } = props;
  const { question, kind, simplified, exact } = exercise;
  const [draft, setDraft] = useState(progress.answer);

  const check = checkAnswer(progress.answer, simplified);
  const style = STATUS_STYLES[check.status];
  const answered = check.status === 'wrong' || check.status === 'solved';
  const context: ExerciseContext = {
    pK: question.pK,
    concentration: question.concentration,
    ph: simplified,
  };

  function commit() {
    if (draft !== progress.answer) onAnswer(draft);
  }

  return (
    <Card className="panel-stack">
      <div style={headerStyle}>
        <h3 style={{ margin: 0 }}>
          Question {question.index} of {total}
        </h3>
        <Tag minimal intent={style.intent} icon={style.icon}>
          {style.label}
        </Tag>
        {progress.hints > 0 && check.status === 'solved' ? (
          <Tag minimal intent="primary">
            Solved with {progress.hints} hint{progress.hints > 1 ? 's' : ''}
          </Tag>
        ) : null}
      </div>

      <p style={{ fontSize: 16, margin: 0 }}>
        We have a {formatConcentration(question.concentration)} mol/L solution
        of <Species label={question.formed} />.
      </p>

      <Callout compact icon={null} style={{ background: '#fffbe6' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
          <EquationText equation={question} />
          <span>
            pK<sub>a</sub> = {formatPK(question.pK)}
          </span>
        </div>
      </Callout>

      <label htmlFor="exercise-answer" style={{ fontWeight: 600 }}>
        Please determine the pH of this solution:
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <InputGroup
          id="exercise-answer"
          value={draft}
          placeholder="pH"
          size="large"
          style={{ maxWidth: 160 }}
          intent={check.status === 'solved' ? 'success' : 'none'}
          autoComplete="off"
          spellCheck={false}
          onValueChange={setDraft}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
          }}
        />
        <Button intent="primary" icon="tick" text="Check" onClick={commit} />
        <Button
          variant="minimal"
          icon="reset"
          text="Reset"
          onClick={() => {
            setDraft('');
            onReset();
          }}
        />
      </div>

      {check.status === 'invalid' ? (
        <Callout intent="warning" icon="warning-sign" compact>
          {check.message}
        </Callout>
      ) : null}
      {check.status === 'wrong' ? (
        <Callout intent="danger" icon="cross-circle" compact>
          Not quite yet. Check which of the two formulas applies, then redo the
          substitution — a hint below narrows it down.
        </Callout>
      ) : null}
      {check.status === 'solved' ? (
        <Callout intent="success" icon="tick-circle" compact>
          Correct. The simplified formula gives pH = {simplified.toFixed(2)}.
        </Callout>
      ) : null}

      {answered || progress.solution ? (
        <Callout compact icon="calculator" title="What the full solver says">
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Simplified formula: pH = {simplified.toFixed(2)}. Full
            multi-equilibrium calculation:{' '}
            {exact === undefined ? '—' : `pH = ${exact.toFixed(2)}`}.
          </p>
          {exact === undefined ? null : (
            <p style={{ margin: '4px 0 0', lineHeight: 1.6 }}>
              {exactGapNote(kind, simplified, exact)}
            </p>
          )}
        </Callout>
      ) : null}

      <ExerciseHints
        kind={kind}
        context={context}
        revealed={progress.hints}
        showSolution={progress.solution}
        onRevealHint={onRevealHint}
        onToggleSolution={() => onSetSolution(!progress.solution)}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          icon="chevron-left"
          text="Previous"
          variant="outlined"
          disabled={question.index <= 1}
          onClick={() => onOpen(question.index - 1)}
        />
        <Button
          endIcon="chevron-right"
          text="Next"
          variant="outlined"
          disabled={question.index >= total}
          onClick={() => onOpen(question.index + 1)}
        />
      </div>
    </Card>
  );
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
} as const;
