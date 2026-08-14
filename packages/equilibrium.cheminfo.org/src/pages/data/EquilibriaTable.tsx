import type { IconName } from '@blueprintjs/core';
import { Button, Icon, Tag, Tooltip } from '@blueprintjs/core';
import type { DatabaseEntry } from 'chem-equilibrium';

import { formatPK } from '../../chemistry/format.ts';
import { EquationText } from '../../components/EquationText.tsx';

import { TYPE_LABELS, derivedConstant } from './dataset.ts';
import type { DataSort } from './state.ts';

interface EquilibriaTableProps {
  entries: DatabaseEntry[];
  sort: DataSort;
  descending: boolean;
  onSortChange: (sort: DataSort, descending: boolean) => void;
}

/**
 * The whole formation-constant table, one line per equilibrium.
 * @param props - The equilibria to show and the current ordering.
 * @returns The table.
 */
export function EquilibriaTable(props: EquilibriaTableProps) {
  const { entries, sort, descending, onSortChange } = props;

  if (entries.length === 0) {
    return (
      <p className="bp6-text-muted">
        No equilibrium matches the search. Try a formula (<code>CO3--</code>), a
        name (carbonate) or clear the type filter.
      </p>
    );
  }

  return (
    <div className="scroll-x">
      <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
        <thead>
          <tr>
            <th>
              <SortHeader
                label="Equilibrium"
                column="formed"
                sort={sort}
                descending={descending}
                onSortChange={onSortChange}
              />
            </th>
            <th className="numeric">
              <SortHeader
                label="pK"
                column="pK"
                sort={sort}
                descending={descending}
                onSortChange={onSortChange}
              />
            </th>
            <th>Reads as</th>
            <th>Constant</th>
            <th>Type</th>
            <th className="numeric">Temperature</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <EquilibriumRow key={entry.formed} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EquilibriumRow({ entry }: { entry: DatabaseEntry }) {
  const constant = derivedConstant(entry);

  return (
    <tr>
      <td>
        <EquationText equation={entry} />
        {entry.warning ? (
          <Tooltip content={entry.warning} compact>
            <Icon
              icon="warning-sign"
              intent="warning"
              size={12}
              style={{ marginLeft: 6 }}
              aria-label={`Warning: ${entry.warning}`}
            />
          </Tooltip>
        ) : null}
      </td>
      <td className="numeric">{formatPK(entry.pK)}</td>
      <td className="bp6-text-muted">{constant.pName}</td>
      <td>
        {constant.name} = {constant.value}
      </td>
      <td>
        <Tag minimal intent={INTENTS[entry.type]}>
          {TYPE_LABELS[entry.type]}
        </Tag>
        {entry.subType ? (
          <Tag minimal style={{ marginLeft: 4 }}>
            {entry.subType}
          </Tag>
        ) : null}
      </td>
      <td className="numeric">
        {entry.temperature === undefined ? (
          <span className="bp6-text-muted">not documented</span>
        ) : (
          `${entry.temperature} K`
        )}
      </td>
      <td>
        <SourceCell source={entry.source} />
      </td>
    </tr>
  );
}

function SourceCell({ source }: { source: string | undefined }) {
  if (!source) {
    return <span className="bp6-text-muted">not documented</span>;
  }
  const host = hostOf(source);
  if (!host) return <span>{source}</span>;
  return (
    <Tooltip content={source} compact>
      <a href={source} target="_blank" rel="noopener noreferrer">
        {host}
      </a>
    </Tooltip>
  );
}

function SortHeader(props: {
  label: string;
  column: Exclude<DataSort, 'table'>;
  sort: DataSort;
  descending: boolean;
  onSortChange: (sort: DataSort, descending: boolean) => void;
}) {
  const { label, column, sort, descending, onSortChange } = props;
  const active = sort === column;

  return (
    <Button
      variant="minimal"
      size="small"
      text={label}
      endIcon={sortIcon(active, descending)}
      onClick={() => onSortChange(column, active ? !descending : false)}
    />
  );
}

function sortIcon(active: boolean, descending: boolean): IconName {
  if (!active) return 'double-caret-vertical';
  return descending ? 'caret-down' : 'caret-up';
}

function hostOf(source: string): string | null {
  try {
    return new URL(source).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

const INTENTS = {
  acidoBasic: 'primary',
  complexation: 'success',
  precipitation: 'warning',
} as const;
