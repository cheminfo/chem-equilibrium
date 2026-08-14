import { Tooltip } from '@blueprintjs/core';
import type { CSSProperties } from 'react';

import type { Indicator } from '../chemistry/indicators.ts';
import { gradientOf, isLight } from '../chemistry/indicators.ts';

interface IndicatorBarProps {
  indicator: Indicator;
  /**
   * Height of the bar, in pixels.
   * @default 14
   */
  height?: number;
}

/**
 * The colour an indicator takes across the whole pH scale, as a bar.
 *
 * Reading the bar against the pH ruler under it is how a student sees, without
 * any arithmetic, which part of a titration curve the indicator can mark.
 * @param props - The indicator to draw.
 * @returns The colour bar, spanning pH 0 to 14.
 */
export function IndicatorBar(props: IndicatorBarProps) {
  const { indicator, height = 14 } = props;

  return (
    <div
      aria-label={`Colour of ${indicator.name} from pH 0 to pH 14`}
      style={{
        ...BAR_STYLE,
        height,
        backgroundImage: gradientOf(indicator),
      }}
    />
  );
}

interface ColorSwatchProps {
  /** Any CSS colour. */
  color: string;
  /** Shown on hover and read by assistive technology. */
  label: string;
  /**
   * Side of the square, in pixels.
   * @default 16
   */
  size?: number;
}

/**
 * A square of colour, outlined so a colourless form is still visible.
 *
 * Phenolphthalein and thymolphthalein record their acid form as `#ffffff`, so
 * a light swatch gets a dark outline: without it the square disappears into
 * the page and the student sees nothing where a colour is expected.
 * @param props - The colour and what to call it.
 * @returns The swatch.
 */
export function ColorSwatch(props: ColorSwatchProps) {
  const { color, label, size = 16 } = props;

  return (
    <Tooltip content={label} compact hoverOpenDelay={200}>
      <span
        aria-label={label}
        role="img"
        style={{
          ...SWATCH_STYLE,
          width: size,
          height: size,
          background: color,
          borderColor: isLight(color)
            ? 'rgba(17, 20, 24, 0.7)'
            : 'rgba(17, 20, 24, 0.35)',
        }}
      />
    </Tooltip>
  );
}

/**
 * The pH ruler a colour bar is read against.
 * @returns The graduations from pH 0 to pH 14.
 */
export function PhRuler() {
  return (
    <div style={RULER_STYLE} aria-hidden="true">
      {[0, 2, 4, 6, 8, 10, 12, 14].map((ph) => (
        <span key={ph}>{ph}</span>
      ))}
    </div>
  );
}

const BAR_STYLE: CSSProperties = {
  width: '100%',
  borderRadius: 2,
  border: '1px solid rgba(17, 20, 24, 0.2)',
  boxSizing: 'border-box',
};

const SWATCH_STYLE: CSSProperties = {
  display: 'inline-block',
  flex: 'none',
  borderRadius: 2,
  border: '1px solid rgba(17, 20, 24, 0.35)',
  boxSizing: 'border-box',
};

const RULER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 10,
  fontVariantNumeric: 'tabular-nums',
  color: '#5f6b7c',
};
