import {
  Alert,
  Button,
  Card,
  FormGroup,
  NumericInput,
  ProgressBar,
} from '@blueprintjs/core';
import { useState } from 'react';

import {
  MAX_SERIES_LENGTH,
  randomSeed,
} from '../../../chemistry/randomSeries.ts';

interface SeriesPanelProps {
  seed: number;
  count: number;
  /** How many questions of the series are solved. */
  solvedCount: number;
  /** How many questions carry a stored answer, hint or solution. */
  touchedCount: number;
  onSeedChange: (seed: number) => void;
  onCountChange: (count: number) => void;
  onClearAll: () => void;
}

/**
 * The controls of the series: which one it is, how long, and how far along.
 *
 * The seed is shown rather than hidden because it is what a teacher hands out:
 * the same seed gives the same questions to a whole class, and the page URL
 * carries it.
 * @param props - The series parameters and the progress.
 * @returns The series card.
 */
export function SeriesPanel(props: SeriesPanelProps) {
  const {
    seed,
    count,
    solvedCount,
    touchedCount,
    onSeedChange,
    onCountChange,
    onClearAll,
  } = props;
  const [clearing, setClearing] = useState(false);

  return (
    <Card compact className="panel-stack">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <FormGroup label="Series (seed)" style={{ marginBottom: 0 }}>
          <NumericInput
            value={seed}
            min={0}
            max={999_999_999}
            stepSize={1}
            clampValueOnBlur
            style={{ width: 110 }}
            onValueChange={(value) => {
              if (Number.isFinite(value)) onSeedChange(Math.trunc(value));
            }}
          />
        </FormGroup>
        <FormGroup label="Questions" style={{ marginBottom: 0 }}>
          <NumericInput
            value={count}
            min={1}
            max={MAX_SERIES_LENGTH}
            stepSize={1}
            clampValueOnBlur
            style={{ width: 90 }}
            onValueChange={(value) => {
              if (Number.isFinite(value)) onCountChange(Math.trunc(value));
            }}
          />
        </FormGroup>
        <FormGroup label="&nbsp;" style={{ marginBottom: 0 }}>
          <Button
            icon="random"
            text="New series"
            onClick={() => onSeedChange(randomSeed())}
          />
        </FormGroup>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Progress</span>
          <span className="numeric">
            {solvedCount} / {count} solved
          </span>
        </div>
        <ProgressBar
          intent={solvedCount === count ? 'success' : 'primary'}
          stripes={false}
          animate={false}
          value={count === 0 ? 0 : solvedCount / count}
        />
      </div>

      <Button
        icon="trash"
        intent="danger"
        variant="outlined"
        text="Clear all answers"
        disabled={touchedCount === 0}
        onClick={() => setClearing(true)}
      />

      <Alert
        isOpen={clearing}
        intent="danger"
        icon="trash"
        confirmButtonText="Clear everything"
        cancelButtonText="Keep my answers"
        canEscapeKeyCancel
        canOutsideClickCancel
        onCancel={() => setClearing(false)}
        onConfirm={() => {
          onClearAll();
          setClearing(false);
        }}
      >
        <p>
          This erases every answer, hint and solution stored for series {seed}.
          It cannot be undone.
        </p>
      </Alert>
    </Card>
  );
}
