import type {
  CreateCustomVisualization,
  CustomStaticVisualizationProps,
  CustomVisualizationProps,
} from "@metabase/custom-viz";
import type { Series } from "@metabase/custom-viz";
import * as echarts from "echarts";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { getColorScale, TEXT_COLOR, DEFAULT_CALENDAR_COLOR } from "./colors";

type Settings = {
  dimension?: string;
  metric?: string;
  color?: string;
};

function hasDuplicateDates(series: Series, settings: Settings): boolean {
  const { data } = getChartData(series, settings);
  const dates = data.map(([date]) => toISODateString(date));
  const seen = new Set<string>();
  for (const date of dates) {
    if (seen.has(date)) return true;
    seen.add(date);
  }
  return false;
}

function getYears(dates: string[]): number[] {
  const distinct = new Set<number>();
  dates.forEach((date) => {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      distinct.add(d.getFullYear());
    }
  });
  return Array.from(distinct).sort((a, b) => a - b);
}

function getChartData(
  series: Series,
  settings: Settings,
): {
  data: [string, number][];
  years: number[];
  latestYear: number;
  dimensionLabel: string;
  metricLabel: string;
} {
  const [{ data }] = series;
  const dimIndex = data.cols.findIndex(
    (col) => col.name === settings.dimension,
  );
  const metricIndex = data.cols.findIndex(
    (col) => col.name === settings.metric,
  );

  if (dimIndex === -1 || metricIndex === -1) {
    const currentYear = new Date().getFullYear();
    return {
      data: [],
      years: [currentYear],
      latestYear: currentYear,
      dimensionLabel: settings.dimension ?? "Date",
      metricLabel: settings.metric ?? "Value",
    };
  }

  const chartData: [string, number][] = data.rows.map((row) => [
    String(row[dimIndex]),
    Number(row[metricIndex]),
  ]);

  const years = getYears(chartData.map(([date]) => date));
  const latestYear = years.length
    ? years[years.length - 1]
    : new Date().getFullYear();

  const dimensionLabel =
    data.cols[dimIndex]?.display_name ?? data.cols[dimIndex]?.name ?? "Date";
  const metricLabel =
    data.cols[metricIndex]?.display_name ??
    data.cols[metricIndex]?.name ??
    "Value";

  return {
    data: chartData,
    years,
    latestYear,
    dimensionLabel,
    metricLabel,
  };
}

const PADDING = 30;
const CALENDAR_TOP = 20;
const CALENDAR_DAY_LABEL_WIDTH = 20;
const CALENDAR_MONTH_LABEL_HEIGHT = 18;
const CALENDAR_ROWS = 7;
const CALENDAR_WEEKS = 53;
const CELL_SIZE_MIN = 12;
const CELL_SIZE_MAX = 30;

function getCellBorderRadius(cellSize: number): number {
  return Math.max(1, Math.floor((cellSize - CELL_SIZE_MIN) / 3));
}

function getCellSize(width: number): number {
  return Math.max(
    CELL_SIZE_MIN,
    Math.min(
      CELL_SIZE_MAX,
      Math.floor((width - PADDING - CALENDAR_DAY_LABEL_WIDTH) / CALENDAR_WEEKS),
    ),
  );
}
const VISUALMAP_LEFT = 18;
const VISUALMAP_GAP = 8;
const VISUALMAP_HEIGHT = 30;

function getChartWidth(cellSize: number): number {
  return PADDING + CALENDAR_DAY_LABEL_WIDTH + CALENDAR_WEEKS * cellSize;
}

function getChartHeight(cellSize: number): number {
  return (
    CALENDAR_TOP +
    CALENDAR_MONTH_LABEL_HEIGHT +
    CALENDAR_ROWS * cellSize +
    VISUALMAP_GAP +
    VISUALMAP_HEIGHT
  );
}

function getAllDatesForYear(year: number): string[] {
  const dates: string[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(toISODateString(d));
  }
  return dates;
}

function toISODateString(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-CA");
}

function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatValue(value: number): string {
  return value.toFixed(2);
}

