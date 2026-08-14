import { Card } from '@blueprintjs/core';

import { EquationText } from '../../components/EquationText.tsx';
import { Species } from '../../components/Species.tsx';

import { WARNED_ENTRIES } from './dataset.ts';

/**
 * What was fixed in the vendored table, and every caveat the entries carry.
 *
 * A correction is only trustworthy if it can be read: each one is listed with
 * what the upstream sheet says, and the warnings below are the ones stored in
 * the database itself.
 * @returns The corrections section.
 */
export function Corrections() {
  return (
    <Card compact>
      <h3 style={{ marginTop: 0 }}>
        Corrections applied to the upstream sheet
      </h3>
      <div className="prose">
        <ul>
          <li>
            <strong>The phosphorous acid chain.</strong> Phosphorous acid is{' '}
            <Species label="H3PO3" withName={false} />, a diprotic acid, not{' '}
            <Species label="H2PO3" withName={false} />. Every label of the chain
            gained the proton it was missing (
            <Species label="H2PO3" withName={false} /> →{' '}
            <Species label="H3PO3" withName={false} />,{' '}
            <Species label="HPO3-" withName={false} /> →{' '}
            <Species label="H2PO3-" withName={false} />,{' '}
            <Species label="PO3--" withName={false} /> →{' '}
            <Species label="HPO3--" withName={false} />) and the two constants
            were replaced: pK 2 became 1.26 and 6.59 became 6.7.
          </li>
          <li>
            <strong>Two charges that made the solid impossible.</strong> In{' '}
            <Species label="Mn(OH)2" withName={false} />, manganese(II) was
            written <code>Mn--</code> and is now{' '}
            <Species label="Mn++" withName={false} />; in{' '}
            <Species label="PbI2" withName={false} />, iodide was written{' '}
            <code>I--</code> and is now <Species label="I-" withName={false} />.
            Both rows summed to a charged neutral solid.
          </li>
          <li>
            <strong>Six missing ligand counts.</strong> The ethylenediamine
            complexes listed a single ligand although their formula carries two
            or three, which turned a cumulative constant into a 1:1 one. The
            counts were restored, so these constants are read as β₃ (β₂ for{' '}
            <Species label="Cu(C2H8N2)2++" withName={false} />
            ).
          </li>
        </ul>
      </div>

      <h4>Entries to treat with caution</h4>
      <div className="scroll-x">
        <table className="data-table bp6-html-table bp6-compact bp6-html-table-striped">
          <thead>
            <tr>
              <th>Equilibrium</th>
              <th>Warning</th>
            </tr>
          </thead>
          <tbody>
            {WARNED_ENTRIES.map((entry) => (
              <tr key={entry.formed}>
                <td>
                  <EquationText equation={entry} />
                </td>
                <td style={{ whiteSpace: 'normal' }}>{entry.warning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
