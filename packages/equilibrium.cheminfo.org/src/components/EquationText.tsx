import type { EquationData } from 'chem-equilibrium';
import { Fragment } from 'react';

import { Species } from './Species.tsx';

interface EquationTextProps {
  equation: Pick<EquationData, 'formed' | 'components'>;
}

/**
 * Render an equilibrium as `HCO3- ⇄ CO3-- + H+`, with typeset formulas.
 *
 * A negative coefficient means the component is released rather than consumed,
 * which is how the solver writes `OH-` as `-1 H+`; it is shown on the other
 * side of the arrow so the equation reads the way a chemist writes it.
 * @param props - The equilibrium to render.
 * @returns The typeset equation.
 */
export function EquationText(props: EquationTextProps) {
  const { formed, components } = props.equation;
  const entries = Object.entries(components);
  const consumed = entries.filter(([, coefficient]) => coefficient > 0);
  const released = entries.filter(([, coefficient]) => coefficient < 0);

  return (
    <span className="equation">
      <Species label={formed} />
      {released.map(([label, coefficient]) => (
        <Fragment key={`released-${label}`}>
          <span>+</span>
          <Term label={label} coefficient={-coefficient} />
        </Fragment>
      ))}
      <span>⇄</span>
      {consumed.length === 0 ? <span>—</span> : null}
      {consumed.map(([label, coefficient], index) => (
        <Fragment key={`consumed-${label}`}>
          {index > 0 ? <span>+</span> : null}
          <Term label={label} coefficient={coefficient} />
        </Fragment>
      ))}
    </span>
  );
}

function Term({ label, coefficient }: { label: string; coefficient: number }) {
  return (
    <span>
      {coefficient === 1 ? null : `${formatCoefficient(coefficient)} `}
      <Species label={label} />
    </span>
  );
}

function formatCoefficient(coefficient: number): string {
  return Number.isInteger(coefficient)
    ? String(coefficient)
    : coefficient.toFixed(2);
}
