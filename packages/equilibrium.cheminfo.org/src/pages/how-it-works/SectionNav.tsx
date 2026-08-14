import { Card } from '@blueprintjs/core';

import type { SectionId } from './sections.ts';
import { HOW_SECTIONS } from './sections.ts';

interface SectionNavProps {
  current: SectionId;
  onSelect: (id: SectionId) => void;
}

/**
 * The table of contents, pinned beside the text on a wide screen and folded
 * above it on a narrow one.
 *
 * It is a list of buttons rather than anchors because the whole site lives in
 * the hash, where an `#anchor` would be read as a route.
 * @param props - The current section and what to do when another is picked.
 * @returns The navigation.
 */
export function SectionNav(props: SectionNavProps) {
  const { current, onSelect } = props;

  return (
    <Card
      className="no-print"
      style={{
        padding: 8,
        position: 'sticky',
        top: 8,
        maxHeight: 'calc(100vh - 24px)',
        overflowY: 'auto',
      }}
    >
      <div
        className="bp6-text-small bp6-text-muted"
        style={{ padding: '4px 8px' }}
      >
        The algorithm, in ten steps
      </div>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {HOW_SECTIONS.map((section, index) => (
          <li key={section.id} style={{ flex: '1 1 200px' }}>
            <button
              type="button"
              className={`bp6-button bp6-minimal bp6-fill bp6-align-left${
                section.id === current ? ' bp6-active bp6-intent-primary' : ''
              }`}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => onSelect(section.id)}
            >
              <span className="bp6-button-text">
                <span className="bp6-text-muted">{index + 1}.</span>{' '}
                {section.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
