import type { LineCustomSvgLayerProps, LineSvgLayer, Point } from '@nivo/line';
import { ResponsiveLine } from '@nivo/line';
import { useMemo, useState } from 'react';

import { assignColors } from '../chemistry/palette.ts';

import { PLOT_MARGIN } from './chartLayout.ts';

/** The concrete nivo series this chart feeds: numeric abscissa, gaps as `null`. */
interface ChartLineSeries {
  id: string;
  color: string;
  data: ReadonlyArray<{ x: number; y: number | null }>;
}

/** A horizontal band painted behind the curves, used for indicator colours. */
export interface ChartBand {
  from: number;
  to: number;
  color: string;
}

export interface ChartSeries {
  label: string;
  /** One value per `x`; non-finite values break the line. */
  y: number[];
}

interface EquilibriumChartProps {
  x: number[];
  series: ChartSeries[];
  xLabel: string;
  yLabel: string;
  /**
   * Use a decade scale for the ordinate. Minor species are invisible on a
   * linear scale, which is the single biggest readability problem of a
   * speciation diagram.
   * @default false
   */
  logY?: boolean;
  /** Fixed ordinate range; inferred from the data when omitted. */
  yRange?: [number, number];
  /** Horizontal bands painted behind the curves. */
  bands?: ChartBand[];
  /** Called with the index of the abscissa under the cursor. */
  onHover?: (index: number | null) => void;
}

/**
 * How many decades the ordinate shows at most. A speciation diagram over the
 * whole pH range spans fifteen, from 1 M down to the proton concentration at
 * pH 14; beyond that the curves are noise from a rounding floor.
 */
const MAX_DECADES = 16;

/** Used when a series label is not in the shared palette. */
const FALLBACK_COLOR = '#888888';

/** Colour of the vertical line that follows the cursor. */
const CURSOR_COLOR = 'rgb(115 134 148)';

/**
 * The line chart shared by every tool: speciation diagrams and titration curves.
 * @param props - Data and presentation of the chart.
 * @returns The chart, sized by its container.
 */
export function EquilibriumChart(props: EquilibriumChartProps) {
  const { x, series, xLabel, yLabel, logY, yRange, bands, onHover } = props;

  const [cursorX, setCursorX] = useState<number | null>(null);

  const colors = useMemo(
    () => assignColors(series.map((entry) => entry.label)),
    [series],
  );

  const decades = useMemo(
    () => (logY ? decadeRange(series) : undefined),
    [series, logY],
  );

  const data = useMemo<ChartLineSeries[]>(
    () =>
      series.map((entry) => ({
        id: entry.label,
        color: colors[entry.label] ?? FALLBACK_COLOR,
        data: x.map((value, index) => ({
          x: value,
          y: toPlottable(entry.y[index], decades?.min),
        })),
      })),
    [series, colors, x, decades],
  );

  const layers = useMemo<Array<LineSvgLayer<ChartLineSeries>>>(() => {
    const base: Array<LineSvgLayer<ChartLineSeries>> = [
      'grid',
      'axes',
      'lines',
      'slices',
      'legends',
      'mesh',
    ];
    if (cursorX !== null) {
      base.splice(base.indexOf('slices'), 0, cursorLayer(cursorX));
    }
    return bands ? [bandsLayer(bands), ...base] : base;
  }, [bands, cursorX]);

  if (x.length === 0 || series.length === 0) {
    return null;
  }

  return (
    <ResponsiveLine
      data={data}
      colors={(serie) => colors[serie.id] ?? FALLBACK_COLOR}
      margin={PLOT_MARGIN}
      xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
      yScale={
        decades
          ? { type: 'log', base: 10, min: decades.min, max: decades.max }
          : {
              type: 'linear',
              min: yRange ? yRange[0] : 'auto',
              max: yRange ? yRange[1] : 'auto',
            }
      }
      axisBottom={{
        legend: xLabel,
        legendOffset: 36,
        legendPosition: 'middle',
      }}
      axisLeft={{
        legend: yLabel,
        legendOffset: -58,
        legendPosition: 'middle',
        format: decades ? formatDecade : undefined,
        tickValues: decades?.ticks,
      }}
      enablePoints={false}
      enableGridX
      useMesh
      enableSlices="x"
      curve="monotoneX"
      lineWidth={2}
      layers={layers}
      legends={[
        {
          anchor: 'bottom',
          direction: 'row',
          translateY: 76,
          itemWidth: 110,
          itemHeight: 18,
          symbolSize: 10,
          symbolShape: 'circle',
          toggleSerie: true,
        },
      ]}
      sliceTooltip={({ slice }) => <SliceTooltip points={slice.points} />}
      onMouseMove={(datum) => {
        const point = 'points' in datum ? datum.points[0] : datum;
        setCursorX(point ? point.data.x : null);
        onHover?.(point ? x.indexOf(point.data.x) : null);
      }}
      onMouseLeave={() => {
        setCursorX(null);
        onHover?.(null);
      }}
    />
  );
}

