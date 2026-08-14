import { Callout } from '@blueprintjs/core';

/**
 * How one column of pK values becomes three different constants.
 *
 * This is the single most confusing thing about the table: every equilibrium is
 * stored as a formation, so one number carries three names depending on what is
 * being formed.
 * @returns The legend.
 */
export function ConstantLegend() {
  return (
    <Callout intent="primary" icon="learning" compact>
      <p style={{ marginBottom: 4 }}>
        Every equilibrium is stored the same way — a species is <em>formed</em>{' '}
        from its components — so a single <strong>pK</strong> column serves the
        three families, read under the name each one uses:
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <strong>acid/base</strong>: the acid is formed from its base and a
          proton, so pK is the <strong>pKa</strong> of the couple and{' '}
          <strong>Ka = 10⁻ᵖᴷ</strong>.
        </li>
        <li>
          <strong>precipitation</strong>: the solid is formed from its ions, so
          pK is <strong>pKs</strong> and the solubility product is{' '}
          <strong>Ksp = 10⁻ᵖᴷ</strong> — the constant of the reverse,
          dissolution reaction.
        </li>
        <li>
          <strong>complexation</strong>: the complex is formed from the metal
          and its ligands, so pK is <strong>log β</strong>, a cumulative
          formation constant, and <strong>β = 10ᵖᴷ</strong>.
        </li>
      </ul>
    </Callout>
  );
}
