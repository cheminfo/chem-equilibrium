import { Button, Callout, Card } from '@blueprintjs/core';

import { navigate } from '../router/location.ts';
import { TOOL_PATHS } from '../routes.ts';

import { ToolCard } from './home/ToolCard.tsx';
import { TOOL_EXAMPLES } from './home/examples.tsx';

/**
 * The landing page: what the site computes, and one worked example per tool.
 *
 * A visitor who has never seen it should be able to click once and land on a
 * solved system, which is why every card carries a configured example rather
 * than a bare link to an empty form.
 * @returns The home page.
 */
export function HomePage() {
  return (
    <div className="panel-stack">
      <section className="prose">
        <h2 style={HEADLINE_STYLE}>Chemical equilibrium, solved exactly</h2>
        <p style={LEAD_STYLE}>
          This site solves chemical equilibria — acid/base, complexation and
          precipitation — with no simplifying approximation, and shows the
          answer as speciation diagrams, titration curves and pH values.
        </p>
        <p className="bp6-text-muted" style={{ marginBottom: 0 }}>
          Nothing is installed and nothing is sent anywhere: the solver runs in
          the browser, on a bundled database of equilibrium constants.
        </p>
      </section>

      <div style={GRID_STYLE}>
        {TOOL_PATHS.map((path) => (
          <ToolCard key={path} path={path} example={TOOL_EXAMPLES[path]} />
        ))}
      </div>

      <Callout icon="link" intent="primary" title="Every tool is a link">
        <p style={{ margin: 0 }}>
          The complete configuration of a tool — the species, the amounts, the
          range being swept, the indicator, even which exercise is open — lives
          in its URL. Set up a diagram or an exercise, copy the address with{' '}
          <strong>Share</strong> in the top bar, and the class opens exactly
          what you were looking at.
        </p>
      </Callout>

      <Card compact>
        <h3 style={SECTION_TITLE_STYLE}>Behind the tools</h3>
        <p style={{ marginTop: 0 }}>
          The method and the numbers are both open: read how the system is set
          up and solved, or check any constant before building a lesson on it.
        </p>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Button
            icon="function"
            text="How it works"
            onClick={() => navigate('/how-it-works')}
          />
          <Button
            icon="database"
            text="Data"
            onClick={() => navigate('/data')}
          />
        </div>
      </Card>
    </div>
  );
}

const HEADLINE_STYLE = { margin: '0 0 8px' } as const;
const LEAD_STYLE = {
  margin: '0 0 8px',
  fontSize: 16,
  lineHeight: 1.6,
} as const;
const SECTION_TITLE_STYLE = { margin: '0 0 8px' } as const;

const GRID_STYLE = {
  display: 'grid',
  gap: 'var(--gap)',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
  alignItems: 'stretch',
} as const;
