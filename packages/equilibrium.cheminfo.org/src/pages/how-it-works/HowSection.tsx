import { Button, Card } from '@blueprintjs/core';
import type { ReactNode } from 'react';

import { navigate } from '../../router/location.ts';
import type { RoutePath } from '../../routes.ts';
import { labelOf } from '../../routes.ts';

import type { SectionId } from './sections.ts';
import { numberOf, titleOf } from './sections.ts';

/** A tool where the idea of a section can be watched at work. */
export interface SectionTool {
  path: RoutePath;
  /** Query that reproduces the configuration the section talks about. */
  query?: Record<string, string>;
  /** What the reader should look at once there. */
  hint?: string;
}

interface HowSectionProps {
  id: SectionId;
  children: ReactNode;
  /** Tools linked at the end of the section. */
  tools?: SectionTool[];
  /** Where the described behaviour is implemented. */
  source?: ReactNode;
}

/**
 * One numbered section: a heading, the explanation, and the way out of it.
 * @param props - Identifier, content, tool links and source references.
 * @returns The section.
 */
export function HowSection(props: HowSectionProps) {
  const { id, children, tools, source } = props;

  return (
    <section id={id} style={{ scrollMarginTop: 12 }}>
      <Card style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>
          <span className="bp6-text-muted">{numberOf(id)}.</span> {titleOf(id)}
        </h2>
        {children}
        {source ? (
          <p
            className="bp6-text-small bp6-text-muted"
            style={{ marginTop: 16 }}
          >
            In the source: {source}
          </p>
        ) : null}
        {tools && tools.length > 0 ? (
          <div
            className="no-print"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            {tools.map((tool) => (
              <Button
                key={`${tool.path}-${tool.hint ?? ''}`}
                icon="arrow-right"
                variant="outlined"
                intent="primary"
                onClick={() => navigate(tool.path, tool.query)}
              >
                {tool.hint ?? labelOf(tool.path)}
              </Button>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}
