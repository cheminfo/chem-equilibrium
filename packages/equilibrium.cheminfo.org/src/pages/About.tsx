import { AnchorButton, Button, Card } from '@blueprintjs/core';

import { Logo } from '../components/Logo.tsx';
import { navigate } from '../router/location.ts';

import { CitationCard } from './about/CitationCard.tsx';
import { CreditsCard } from './about/CreditsCard.tsx';

const REPOSITORY = 'https://github.com/cheminfo/chem-equilibrium';

/**
 * What the site is, who made it, what it is built on, and how to cite it.
 * @returns The about page.
 */
export function AboutPage() {
  return (
    <div className="panel-stack">
      <Card compact>
        <div style={INTRO_STYLE}>
          <div className="prose">
            <h2 className="wordmark" style={{ margin: '0 0 8px' }}>
              <Logo size={32} />
              <span>
                <span className="wordmark-name">equilibrium</span>
                <span className="wordmark-domain">.cheminfo.org</span>
              </span>
            </h2>
            <p style={{ marginTop: 0 }}>
              A teaching site for chemical equilibrium, developed at EPFL. It
              solves acid/base, complexation and precipitation systems exactly —
              every equilibrium at once, water autoprotolysis included — and
              renders the result as diagrams, curves and numbers a course can be
              built on.
            </p>
            <p>
              It replaces six separate cheminfo visualizer tools — the pH
              calculator, the titration curve, the acid/base speciation diagram,
              the precipitation diagram, the general equilibrium sweep and the
              pH exercise drill. They are now one application, sharing a single
              solver, a single database, and URLs that carry the whole
              configuration of what is on screen.
            </p>
            <p style={{ marginBottom: 0 }}>
              It runs entirely in the browser. No account, no server, no data
              leaving the machine.
            </p>
          </div>

          <a
            href="https://www.epfl.ch"
            target="_blank"
            rel="noopener"
            style={LOGO_LINK_STYLE}
          >
            <img
              src="/epfl-logo.svg"
              alt="EPFL — École polytechnique fédérale de Lausanne"
              width={120}
              style={LOGO_STYLE}
            />
          </a>
        </div>
      </Card>

      <CreditsCard />

      <Card compact>
        <h3 style={HEADING_STYLE}>Licence and source</h3>
        <p className="prose" style={{ marginTop: 0 }}>
          The site and the solver are released under the <strong>MIT</strong>{' '}
          licence: use them in a course, fork them, or lift a piece of them into
          something else. Corrections to a constant or to an explanation are
          welcome as issues or pull requests.
        </p>
        <AnchorButton
          icon="git-repo"
          text="cheminfo/chem-equilibrium"
          href={REPOSITORY}
          target="_blank"
          rel="noopener"
        />
      </Card>

      <Card compact>
        <h3 style={HEADING_STYLE}>Where the data comes from</h3>
        <p className="prose" style={{ marginTop: 0 }}>
          Every equilibrium constant used by the tools is bundled with the site
          and listed on the Data page, together with the equilibrium it belongs
          to, the temperature it was measured at, and the reference it was taken
          from. Nothing is fetched at run time, so a diagram drawn today is the
          same one a student redraws next year.
        </p>
        <Button
          icon="database"
          text="Open the Data page"
          onClick={() => navigate('/data')}
        />
      </Card>

      <CitationCard />
    </div>
  );
}

const HEADING_STYLE = { margin: '0 0 8px' } as const;

const INTRO_STYLE = {
  display: 'flex',
  gap: 'var(--gap)',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
} as const;

const LOGO_LINK_STYLE = {
  flex: '0 0 auto',
  display: 'inline-block',
  // The mark is red on transparent, so it needs its own ground to stay
  // readable on a dark theme.
  background: '#ffffff',
  borderRadius: 3,
  padding: 8,
} as const;

const LOGO_STYLE = { display: 'block', width: 120, height: 'auto' } as const;
