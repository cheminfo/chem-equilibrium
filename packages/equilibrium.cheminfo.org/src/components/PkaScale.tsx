import { formatPK } from '../chemistry/format.ts';
import { STRENGTH_BANDS } from '../chemistry/species.ts';

import { Species } from './Species.tsx';
import {
  BANDS,
  BAND_MIDDLE,
  BAND_WIDTH,
  BAND_X,
  DIM,
  HEIGHT,
  INK,
  LABEL_X,
  LEVELLING,
  LEVEL_LABEL_STYLE,
  MARK,
  MARKER_CHIP_STYLE,
  MARKER_ROW_STYLE,
  TICKS,
  TICK_LABEL_X,
  TOP,
  WIDTH,
  middleOf,
  withMinusSign,
  yOf,
} from './pkaScaleLayout.ts';

interface PkaScaleProps {
  /** The couple to point at, or `null` when nothing should be marked. */
  marker: { acid: string; pK: number } | null;
}

/**
 * The pKa axis, with the five strength bands and the water levelling window.
 *
 * Everything is drawn inline so the figure scales, stays legible at 320px and
 * needs no external asset.
 * @param props - The couple to mark on the scale.
 * @returns The figure.
 */
export function PkaScale(props: PkaScaleProps) {
  const { marker } = props;
  const markerY = marker ? yOf(marker.pK) : 0;

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: 360, height: 'auto', display: 'block' }}
        role="img"
      >
        <title>
          pKa scale from −10 to 25, banded from strong acids to very weak acids
        </title>

        <text x={TICK_LABEL_X} y={16} textAnchor="end" fontSize={11} fill={INK}>
          pKa
        </text>
        <text
          x={BAND_MIDDLE}
          y={16}
          textAnchor="middle"
          fontSize={9}
          fill={DIM}
        >
          stronger acid
        </text>
        <text
          x={BAND_MIDDLE}
          y={HEIGHT - 6}
          textAnchor="middle"
          fontSize={9}
          fill={DIM}
        >
          weaker acid
        </text>

        {BANDS.map((band) => (
          <g key={band.band}>
            <rect
              x={BAND_X}
              y={yOf(band.from)}
              width={BAND_WIDTH}
              height={yOf(band.to) - yOf(band.from)}
              fill={STRENGTH_BANDS[band.band].color}
              stroke="#c5cbd3"
              strokeWidth={0.5}
            />
            {band.leader ? (
              <line
                x1={BAND_X + BAND_WIDTH}
                x2={LABEL_X - 4}
                y1={middleOf(band)}
                y2={middleOf(band)}
                stroke="#8f99a8"
                strokeWidth={0.75}
              />
            ) : null}
            <text
              x={LABEL_X}
              y={middleOf(band)}
              fontSize={11}
              fill={INK}
              dominantBaseline="middle"
            >
              {band.lines.map((line, index) => (
                <tspan
                  key={line}
                  x={LABEL_X}
                  dy={index === 0 ? -(band.lines.length - 1) * 6 : 13}
                >
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        ))}

        {TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={BAND_X - 12}
              x2={BAND_X}
              y1={yOf(tick)}
              y2={yOf(tick)}
              stroke="#8f99a8"
              strokeWidth={0.75}
            />
            <text
              x={TICK_LABEL_X}
              y={yOf(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill={DIM}
            >
              {withMinusSign(String(tick))}
            </text>
          </g>
        ))}

        {LEVELLING.map((level) => (
          <g key={level.label}>
            <line
              x1={BAND_X - 12}
              x2={LABEL_X - 6}
              y1={yOf(level.pK)}
              y2={yOf(level.pK)}
              stroke="#394b59"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <foreignObject
              x={LABEL_X}
              y={yOf(level.pK) - 9}
              width={WIDTH - LABEL_X - 4}
              height={18}
            >
              <div style={LEVEL_LABEL_STYLE}>
                <Species label={level.label} withName={false} />
                <span>{level.text}</span>
              </div>
            </foreignObject>
          </g>
        ))}

        {marker ? (
          <g>
            <line
              x1={BAND_X - 12}
              x2={BAND_X + BAND_WIDTH + 6}
              y1={markerY}
              y2={markerY}
              stroke="white"
              strokeWidth={4}
            />
            <line
              x1={BAND_X - 12}
              x2={BAND_X + BAND_WIDTH + 6}
              y1={markerY}
              y2={markerY}
              stroke={MARK}
              strokeWidth={2}
            />
            <circle
              cx={BAND_MIDDLE}
              cy={markerY}
              r={3.5}
              fill={MARK}
              stroke="white"
              strokeWidth={1}
            />
            <foreignObject
              x={0}
              y={markerY - 24 < TOP ? markerY + 4 : markerY - 24}
              width={BAND_X + BAND_WIDTH}
              height={20}
            >
              <div style={MARKER_ROW_STYLE}>
                <span style={MARKER_CHIP_STYLE}>
                  <Species label={marker.acid} withName={false} />
                  <span>pKa {withMinusSign(formatPK(marker.pK))}</span>
                </span>
              </div>
            </foreignObject>
          </g>
        ) : null}
      </svg>

      <figcaption className="bp6-text-muted" style={{ fontSize: 12 }}>
        Between the two dashed lines — the pKa of{' '}
        <Species label="H3O+" withName={false} /> and the pKa of{' '}
        <Species label="H2O" withName={false} /> — an acid and its conjugate
        base both survive in water. Outside them water levels the couple: the
        acid above the window is fully deprotonated by water, the base below it
        is fully protonated.
      </figcaption>
    </figure>
  );
}
