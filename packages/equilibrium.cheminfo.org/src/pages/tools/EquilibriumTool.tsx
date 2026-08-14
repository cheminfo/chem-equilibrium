import { DEFAULT_SETTINGS } from '../../chemistry/solve.ts';
import { ALL_SPECIES } from '../../chemistry/species.ts';
import { SpeciationWorkbench } from '../../components/SpeciationWorkbench.tsx';
import type { WorkbenchPreset } from '../../components/workbenchPreset.ts';

const PRESET: WorkbenchPreset = {
  path: '/equilibrium',
  title: 'Any equilibrium',
  available: ALL_SPECIES,
  exposeSweep: true,
  normalized: true,
  withType: true,
  markSolids: true,
  emptyMessage: 'Pick some species to begin.',
  description: (
    <p>
      The general form of the other two tools: sweep <em>any</em> component of
      the system, either as an imposed free concentration or as a total amount,
      on a linear or a p-scale, over any range you like. The equation table also
      shows every equilibrium rewritten on a basis of independent components —
      that rewriting is exactly what the solver works with, and seeing it is the
      point of this tool: constants add along a substitution chain, so a couple
      that looks unrelated to the proton ends up carrying one.
    </p>
  ),
  defaults: {
    species: [],
    disabled: [],
    varying: 'H+',
    isFixed: true,
    log: true,
    from: 0,
    to: 14,
    logY: true,
    ...DEFAULT_SETTINGS,
  },
};

/**
 * The unrestricted sweep tool, with every parameter of the solver exposed.
 * @returns The page.
 */
export function EquilibriumTool() {
  return <SpeciationWorkbench preset={PRESET} />;
}
