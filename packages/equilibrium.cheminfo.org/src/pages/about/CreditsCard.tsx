import { Card } from '@blueprintjs/core';

interface Person {
  name: string;
  /** What they contributed, in one line. */
  role: string;
}

interface Dependency {
  name: string;
  href: string;
  /** What the site uses it for. */
  role: string;
}

/**
 * Who wrote the underlying work, and which open-source projects it stands on.
 * @returns The credits card.
 */
export function CreditsCard() {
  return (
    <Card compact>
      <h3 style={HEADING_STYLE}>Credits</h3>
      <ul className="prose" style={LIST_STYLE}>
        {PEOPLE.map((person) => (
          <li key={person.name} style={ITEM_STYLE}>
            <strong>{person.name}</strong> — {person.role}
          </li>
        ))}
      </ul>

      <h3 style={HEADING_STYLE}>Built on</h3>
      <p className="prose" style={{ marginTop: 0 }}>
        Every part of this site is open source, and so is everything it borrows.
      </p>
      <ul className="prose" style={LIST_STYLE}>
        {STACK.map((entry) => (
          <li key={entry.name} style={ITEM_STYLE}>
            <a href={entry.href} target="_blank" rel="noopener">
              {entry.name}
            </a>{' '}
            — {entry.role}
          </li>
        ))}
      </ul>
    </Card>
  );
}

const PEOPLE: Person[] = [
  {
    name: 'Daniel Kostro',
    role: 'wrote the original chem-equilibrium solver, the numerical core every page here runs on.',
  },
  {
    name: 'Michaël Zasso',
    role: 'maintains the cheminfo tooling this site is built on, and keeps the solver package current.',
  },
  {
    name: 'Luc Patiny',
    role: 'maintains the cheminfo tooling this site is built on, and curates the equilibrium database.',
  },
  {
    name: 'Régis Turin',
    role: 'shaped the teaching material — the exercises and the worked examples — and reviewed the equilibrium data they rest on.',
  },
];

const STACK: Dependency[] = [
  {
    name: 'chem-equilibrium',
    href: 'https://github.com/cheminfo/chem-equilibrium',
    role: 'the solver itself: it builds the mass-balance system and finds its root.',
  },
  {
    name: 'ml-matrix',
    href: 'https://github.com/mljs/matrix',
    role: 'the linear algebra each Newton step is solved with.',
  },
  {
    name: 'react-mf',
    href: 'https://github.com/cheminfo/react-mf',
    role: 'typesets every molecular formula on the site, charges and subscripts included.',
  },
  {
    name: 'mf-parser',
    href: 'https://github.com/cheminfo/mass-tools',
    role: 'reads those formulas, and is what react-mf renders from.',
  },
  {
    name: 'BlueprintJS',
    href: 'https://blueprintjs.com/',
    role: 'the interface components — cards, inputs, tables and dialogs.',
  },
  {
    name: 'nivo',
    href: 'https://nivo.rocks/',
    role: 'draws the speciation diagrams and the titration curves.',
  },
  {
    name: 'React',
    href: 'https://react.dev/',
    role: 'the component model the pages are written in.',
  },
  {
    name: 'Vite',
    href: 'https://vite.dev/',
    role: 'builds and serves the static site.',
  },
];

const HEADING_STYLE = { margin: '0 0 8px' } as const;
const LIST_STYLE = { margin: '0 0 16px', paddingLeft: '1.2rem' } as const;
const ITEM_STYLE = { marginBottom: 4 } as const;
