import { Callout, Card } from '@blueprintjs/core';
import { useMemo } from 'react';

import type { AnswerStatus } from '../../../chemistry/answers.ts';
import { checkAnswer } from '../../../chemistry/answers.ts';

import { ExerciseCard } from './ExerciseCard.tsx';
import { ExerciseList } from './ExerciseList.tsx';
import { PhFormulasCard } from './PhFormulas.tsx';
import { SeriesPanel } from './SeriesPanel.tsx';
import type { SolvedExercise } from './computation.ts';
import { EMPTY_PROGRESS, useExerciseProgress } from './useExerciseProgress.ts';

interface ExerciseWorkspaceProps {
  /** Seed of the series; mount this component keyed on it. */
  seed: number;
  count: number;
  /** 1-based number of the question being worked on. */
  openIndex: number;
  solved: SolvedExercise[];
  onSeedChange: (seed: number) => void;
  onCountChange: (count: number) => void;
  onOpen: (index: number) => void;
}

/**
 * One series being worked on: the controls, the list, and the open question.
 *
 * The stored answers live here rather than in the tool, so that mounting this
 * component with a new `key` when the seed changes is all it takes to load the
 * other series' answers.
 * @param props - The series, its questions, and the navigation callbacks.
 * @returns The workspace.
 */
export function ExerciseWorkspace(props: ExerciseWorkspaceProps) {
  const {
    seed,
    count,
    openIndex,
    solved,
    onSeedChange,
    onCountChange,
    onOpen,
  } = props;
  const progress = useExerciseProgress(seed);
  const { entries, clearAll } = progress;

  const graded = useMemo(() => {
    const statuses: AnswerStatus[] = [];
    const answers: string[] = [];
    let solvedCount = 0;
    for (const exercise of solved) {
      const answer = entries[exercise.question.index]?.answer ?? '';
      const status = checkAnswer(answer, exercise.simplified).status;
      if (status === 'solved') solvedCount++;
      statuses.push(status);
      answers.push(answer);
    }
    return { statuses, answers, solvedCount };
  }, [solved, entries]);

  const open =
    solved.find((exercise) => exercise.question.index === openIndex) ??
    solved[0];

  return (
    <div className="tool-layout">
      <div className="panel-stack">
        <SeriesPanel
          seed={seed}
          count={count}
          solvedCount={graded.solvedCount}
          touchedCount={Object.keys(entries).length}
          onSeedChange={onSeedChange}
          onCountChange={onCountChange}
          onClearAll={clearAll}
        />
        <Card compact>
          <ExerciseList
            solved={solved}
            statuses={graded.statuses}
            answers={graded.answers}
            openIndex={openIndex}
            onOpen={onOpen}
          />
        </Card>
      </div>

      <div className="panel-stack">
        {open === undefined ? (
          <Callout intent="primary" icon="info-sign">
            This series is empty. Ask for at least one question.
          </Callout>
        ) : (
          <ExerciseCard
            key={open.question.index}
            exercise={open}
            total={solved.length}
            progress={entries[open.question.index] ?? EMPTY_PROGRESS}
            onAnswer={(answer) =>
              progress.setAnswer(open.question.index, answer)
            }
            onRevealHint={() => progress.revealHint(open.question.index)}
            onSetSolution={(shown) =>
              progress.setSolution(open.question.index, shown)
            }
            onReset={() => progress.resetQuestion(open.question.index)}
            onOpen={onOpen}
          />
        )}
        <PhFormulasCard />
      </div>
    </div>
  );
}
