import { AnchorButton, Tab, Tabs } from '@blueprintjs/core';
import type { ReactElement } from 'react';

import { ShareLink } from './components/ShareLink.tsx';
import { AboutPage } from './pages/About.tsx';
import { DataPage } from './pages/Data.tsx';
import { HomePage } from './pages/Home.tsx';
import { HowItWorksPage } from './pages/HowItWorks.tsx';
import { AcidBaseTool } from './pages/tools/AcidBaseTool.tsx';
import { EquilibriumTool } from './pages/tools/EquilibriumTool.tsx';
import { ExercisesTool } from './pages/tools/ExercisesTool.tsx';
import { PhCalculatorTool } from './pages/tools/PhCalculatorTool.tsx';
import { PrecipitationTool } from './pages/tools/PrecipitationTool.tsx';
import { TitrationTool } from './pages/tools/TitrationTool.tsx';
import { navigate } from './router/location.ts';
import { useHashLocation } from './router/useHashLocation.ts';
import type { RoutePath } from './routes.ts';
import { ROUTES, isRoutePath } from './routes.ts';

const PAGES: Record<RoutePath, () => ReactElement> = {
  '/': HomePage,
  '/ph': PhCalculatorTool,
  '/titration': TitrationTool,
  '/speciation': AcidBaseTool,
  '/precipitation': PrecipitationTool,
  '/equilibrium': EquilibriumTool,
  '/exercises': ExercisesTool,
  '/how-it-works': HowItWorksPage,
  '/data': DataPage,
  '/about': AboutPage,
};

/**
 * The shell: a tab bar over the ten pages, and the page itself.
 *
 * Navigation goes through the hash, so every page — and every configuration of
 * every tool — is a link that can be sent to a class.
 * @returns The application.
 */
export function App() {
  const { path } = useHashLocation();
  const active: RoutePath = isRoutePath(path) ? path : '/';
  const Page = PAGES[active];

  return (
    <div className="app">
      <header className="app-header bp6-navbar no-print">
        <h1>Chemical equilibrium</h1>
        <div className="app-header-tabs">
          <Tabs
            id="pages"
            selectedTabId={active}
            onChange={(next) => navigate(String(next))}
            renderActiveTabPanelOnly
          >
            {ROUTES.map((route) => (
              <Tab key={route.path} id={route.path} title={route.label} />
            ))}
          </Tabs>
        </div>
        <div className="app-header-actions">
          <ShareLink />
          <AnchorButton
            icon="git-repo"
            text="Source"
            variant="minimal"
            href="https://github.com/cheminfo/chem-equilibrium"
            target="_blank"
            rel="noopener"
          />
        </div>
      </header>

      <main className="app-main">
        <Page />
      </main>

      <footer className="app-footer bp6-text-muted no-print">
        Built at EPFL with the open-source{' '}
        <a
          href="https://www.npmjs.com/package/chem-equilibrium"
          target="_blank"
          rel="noopener"
        >
          chem-equilibrium
        </a>{' '}
        solver.
      </footer>
    </div>
  );
}
