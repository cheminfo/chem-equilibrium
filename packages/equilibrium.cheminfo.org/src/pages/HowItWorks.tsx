import { useCallback, useEffect, useRef } from 'react';

import { ToolHeader } from '../components/ToolHeader.tsx';
import type { ToolStateCodec } from '../router/useToolState.ts';
import {
  ifChanged,
  numberParam,
  useToolState,
} from '../router/useToolState.ts';

import { AssumptionsSection } from './how-it-works/AssumptionsSection.tsx';
import { ContinuationSection } from './how-it-works/ContinuationSection.tsx';
import { ConvergenceSection } from './how-it-works/ConvergenceSection.tsx';
import { FixedSection } from './how-it-works/FixedSection.tsx';
import { IdeaSection } from './how-it-works/IdeaSection.tsx';
import { MassActionSection } from './how-it-works/MassActionSection.tsx';
import { MassBalanceSection } from './how-it-works/MassBalanceSection.tsx';
import { NewtonSection } from './how-it-works/NewtonSection.tsx';
import { NormalizationSection } from './how-it-works/NormalizationSection.tsx';
import { PkSection } from './how-it-works/PkSection.tsx';
import { SectionNav } from './how-it-works/SectionNav.tsx';
import { SolidsSection } from './how-it-works/SolidsSection.tsx';
import { FAMILIES, NEWTON_ACIDS } from './how-it-works/choices.ts';
import type { SectionId } from './how-it-works/sections.ts';
import { isSectionId } from './how-it-works/sections.ts';

const PATH = '/how-it-works';

/** Everything the page shows, so a section and a widget setting can be shared. */
interface HowItWorksState {
  section: SectionId;
  /** Acid of the Newton-Raphson illustration. */
  acid: string;
  /** Its total amount, in mol/L. */
  amount: number;
  /** The p-value every component starts from in that illustration. */
  guess: number;
  /** Acid family of the folding illustration. */
  family: string;
  /** Its imposed pH. */
  ph: number;
}

const DEFAULTS: HowItWorksState = {
  section: 'idea',
  acid: 'H3PO4',
  amount: 0.1,
  guess: 7,
  family: 'CO3--',
  ph: 7,
};

const CODEC: ToolStateCodec<HowItWorksState> = {
  encode: (state) => ({
    sec: ifChanged(state.section, DEFAULTS.section),
    acid: ifChanged(state.acid, DEFAULTS.acid),
    amount: ifChanged(state.amount, DEFAULTS.amount),
    guess: ifChanged(state.guess, DEFAULTS.guess),
    family: ifChanged(state.family, DEFAULTS.family),
    ph: ifChanged(state.ph, DEFAULTS.ph),
  }),
  decode: (query, defaults) => {
    const section = query.sec;
    const acid = query.acid;
    const family = query.family;
    return {
      section:
        section !== undefined && isSectionId(section)
          ? section
          : defaults.section,
      acid:
        acid !== undefined && NEWTON_ACIDS.includes(acid)
          ? acid
          : defaults.acid,
      amount: numberParam(query.amount, defaults.amount),
      guess: numberParam(query.guess, defaults.guess),
      family:
        family !== undefined && FAMILIES.includes(family)
          ? family
          : defaults.family,
      ph: numberParam(query.ph, defaults.ph),
    };
  },
};

/**
 * The algorithm behind every tool of this site, section by section.
 *
 * The two illustrations are live rather than drawn: the numbers in them come
 * from the same solver the rest of the site runs on, so nothing on this page
 * can quietly drift away from what the code does.
 * @returns The page.
 */
export function HowItWorksPage() {
  const [state, update] = useToolState(PATH, DEFAULTS, CODEC);
  const requested = useRef(state.section);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (requested.current === DEFAULTS.section) return;
    scrollToSection(requested.current, 'auto');
  }, []);

  const goTo = useCallback(
    (id: SectionId) => {
      update({ section: id });
      scrollToSection(id, 'smooth');
    },
    [update],
  );

  return (
    <div>
      <ToolHeader title="How it works">
        Every diagram on this site comes out of the same few hundred lines of
        numerical chemistry. This page is what they do: how a flask full of
        species becomes four unknowns, what the constants in the database
        actually mean, where the algorithm is solid — or fragile — and what it
        leaves out. Two of the illustrations are live, and every number quoted
        was produced by running the solver.
      </ToolHeader>

      <div className="tool-layout">
        <SectionNav current={state.section} onSelect={goTo} />
        <div className="panel-stack">
          <IdeaSection />
          <MassActionSection />
          <PkSection />
          <MassBalanceSection />
          <NormalizationSection />
          <FixedSection family={state.family} ph={state.ph} onChange={update} />
          <NewtonSection
            acid={state.acid}
            amount={state.amount}
            guess={state.guess}
            onChange={update}
          />
          <SolidsSection />
          <ConvergenceSection />
          <ContinuationSection />
          <AssumptionsSection />
        </div>
      </div>
    </div>
  );
}

/**
 * Bring a section into view.
 * @param id - Identifier of the section, which is also its element id.
 * @param behavior - Whether the jump is animated.
 */
function scrollToSection(id: SectionId, behavior: ScrollBehavior): void {
  document
    .querySelector(`#${id}`)
    ?.scrollIntoView({ behavior, block: 'start' });
}
