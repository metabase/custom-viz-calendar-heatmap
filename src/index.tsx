import type {
  CreateCustomVisualization,
  CustomStaticVisualizationProps,
  CustomVisualizationProps,
} from "@metabase/custom-viz";
import type { Series } from "@metabase/custom-viz";
import * as echarts from "echarts";
import { useEffect, useRef, useState } from "react";

type Settings = {
  dimension?: string;
  metric?: string;
};

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
): { data: [string, number][]; years: number[]; latestYear: number } {
  const [{ data }] = series;
  const dimIndex = data.cols.findIndex(
    (col) => col.name === settings.dimension,
  );
  const metricIndex = data.cols.findIndex(
    (col) => col.name === settings.metric,
  );

  if (dimIndex === -1 || metricIndex === -1) {
    const currentYear = new Date().getFullYear();
    return { data: [], years: [currentYear], latestYear: currentYear };
  }

  const chartData: [string, number][] = data.rows.map((row) => [
    String(row[dimIndex]),
    Number(row[metricIndex]),
  ]);

  const years = getYears(chartData.map(([date]) => date));
  const latestYear = years.length
    ? years[years.length - 1]
    : new Date().getFullYear();

  return { data: chartData, years, latestYear };
}

const PADDING = 30;
function getOption(data: [string, number][], displayedYear: number) {
  const yearData = data.filter(([date]) => {
    const d = new Date(date);
    return !isNaN(d.getTime()) && d.getFullYear() === displayedYear;
  });
  const values = yearData.map((d) => d[1]);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  return {
    tooltip: {},
    visualMap: {
      min,
      max,
      type: "piecewise" as const,
      orient: "horizontal" as const,
      left: "center",
    },
    calendar: {
      top: 0,
      left: PADDING,
      right: PADDING,
      cellSize: ["auto", 13],
      range: displayedYear,
      itemStyle: {
        borderWidth: 1,
      },
      yearLabel: { show: false },
    },
    series: {
      type: "heatmap",
      coordinateSystem: "calendar",
      data: yearData,
    },
  };
}

const createVisualization: CreateCustomVisualization<Settings> = () => {
  return {
    id: "grid-heatmap",
    getName: () => "Calendar Heatmap",
    minSize: { width: 4, height: 3 },
    defaultSize: { width: 8, height: 4 },
    isSensible() {
      return true;
    },
    checkRenderable(series) {
      if (series.length === 0) {
        throw new Error("No series provided");
      }
    },
    settings: {
      dimension: {
        id: "dimension",
        title: "Date Column",
        widget: "field",
        getDefault(object) {
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

  const { data, years, latestYear } = getChartData(series, settings);

  useEffect(() => {
    setDisplayedYear(latestYear);
  }, [latestYear]);

  const currentYear = displayedYear ?? latestYear;
  const yearIndex = years.indexOf(currentYear);
  const canGoPrev = yearIndex > 0;
  const canGoNext = yearIndex < years.length - 1;

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current);
    }

    chartRef.current.setOption(getOption(data, currentYear), true);

    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [data, currentYear]);

  useEffect(() => {
    chartRef.current?.resize();
  }, [width, height]);

  return (
    <div style={{ width, height, position: "relative" }}>
      <div
        style={{
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          marginTop: 10,
        }}
      >
        <button
          onClick={() => canGoPrev && setDisplayedYear(years[yearIndex - 1])}
          disabled={!canGoPrev}
          style={{
            pointerEvents: "all",
            cursor: canGoPrev ? "pointer" : "default",
            opacity: canGoPrev ? 1 : 0.3,
            fontSize: 16,
            padding: "0 4px",
          }}
        >
          prev
        </button>
        <span style={{ fontSize: 16 }}>{currentYear}</span>
        <button
          onClick={() => canGoNext && setDisplayedYear(years[yearIndex + 1])}
          disabled={!canGoNext}
          style={{
            pointerEvents: "all",
            background: "none",
            border: "none",
            cursor: canGoNext ? "pointer" : "default",
            opacity: canGoNext ? 1 : 0.3,
            fontSize: 16,
            padding: "0 4px",
          }}
        >
          next
        </button>
      </div>
      <div ref={containerRef} style={{ width, height }} />
    </div>
  );
};

const StaticVisualizationComponent = (
  props: CustomStaticVisualizationProps<Settings>,
) => {
  return <div>TODO: Implement static visualization</div>;
};

export default createVisualization;
