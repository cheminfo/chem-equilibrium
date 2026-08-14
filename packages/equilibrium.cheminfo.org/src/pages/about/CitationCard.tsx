import { Button, Card } from '@blueprintjs/core';
import { useState } from 'react';

/** The reference to quote, one line per work being credited. */
const CITATION = [
  'cheminfo. Chemical equilibrium (equilibrium.cheminfo.org). EPFL, Lausanne.',
  'Solver: D. Kostro, M. Zasso, L. Patiny. chem-equilibrium.',
  'https://github.com/cheminfo/chem-equilibrium',
].join('\n');

/**
 * How to cite the site in a course document or a paper.
 * @returns The citation card.
 */
export function CitationCard() {
  const [copied, setCopied] = useState(false);

  return (
    <Card compact>
      <h3 style={HEADING_STYLE}>How to cite</h3>
      <p className="prose" style={{ marginTop: 0 }}>
        Citing the solver alongside the site is what matters: the numbers come
        from it, and it is the part that can be reused elsewhere. When a
        specific constant carries a reference on the Data page, cite that
        reference too.
      </p>
      <pre className="formula bp6-code-block">{CITATION}</pre>
      <Button
        icon={copied ? 'tick' : 'clipboard'}
        text={copied ? 'Copied' : 'Copy the citation'}
        onClick={() => {
          void navigator.clipboard.writeText(CITATION).then(() => {
            setCopied(true);
            globalThis.setTimeout(() => setCopied(false), 2000);
          });
        }}
      />
    </Card>
  );
}

const HEADING_STYLE = { margin: '0 0 8px' } as const;
