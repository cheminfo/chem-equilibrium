import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import Papa from 'papaparse';

const DATABASE_URL =
  'https://googledocs.cheminfo.org/spreadsheets/d/1VjfiuDtJUqxdfyFr7DdVcIM-l3eh47SqanafHdbXvDQ/export?format=tsv';

const response = await fetch(DATABASE_URL);
if (!response.ok) {
  throw new Error(
    `could not download the database: ${response.status} ${response.statusText}`,
  );
}

const parsed = Papa.parse(await response.text(), {
  header: true,
  delimiter: '\t',
  dynamicTyping: true,
});

const SPECIE = /\s*(?<coefficient>\d*)\s*(?<formula>.*)/;

let data = parsed.data.filter((d) => d.Active !== 'no');
for (const d of data) {
  let m = SPECIE.exec(d.A);
  d.sA = m.groups.formula.trim();
  d.nA = m.groups.coefficient || 1;
  m = SPECIE.exec(d.B);
  d.sB = m.groups.formula.trim();
  d.nB = m.groups.coefficient || 1;
  m = SPECIE.exec(d.AB);
  d.sAB = m.groups.formula.trim();
  d.nAB = m.groups.coefficient || 1;
  d.nA /= d.nAB;
  d.nB /= d.nAB;
  d.nAB = 1;
}

data = processData(data);
writeFileSync(
  join(import.meta.dirname, 'data.json'),
  `${JSON.stringify(data, null, 2)}\n`,
);

function processData(rows) {
  return rows.map((d) => {
    const type = /complex/i.test(d.type) ? 'complexation' : d.type;
    if (d.nAB !== 1) {
      throw new Error('Product cannot have a stoechiometric coefficient');
    }
    return {
      formed: d.AB,
      components: {
        [d.sA]: d.nA,
        [d.sB]: d.nB,
      },
      pK: d.pk,
      type,
    };
  });
}
