import { Callout, Card } from '@blueprintjs/core';

import {
  ENTRY_COUNT,
  MISSING_SOURCE_COUNT,
  MISSING_TEMPERATURE_COUNT,
  SPECIES_ROWS,
  TYPES_WITHOUT_SOURCE,
  TYPES_WITHOUT_TEMPERATURE,
  joinTypeLabels,
} from './dataset.ts';

const CONSTANTS_SHEET =
  'https://docs.google.com/spreadsheets/d/1VjfiuDtJUqxdfyFr7DdVcIM-l3eh47SqanafHdbXvDQ';
const INDICATORS_SHEET =
  'https://docs.google.com/spreadsheets/d/1gTa_Sd4rdoZAs-G08PPf6LtM954vp_QHio9m0mYNamU';

/**
 * Where every number of the site comes from, and what it is missing.
 * @returns The provenance section.
 */
export function Provenance() {
  return (
    <Card compact>
      <h3 style={{ marginTop: 0 }}>Where these numbers come from</h3>
      <div className="prose">
        <p>
          Two tables are maintained as Google spreadsheets: the{' '}
          <a href={CONSTANTS_SHEET} target="_blank" rel="noopener noreferrer">
            formation constants
          </a>{' '}
          ({ENTRY_COUNT} equilibria over {SPECIES_ROWS.length} species) and the{' '}
          <a href={INDICATORS_SHEET} target="_blank" rel="noopener noreferrer">
            pH indicators
          </a>{' '}
          used by the titration tool.
        </p>
        <p>
          Both are vendored in the repository —{' '}
          <code>packages/chem-equilibrium/data/formation-constants.tsv</code>{' '}
          and{' '}
          <code>packages/equilibrium.cheminfo.org/data/ph-indicators.tsv</code>{' '}
          — and{' '}
          <strong>
            the repository, not the spreadsheet, is the source of truth
          </strong>
          . The vendored table carries corrections that were never applied
          upstream, so regenerating from the sheet would silently undo them.{' '}
          <code>npm run database</code> rebuilds the bundled modules from the
          vendored tables; run with <code>--fetch</code> it also downloads the
          sheet and reports how it differs, without overwriting anything.
        </p>
      </div>

      <Callout intent="warning" icon="issue" compact>
        <strong>What is missing.</strong> {MISSING_SOURCE_COUNT} of the{' '}
        {ENTRY_COUNT} equilibria carry no literature reference and{' '}
        {MISSING_TEMPERATURE_COUNT} carry no temperature, and the gaps are not
        spread evenly.
        {TYPES_WITHOUT_SOURCE.length > 0
          ? ` Not one ${joinTypeLabels(TYPES_WITHOUT_SOURCE)} constant cites a source.`
          : ''}
        {TYPES_WITHOUT_TEMPERATURE.length > 0
          ? ` Not one ${joinTypeLabels(TYPES_WITHOUT_TEMPERATURE)} constant records a temperature.`
          : ''}{' '}
        No ionic strength is recorded anywhere in the table, and the solver
        works on concentrations rather than activities, so a computed pH may sit
        a few tenths away from a measured one in a salty solution. The rows are
        shown as they are, gaps included: an empty cell reads “not documented”,
        never a plausible number.
      </Callout>
    </Card>
  );
}