type DateString = string;
type Value = number;

const EMPTY_CELL_COLOR = "#ebedf0";

function getOption(
  data: Array<[DateString, Value]>,
  displayedYear: number,
  color: string,
  dimensionLabel: string,
  metricLabel: string,
  cellSize: number,
) {
  const colorScale = getColorScale(color);
  const displayedYearData = data.filter(([date]) => {
    const d = new Date(date);
    return !isNaN(d.getTime()) && d.getFullYear() === displayedYear;
  });
  const values = displayedYearData.map(([_, value]) => value);

  const dataMap = new Map(
    displayedYearData.map(([date, val]) => [toISODateString(date), val]),
  );

  const allDates = getAllDatesForYear(displayedYear);
  const actualData: [string, number][] = allDates
    .filter((date) => dataMap.has(date))
    .map((date) => [date, dataMap.get(date)!]);
  const emptyData: [string, number][] = allDates
    .filter((date) => !dataMap.has(date))
    .map((date) => [date, 0]);

  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;

  const borderRadius = getCellBorderRadius(cellSize);

  return {
    tooltip: {
      formatter: (params: { value: [string, number]; seriesIndex: number }) =>
        params.seriesIndex === 0
          ? `${dimensionLabel}: ${formatDate(params.value[0])}<br/>No data`
          : `${dimensionLabel}: ${formatDate(params.value[0])}<br/>${metricLabel}: ${formatValue(params.value[1])}`,
    },
    visualMap: {
      min,
      max,
      type: "piecewise" as const,
      orient: "horizontal" as const,
      top: CALENDAR_TOP + CALENDAR_ROWS * cellSize + VISUALMAP_GAP,
      left: "center",
      bottom: null,
      itemSymbol: "circle",
      seriesIndex: 1,
      inRange: {
        color: colorScale,
      },
      pieces: [
        { min: 0, max: 0, color: colorScale.get("empty") },
        { gt: 0, lte: max * 0.25, color: colorScale.get("low") },
        {
          gt: max * 0.25,
          lte: max * 0.5,
          color: colorScale.get("medium-low"),
        },
        {
          gt: max * 0.5,
          lte: max * 0.75,
          color: colorScale.get("medium-high"),
        },
        { gt: max * 0.75, color: colorScale.get("high") },
      ],
      showLabel: false,
      text: ["More", "Less"],
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 5,
    },
    calendar: {
      top: CALENDAR_TOP,
      left: PADDING,
      bottom: null,
      cellSize: [cellSize, cellSize],
      range: displayedYear,
      itemStyle: {
        borderWidth: 4,
        borderColor: "#ffffff",
        borderRadius,
      },
      splitLine: { show: false },
      yearLabel: { show: false },
      dayLabel: {
        show: true,
        firstDay: 0,
        color: TEXT_COLOR,
        fontSize: 11,
      },
      monthLabel: {
        nameMap: "en",
        color: TEXT_COLOR,
        fontSize: 11,
      },
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: emptyData,
        itemStyle: {
          color: EMPTY_CELL_COLOR,
          borderRadius,
        },
      },
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: actualData,
        itemStyle: {
          borderRadius,
        },
      },
    ],
  };
}

