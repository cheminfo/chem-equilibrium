import { DEFAULT_SETTINGS } from '../../chemistry/solve.ts';
import { ACID_BASE_SPECIES } from '../../chemistry/species.ts';
import { SpeciationWorkbench } from '../../components/SpeciationWorkbench.tsx';
import { Species } from '../../components/Species.tsx';
import type { WorkbenchPreset } from '../../components/workbenchPreset.ts';

const PRESET: WorkbenchPreset = {
  path: '/speciation',
  title: 'Acid/base speciation',
  available: ACID_BASE_SPECIES,
  description: (
    <p>
      Every acid/base species of the mixture, plotted against pH. The pH is{' '}
      <strong>imposed</strong> at each point: the solver pins the free{' '}
      <Species label="H+" /> concentration and lets the rest of the system find
      its equilibrium. So this is a distribution diagram, not a titration —
      nothing is being added to the beaker, and the abscissa is a condition, not
      a volume. The curves show which form of a couple dominates at each pH, and
      they cross at the p<i>K</i>.
    </p>
  ),
  note: 'The pH is swept from 0 to 14, with the free proton concentration imposed at each point.',
  defaults: {
    species: [{ label: 'CO3--', quantity: 0.1 }],
    disabled: [],
    varying: 'H+',
    isFixed: true,
    log: true,
    from: 0,
    to: 14,
    logY: false,
    ...DEFAULT_SETTINGS,
  },
};

/**
 * Distribution diagram of an acid/base mixture against an imposed pH.
 * @returns The page.
 */
export function AcidBaseTool() {
  return <SpeciationWorkbench preset={PRESET} />;
}
