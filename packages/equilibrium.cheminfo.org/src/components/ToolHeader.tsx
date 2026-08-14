import { Callout } from '@blueprintjs/core';
import type { ReactNode } from 'react';

interface ToolHeaderProps {
  title: string;
  children: ReactNode;
  /** Number of points the solver failed to converge on, when there are any. */
  errorCount?: number;
  /** Total number of points attempted, for context. */
  pointCount?: number;
}

/**
 * The title and one-paragraph introduction of a tool, plus the convergence
 * warning.
 *
 * A point the solver could not reach is simply absent from the curve, so it has
 * to be reported: silently shortening a diagram is how a wrong conclusion gets
 * drawn from it.
 * @param props - Title, description and convergence report.
 * @returns The header.
 */
export function ToolHeader(props: ToolHeaderProps) {
  const { title, children, errorCount = 0, pointCount } = props;

  return (
    <div className="panel-stack" style={{ marginBottom: 12 }}>
      <div>
        <h2 style={{ margin: '0 0 4px' }}>{title}</h2>
        <div className="prose bp6-text-muted">{children}</div>
      </div>
      {errorCount > 0 ? (
        <Callout intent="warning" icon="warning-sign" compact>
          The solver did not converge on {errorCount}
          {pointCount ? ` of the ${pointCount}` : ''} point
          {errorCount > 1 ? 's' : ''}. Those points are missing from the curve.
          Widening the tolerance or raising the number of iterations usually
          helps.
        </Callout>
      ) : null}
    </div>
  );
}
