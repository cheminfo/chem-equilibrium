import { Button, Tag } from '@blueprintjs/core';

import { Species } from '../../components/Species.tsx';

import type { SpeciesRow } from './dataset.ts';
import { formatCharge } from './dataset.ts';

interface SpeciesTableProps {
  rows: SpeciesRow[];
  /** Show the equilibria a species takes part in, on the other tab. */
  onShowEquilibria: (label: string) => void;
}

/**
 * Every species the database knows, with its name, its synonyms and its role.
 * @param props - The species to show.
 * @returns The table.
 */
export function SpeciesTable(props: SpeciesTableProps) {
  const { rows, onShowEquilibria } = props;

  if (rows.length === 0) {
    return (
      <p className="bp6-text-muted">
        No species matches the search. Formulas are written the way the source
        table writes them, so carbonate is <code>CO3--</code>.
      </p>
    );
  }

  return (
    <div className="scroll-x">
      <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
        <thead>
          <tr>
            <th>Species</th>
            <th>Name</th>
            <th>Synonyms</th>
            <th className="numeric">Charge</th>
            <th className="numeric">Equilibria</th>
            <th>Role</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <SpeciesRowView
              key={row.label}
              row={row}
              onShowEquilibria={onShowEquilibria}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpeciesRowView(props: {
  row: SpeciesRow;
  onShowEquilibria: (label: string) => void;
}) {
  const { row, onShowEquilibria } = props;
  const total = row.formedIn + row.componentIn;

  return (
    <tr>
      <td>
        <Species label={row.label} withName={false} />
      </td>
      <td>
        {row.name ?? <span className="bp6-text-muted">not documented</span>}
      </td>
      <td style={{ whiteSpace: 'normal', maxWidth: 320 }}>
        {row.alternatives.length > 0 ? (
          row.alternatives.join(', ')
        ) : (
          <span className="bp6-text-muted">—</span>
        )}
      </td>
      <td className="numeric">{formatCharge(row.charge)}</td>
      <td className="numeric">{total}</td>
      <td>
        {row.formedIn > 0 ? (
          <Tag minimal intent="primary">
            formed in {row.formedIn}
          </Tag>
        ) : null}
        {row.componentIn > 0 ? (
          <Tag minimal style={{ marginLeft: 4 }}>
            component in {row.componentIn}
          </Tag>
        ) : null}
      </td>
      <td className="no-print">
        <Button
          variant="minimal"
          size="small"
          endIcon="arrow-right"
          text="Equilibria"
          aria-label={`Show the equilibria involving ${row.label}`}
          onClick={() => onShowEquilibria(row.label)}
        />
      </td>
    </tr>
  );
}
