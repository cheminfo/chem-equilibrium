import { Button, Card, Icon } from '@blueprintjs/core';

import { navigate } from '../../router/location.ts';
import type { ToolPath } from '../../routes.ts';
import { labelOf } from '../../routes.ts';

import type { ToolExample } from './examples.tsx';

interface ToolCardProps {
  /** Route of the tool the card opens. */
  path: ToolPath;
  example: ToolExample;
}

/**
 * One tool of the site, with the question its worked example answers.
 *
 * The primary button carries the whole example in the query string, so the
 * first thing a visitor sees of a tool is a solved system rather than an empty
 * form they have to fill in before anything happens.
 * @param props - The tool to present.
 * @returns The card.
 */
export function ToolCard(props: ToolCardProps) {
  const { path, example } = props;

  return (
    <Card compact style={CARD_STYLE}>
      <div style={TITLE_ROW_STYLE}>
        <Icon icon={example.icon} intent="primary" />
        <h3 style={TITLE_STYLE}>{labelOf(path)}</h3>
      </div>

      <p style={SUMMARY_STYLE}>{example.summary}</p>

      <p className="bp6-text-muted" style={QUESTION_STYLE}>
        {example.question}
      </p>

      <div style={ACTIONS_STYLE}>
        <Button
          intent="primary"
          icon="play"
          text="Open the example"
          onClick={() => navigate(path, example.query)}
        />
        <Button
          variant="minimal"
          text="Open the tool"
          onClick={() => navigate(path)}
        />
      </div>
    </Card>
  );
}

const CARD_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  height: '100%',
} as const;

const TITLE_ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
} as const;

const TITLE_STYLE = { margin: 0, fontSize: 15 } as const;
const SUMMARY_STYLE = { margin: 0, lineHeight: 1.5 } as const;
const QUESTION_STYLE = {
  margin: 0,
  fontStyle: 'italic',
  lineHeight: 1.5,
} as const;
const ACTIONS_STYLE = {
  display: 'flex',
  gap: 4,
  marginTop: 'auto',
  paddingTop: 4,
  flexWrap: 'wrap',
} as const;
