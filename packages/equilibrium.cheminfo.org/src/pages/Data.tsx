import { Button, Card, SegmentedControl } from '@blueprintjs/core';
import { useMemo, useState } from 'react';

import { matchesSpecies } from '../chemistry/species.ts';
import { ToolHeader } from '../components/ToolHeader.tsx';
import { useToolState } from '../router/useToolState.ts';

import { ConstantLegend } from './data/ConstantLegend.tsx';
import { Corrections } from './data/Corrections.tsx';
import { DataFilters } from './data/DataFilters.tsx';
import { EquilibriaTable } from './data/EquilibriaTable.tsx';
import { Provenance } from './data/Provenance.tsx';
import { SpeciesTable } from './data/SpeciesTable.tsx';
import { TsvDialog } from './data/TsvDialog.tsx';
import { EQUILIBRIA, SPECIES_ROWS, matchesEntry } from './data/dataset.ts';
import type { DataSort, DataTab } from './data/state.ts';
import { DATA_CODEC, DEFAULT_DATA_STATE } from './data/state.ts';
import { equilibriaToTsv, speciesToTsv } from './data/tsv.ts';

/**
 * The whole bundled database, searchable, with where each number comes from.
 *
 * Nothing here is computed: this is what the tools read, shown as it is stored,
 * so a teacher can check a constant before building a lesson on it.
 * @returns The data page.
 */
export function DataPage() {
  const [state, update] = useToolState('/data', DEFAULT_DATA_STATE, DATA_CODEC);
  const [tsvOpen, setTsvOpen] = useState(false);
  const { tab, query, types, sort, descending } = state;

  const entries = useMemo(() => {
    const kept = EQUILIBRIA.filter(
      (entry) =>
        (types.length === 0 || types.includes(entry.type)) &&
        matchesEntry(entry, query),
    );
    const sorted =
      sort === 'table'
        ? kept
        : kept.toSorted((a, b) =>
            sort === 'pK' ? a.pK - b.pK : a.formed.localeCompare(b.formed),
          );
    return descending ? sorted.toReversed() : sorted;
  }, [query, types, sort, descending]);

  const withoutSource = useMemo(
    () => entries.filter((entry) => !entry.source).length,
    [entries],
  );

  const species = useMemo(
    () => SPECIES_ROWS.filter((row) => matchesSpecies(row.label, query)),
    [query],
  );

  const tsv = useMemo(
    () =>
      tab === 'species'
        ? speciesToTsv(SPECIES_ROWS)
        : equilibriaToTsv(EQUILIBRIA),
    [tab],
  );

  return (
    <div className="panel-stack">
      <ToolHeader title="The database">
        Every constant the tools use is listed here, with the equilibrium it
        belongs to, the temperature it was measured at and the reference it was
        taken from. Search matches formulas, English names and synonyms alike.
      </ToolHeader>

      <Card compact>
        <div
          className="no-print"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <SegmentedControl
            value={tab}
            options={[
              {
                label: `Equilibria (${EQUILIBRIA.length})`,
                value: 'equilibria',
              },
              { label: `Species (${SPECIES_ROWS.length})`, value: 'species' },
            ]}
            onValueChange={(value) => update({ tab: asTab(value) })}
          />
          <Button
            variant="minimal"
            icon="clipboard"
            text="Copy as TSV"
            style={{ marginLeft: 'auto' }}
            onClick={() => setTsvOpen(true)}
          />
        </div>

        {tab === 'equilibria' ? (
          <div className="panel-stack">
            <ConstantLegend />
            <DataFilters
              query={query}
              onQueryChange={(next) => update({ query: next })}
              types={types}
              onTypesChange={(next) => update({ types: next })}
              shown={entries.length}
              total={EQUILIBRIA.length}
              noun="equilibria"
              missingSource={withoutSource}
            />
            <EquilibriaTable
              entries={entries}
              sort={sort}
              descending={descending}
              onSortChange={(nextSort: DataSort, nextDescending: boolean) =>
                update({ sort: nextSort, descending: nextDescending })
              }
            />
          </div>
        ) : (
          <div className="panel-stack">
            <DataFilters
              query={query}
              onQueryChange={(next) => update({ query: next })}
              shown={species.length}
              total={SPECIES_ROWS.length}
              noun="species"
            />
            <SpeciesTable
              rows={species}
              onShowEquilibria={(label) =>
                update({ tab: 'equilibria', query: label, types: [] })
              }
            />
          </div>
        )}
      </Card>

      <Provenance />
      <Corrections />

      <TsvDialog
        isOpen={tsvOpen}
        onClose={() => setTsvOpen(false)}
        title={tab === 'species' ? 'Species table' : 'Formation constants'}
        tsv={tsv}
        rowCount={tab === 'species' ? SPECIES_ROWS.length : EQUILIBRIA.length}
      />
    </div>
  );
}

function asTab(value: string): DataTab {
  return value === 'species' ? 'species' : 'equilibria';
}