const createVisualization: CreateCustomVisualization<Settings> = () => {
  return {
    id: "grid-heatmap",
    getName: () => "Calendar Heatmap",
    minSize: { width: 15, height: 6 },
    defaultSize: { width: 20, height: 6 },
    isSensible() {
      return true;
    },
    checkRenderable(series, settings) {
      if (series.length === 0) {
        throw new Error("No series provided");
      }
      const s = settings ?? {};
      const dimension = s.dimension ?? series[0]?.data?.cols?.[0]?.name;
      const metric = s.metric ?? series[0]?.data?.cols?.[1]?.name;
      if (hasDuplicateDates(series, { ...s, dimension, metric })) {
        throw new Error(
          "Data is unbinned: multiple entries with the same date. Please aggregate date column by day.",
        );
      }
    },
    settings: {
      dimension: {
        id: "dimension",
        section: "Data",
        title: "Date Column",
        widget: "field",
        getDefault(object) {
          // TODO: isa utils required for this.
          const s = object as Series;
          return s?.[0]?.data?.cols?.[0]?.name;
        },
        getProps(object) {
          const s = object as Series;
          const cols = s?.[0]?.data?.cols ?? [];
          return {
            columns: cols,
            options: cols.map((col) => ({
              name: col.display_name,
              value: col.name,
            })),
          };
        },
      },
      metric: {
        id: "metric",
        section: "Data",
        title: "Metric Column",
        widget: "field",
        getDefault(object) {
          // TODO: isa utils required for this.
          const s = object as Series;
          return s?.[0]?.data?.cols?.[1]?.name;
        },
        getProps(object) {
          const s = object as Series;
          const cols = s?.[0]?.data?.cols ?? [];
          return {
            columns: cols,
            options: cols.map((col) => ({
              name: col.display_name,
              value: col.name,
            })),
          };
        },
      },
      color: {
        id: "color",
        section: "Display",
        title: "Color",
        widget: "color",
        getDefault() {
          return DEFAULT_CALENDAR_COLOR;
        },
      },
    },
    VisualizationComponent,
    StaticVisualizationComponent,
  };
};

const VisualizationComponent = (props: CustomVisualizationProps<Settings>) => {
  const { height, width, settings, series } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [displayedYear, setDisplayedYear] = useState<number | null>(null);

  const { data, years, latestYear, dimensionLabel, metricLabel } = getChartData(
    series,
    settings,
  );

  useEffect(() => {
    setDisplayedYear(latestYear);
  }, [latestYear]);

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = echarts.init(containerRef.current);
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  const currentYear = displayedYear ?? latestYear;
  const yearIndex = years.indexOf(currentYear);
  const canGoPrev = yearIndex > 0;
  const canGoNext = yearIndex < years.length - 1;
  const color = settings.color ?? DEFAULT_CALENDAR_COLOR;

  const cellSize = getCellSize(width);

  useEffect(() => {
    chartRef.current?.setOption(
      getOption(
        data,
        currentYear,
        color,
        dimensionLabel,
        metricLabel,
        cellSize,
      ),
      true,
    );
  }, [data, currentYear, color, dimensionLabel, metricLabel, cellSize]);

  useEffect(() => {
    chartRef.current?.resize();
  }, [width, height]);

  const chartWidth = getChartWidth(cellSize);

  return (
    <div
      style={{
        position: "relative",
        // overflowX: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
        justifyContent: "center",
      }}
    >
      <div style={{ overflowX: "auto", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            marginTop: 10,
            width: chartWidth,
          }}
        >
          <Button
            onClick={() => setDisplayedYear(years[yearIndex - 1])}
            disabled={!canGoPrev}
          >
            Previous
          </Button>
          <span style={{ fontSize: 16, fontWeight: 500 }}>{currentYear}</span>
          <Button
            onClick={() => setDisplayedYear(years[yearIndex + 1])}
            disabled={!canGoNext}
          >
            Next
          </Button>
        </div>

        <div
          ref={containerRef}
          style={{
            width: chartWidth,
            height: getChartHeight(cellSize),
          }}
        />
      </div>
    </div>
  );
};