function SliceTooltip({
  points,
}: {
  points: ReadonlyArray<Point<ChartLineSeries>>;
}) {
  const shown = points.slice(0, 12);
  return (
    <div
      className="bp6-card bp6-elevation-2"
      style={{ padding: 8, whiteSpace: 'nowrap' }}
    >
      {shown.map((point) => (
        <div key={point.id} style={{ display: 'flex', gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              flexShrink: 0,
              alignSelf: 'center',
              background: point.color,
            }}
          />
          <span style={{ flex: 1 }}>{point.seriesId}</span>
          <span className="numeric">{formatTooltip(point.data.y)}</span>
        </div>
      ))}
      {points.length > shown.length ? (
        <div className="bp6-text-muted">
          and {points.length - shown.length} more
        </div>
      ) : null}
    </div>
  );
}

/** The bounds and tick positions of a decade ordinate. */
interface DecadeRange {
  min: number;
  max: number;
  ticks: number[];
}

/**
 * Choose the decades a logarithmic ordinate should cover.
 *
 * Left to itself the scale collapses onto whatever the smallest plotted value
 * happens to be, so the bounds are taken from the data and rounded outwards to
 * whole decades, then clipped to a readable number of them.
 * @param series - The series about to be drawn.
 * @returns The bounds and ticks, or `undefined` when nothing is positive.
 */
function decadeRange(series: ChartSeries[]): DecadeRange | undefined {
  let smallest = Number.POSITIVE_INFINITY;
  let largest = 0;
  for (const entry of series) {
    for (const value of entry.y) {
      if (!Number.isFinite(value) || value <= 0) continue;
      if (value < smallest) smallest = value;
      if (value > largest) largest = value;
    }
  }
  if (largest === 0) return undefined;

  const top = Math.ceil(Math.log10(largest));
  const bottom = Math.max(Math.floor(Math.log10(smallest)), top - MAX_DECADES);
  const ticks: number[] = [];
  // A tick on every decade would crowd a fifteen-decade axis.
  const step = Math.ceil((top - bottom) / 8) || 1;
  for (let exponent = bottom; exponent <= top; exponent += step) {
    ticks.push(10 ** exponent);
  }
  return { min: 10 ** bottom, max: 10 ** top, ticks };
}

/**
 * A decade scale cannot show zero, so vanishing concentrations are pinned to
 * the bottom of the axis instead of silently cutting the line.
 * @param value - The raw value.
 * @param floor - Lowest value the ordinate shows, when it is logarithmic.
 * @returns A value the scale can place.
 */
function toPlottable(
  value: number | undefined,
  floor: number | undefined,
): number | null {
  if (value === undefined || !Number.isFinite(value)) return null;
  if (floor === undefined) return value;
  return value > floor ? value : floor;
}

function formatDecade(value: unknown): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return '';
  const exponent = Math.round(Math.log10(numeric));
  if (exponent === 0) return '1';
  return `10${superscript(exponent)}`;
}

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

function superscript(exponent: number): string {
  const digits = Math.abs(exponent)
    .toString()
    .replaceAll(/\d/g, (digit) => SUPERSCRIPTS[Number(digit)] as string);
  return exponent < 0 ? `⁻${digits}` : digits;
}

function formatTooltip(value: unknown): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  const magnitude = Math.abs(numeric);
  if (magnitude !== 0 && (magnitude < 1e-3 || magnitude >= 1e4)) {
    return numeric.toExponential(2);
  }
  return numeric.toPrecision(4).replace(/\.?0+$/, '');
}

/**
 * Build the layer that marks the abscissa under the cursor.
 * @param value - Abscissa of the point the cursor is over.
 * @returns A nivo custom layer.
 */
function cursorLayer(value: number) {
  return function CursorLine(layer: LineCustomSvgLayerProps<ChartLineSeries>) {
    const position = layer.xScale(value);
    return (
      <line
        x1={position}
        x2={position}
        y1={0}
        y2={layer.innerHeight}
        stroke={CURSOR_COLOR}
        strokeWidth={1}
        strokeDasharray="4 3"
        pointerEvents="none"
      />
    );
  };
}

/**
 * Build the layer that paints the indicator colour behind the curves.
 * @param bands - The bands to paint, in data coordinates.
 * @returns A nivo custom layer.
 */
function bandsLayer(bands: ChartBand[]) {
  return function IndicatorBands(
    layer: LineCustomSvgLayerProps<ChartLineSeries>,
  ) {
    const { yScale, innerWidth } = layer;
    return (
      <g>
        {bands.map((band) => {
          const top = yScale(band.to);
          const bottom = yScale(band.from);
          return (
            <rect
              key={`${band.from}-${band.to}`}
              x={0}
              y={Math.min(top, bottom)}
              width={innerWidth}
              height={Math.abs(bottom - top) + 0.5}
              fill={band.color}
              fillOpacity={0.45}
            />
          );
        })}
      </g>
    );
  };
}
