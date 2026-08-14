import { Callout, Card } from '@blueprintjs/core';
import type { CSSProperties } from 'react';

import { PROCEDURE_STEPS } from '../../../data/exercises.ts';

/**
 * The closed form for an acid water levels completely.
 * @returns `pH = −log C`, readable by a screen reader.
 */
export function StrongAcidFormula() {
  return (
    <span role="math" aria-label="pH equals minus the logarithm of C">
      <span aria-hidden="true" style={rowStyle}>
        pH = −log C
      </span>
    </span>
  );
}

/**
 * The closed form for an acid that is only partly dissociated.
 * @returns `pH = (pKa − log C) / 2`, drawn as a fraction.
 */
export function WeakAcidFormula() {
  return (
    <span
      role="math"
      aria-label="pH equals pKa minus the logarithm of C, the whole divided by two"
    >
      <span aria-hidden="true" style={rowStyle}>
        <span>pH =</span>
        <span style={fractionStyle}>
          <span style={numeratorStyle}>
            pK<sub>a</sub> − log C
          </span>
          <span style={denominatorStyle}>2</span>
        </span>
      </span>
    </span>
  );
}

/**
 * The reference panel: what to do, and the two formulas to do it with.
 * @returns The card shown next to the questions.
 */
export function PhFormulasCard() {
  return (
    <Card compact>
      <h3 style={{ marginTop: 0 }}>The two formulas</h3>
      <p className="bp6-text-muted" style={{ marginTop: 0 }}>
        An acid <em>HA</em> in water gives up its proton: HA ⇄ H<sup>+</sup> + A
        <sup>−</sup>. How far it goes decides which formula applies.
      </p>
      <div style={formulaGridStyle}>
        <div style={formulaCellStyle}>
          <div className="bp6-text-muted">For a strong acid</div>
          <div style={formulaSlotStyle}>
            <StrongAcidFormula />
          </div>
        </div>
        <div style={formulaCellStyle}>
          <div className="bp6-text-muted">For a weak acid</div>
          <div style={formulaSlotStyle}>
            <WeakAcidFormula />
          </div>
        </div>
      </div>
      <Callout compact icon="learning" style={{ marginTop: 12 }}>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {PROCEDURE_STEPS.map((step) => (
            <li key={step} style={{ lineHeight: 1.5 }}>
              {step}
            </li>
          ))}
        </ol>
      </Callout>
    </Card>
  );
}

const rowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 18,
  lineHeight: 1.4,
};

const fractionStyle: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  verticalAlign: 'middle',
};

const numeratorStyle: CSSProperties = {
  padding: '0 8px 2px',
  borderBottom: '1px solid currentcolor',
};

const denominatorStyle: CSSProperties = {
  padding: '2px 8px 0',
};

const formulaGridStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 32,
  marginTop: 8,
};

const formulaCellStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const formulaSlotStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minHeight: 54,
};
