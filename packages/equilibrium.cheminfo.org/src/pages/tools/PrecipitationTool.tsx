import { ALL_SPECIES } from '../../chemistry/species.ts';
import { SpeciationWorkbench } from '../../components/SpeciationWorkbench.tsx';
import { Species } from '../../components/Species.tsx';
import type { WorkbenchPreset } from '../../components/workbenchPreset.ts';

const PRESET: WorkbenchPreset = {
  path: '/precipitation',
  title: 'Precipitation and complexation',
  available: ALL_SPECIES,
  withType: true,
  markSolids: true,
  description: (
    <p>
      The same imposed-pH sweep, over the whole database: acid/base couples,
      complexes and solid phases together. The default is the silver/ammonia
      exercise — <Species label="Ag+" /> at 0.01 M with <Species label="NH3" />{' '}
      at 0.1 M. Ticking <em>Ignore</em> on the <Species label="Ag(NH3)2+" /> row
      removes the diammine complex from the model, and solid{' '}
      <Species label="AgOH" /> then appears several pH units earlier: the
      complex is what holds the silver in solution. That contrast is the lesson.
      Solid phases are marked <code>(s)</code> in the legend and read in their
      own table — a solid is an amount of matter that has left the solution, not
      a concentration.
    </p>
  ),
  note: 'The pH is swept from 0 to 14 over 501 points, with the free proton concentration imposed at each of them.',
  defaults: {
    species: [
      { label: 'Ag+', quantity: 0.01 },
      { label: 'NH3', quantity: 0.1 },
    ],
    disabled: [],
    varying: 'H+',
    isFixed: true,
    log: true,
    from: 0,
    to: 14,
    logY: false,
    tolerance: 1e-15,
    solidTolerance: 1e-10,
    maxIterations: 200,
    chunks: 500,
  },
};

/**
 * Speciation against an imposed pH, including complexes and solid phases.
 * @returns The page.
 */
export function PrecipitationTool() {
  return <SpeciationWorkbench preset={PRESET} />;
}