const StaticVisualizationComponent = (
  props: CustomStaticVisualizationProps<Settings>,
) => {
  const { series, settings } = props;
  const { data, latestYear } = getChartData(series, settings);
  const color = settings.color ?? DEFAULT_CALENDAR_COLOR;

  const cellSize = 14;
  const step = cellSize + 2;
  const paddingLeft = 28;
  const paddingTop = 20;
  const paddingBottom = 36;

  const colorScale = getColorScale(color);

  const yearData = data.filter(([date]) => {
    const d = new Date(date);
    return !isNaN(d.getTime()) && d.getFullYear() === latestYear;
  });
  const dataMap = new Map(
    yearData.map(([date, val]) => [toISODateString(date), val]),
  );
  const values = yearData.map(([, v]) => v);
  const maxVal = values.length ? Math.max(...values) : 100;

  function getCellFill(dateStr: string): string {
    if (!dataMap.has(dateStr)) return EMPTY_CELL_COLOR;
    const val = dataMap.get(dateStr)!;
    if (val <= 0) return colorScale.get("empty")!;
    if (val <= maxVal * 0.25) return colorScale.get("low")!;
    if (val <= maxVal * 0.5) return colorScale.get("medium-low")!;
    if (val <= maxVal * 0.75) return colorScale.get("medium-high")!;
    return colorScale.get("high")!;
  }

  const jan1 = new Date(latestYear, 0, 1);
  const jan1DayOfWeek = jan1.getDay();
  const allDates = getAllDatesForYear(latestYear);
  const totalWeeks = Math.ceil((allDates.length + jan1DayOfWeek) / 7);

  const svgWidth = paddingLeft + totalWeeks * step;
  const svgHeight = paddingTop + 7 * step + paddingBottom;
  const borderRadius = getCellBorderRadius(cellSize);

  const cells = allDates.map((dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfYear = Math.round(
      (date.getTime() - jan1.getTime()) / 86400000,
    );
    const week = Math.floor((dayOfYear + jan1DayOfWeek) / 7);
    const dayOfWeek = date.getDay();
    return (
      <rect
        key={dateStr}
        x={paddingLeft + week * step}
        y={paddingTop + dayOfWeek * step}
        width={cellSize}
        height={cellSize}
        rx={borderRadius}
        ry={borderRadius}
        fill={getCellFill(dateStr)}
      />
    );
  });

  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthLabels = MONTH_NAMES.map((name, m) => {
    const firstOfMonth = new Date(latestYear, m, 1);
    const dayOfYear = Math.round(
      (firstOfMonth.getTime() - jan1.getTime()) / 86400000,
    );
    const week = Math.floor((dayOfYear + jan1DayOfWeek) / 7);
    return (
      <text
        key={m}
        x={paddingLeft + week * step}
        y={paddingTop - 6}
        fontSize={11}
        fill={TEXT_COLOR}
      >
        {name}
      </text>
    );
  });

  const dayLabels = (
    [
      { day: 1, label: "Mon" },
      { day: 3, label: "Wed" },
      { day: 5, label: "Fri" },
    ] as const
  ).map(({ day, label }) => (
    <text
      key={day}
      x={paddingLeft - 4}
      y={paddingTop + day * step + cellSize - 3}
      fontSize={10}
      fill={TEXT_COLOR}
      textAnchor="end"
    >
      {label}
    </text>
  ));

  const legendKeys = ["low", "medium-low", "medium-high", "high"] as const;
  const legendItemSize = 10;
  const legendGap = 5;
  const legendTextGap = 4;
  const legendTextWidth = 24;
  const legendWidth =
    legendTextWidth +
    legendTextGap +
    legendKeys.length * (legendItemSize + legendGap) +
    legendTextWidth;
  const legendStartX = (svgWidth - legendWidth) / 2;
  const legendY = paddingTop + 7 * step + 12;

  const legend = (
    <g>
      <text
        x={legendStartX}
        y={legendY + legendItemSize - 1}
        fontSize={11}
        fill={TEXT_COLOR}
      >
        Less
      </text>
      {legendKeys.map((key, i) => (
        <rect
          key={key}
          x={
            legendStartX +
            legendTextWidth +
            legendTextGap +
            i * (legendItemSize + legendGap)
          }
          y={legendY}
          width={legendItemSize}
          height={legendItemSize}
          rx={2}
          ry={2}
          fill={colorScale.get(key)!}
        />
      ))}
      <text
        x={
          legendStartX +
          legendTextWidth +
          legendTextGap +
          legendKeys.length * (legendItemSize + legendGap)
        }
        y={legendY + legendItemSize - 1}
        fontSize={11}
        fill={TEXT_COLOR}
      >
        More
      </text>
    </g>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        xmlns="http://www.w3.org/2000/svg"
      >
        {monthLabels}
        {dayLabels}
        {cells}
        {legend}
      </svg>
    </div>
  );
};

export default createVisualization;
