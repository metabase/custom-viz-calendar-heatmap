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

function getOption(
  data: Array<[DateString, Value]>,
  displayedYear: number,
  color: string,
  dimensionLabel: string,
  metricLabel: string,
) {
  const colorScale = getColorScale(color);
  const displayedYearData = data.filter(([date]) => {
    const d = new Date(date);
    return !isNaN(d.getTime()) && d.getFullYear() === displayedYear;
  });
  const values = displayedYearData.map(([_, value]) => value);

  // Fill missing dates with 0 so empty cells are visible
  const dataMap = new Map(
    displayedYearData.map(([date, val]) => [toISODateString(date), val]),
  );

  const filledData: [string, number][] = getAllDatesForYear(displayedYear).map(
    (date) => [date, dataMap.get(date) ?? 0],
  );
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;

  return {
    tooltip: {
      formatter: (params: { value: [string, number] }) =>
        `${dimensionLabel}: ${formatDate(params.value[0])}<br/>${metricLabel}: ${formatValue(params.value[1])}`,
    },
    visualMap: {
      min,
      max,
      type: "piecewise" as const,
      orient: "horizontal" as const,
      left: "center",
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
      showLabel: true,
      text: ["More", "Less"],
    },
    calendar: {
      top: 20,
      left: PADDING,
      cellSize: [18, 18],
      range: displayedYear,
      itemStyle: {
        borderWidth: 4,
        borderColor: "#ffffff",
        borderRadius: 2,
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
    series: {
      type: "heatmap",
      coordinateSystem: "calendar",
      data: filledData,
      itemStyle: {
        borderRadius: 3,
      },
    },
  };
}

const createVisualization: CreateCustomVisualization<Settings> = () => {
  return {
    id: "grid-heatmap",
    getName: () => "Calendar Heatmap",
    minSize: { width: 800, height: 400 },
    defaultSize: { width: 800, height: 400 },
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
  console.log({ props });

  const { data, years, latestYear, dimensionLabel, metricLabel } = getChartData(
    series,
    settings,
  );

  useEffect(() => {
    setDisplayedYear(latestYear);
  }, [latestYear]);

  const currentYear = displayedYear ?? latestYear;
  const yearIndex = years.indexOf(currentYear);
  const canGoPrev = yearIndex > 0;
  const canGoNext = yearIndex < years.length - 1;
  const color = settings.color ?? DEFAULT_CALENDAR_COLOR;

  useEffect(() => {
    if (!containerRef.current) return;
    chartRef.current = echarts.init(containerRef.current);
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(
      getOption(data, currentYear, color, dimensionLabel, metricLabel),
      true,
    );
  }, [data, currentYear, color, dimensionLabel, metricLabel]);

  useEffect(() => {
    chartRef.current?.resize();
  }, [width, height]);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          marginTop: 10,
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
      <div ref={containerRef} style={{ width, height }} />
    </div>
  );
};

const StaticVisualizationComponent = (
  _props: CustomStaticVisualizationProps<Settings>,
) => {
  return <div>TODO: Implement static visualization</div>;
};

export default createVisualization;
