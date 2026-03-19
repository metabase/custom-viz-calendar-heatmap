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

function getLatestYear(dates: string[]): number {
  const distinctYears = new Set<number>();
  dates.forEach((date) => {
    const d = new Date(date);
    distinctYears.add(d.getFullYear());
  });
  return Math.max(...Array.from(distinctYears));
}

function getChartData(
  series: Series,
  settings: Settings,
): { data: [string, number][]; latestYear: number } {
  const [{ data }] = series;
  const dimIndex = data.cols.findIndex(
    (col) => col.name === settings.dimension,
  );
  const metricIndex = data.cols.findIndex(
    (col) => col.name === settings.metric,
  );

  if (dimIndex === -1 || metricIndex === -1) {
    return { data: [], latestYear: new Date().getFullYear() };
  }

  const chartData: [string, number][] = data.rows.map((row) => [
    String(row[dimIndex]),
    Number(row[metricIndex]),
  ]);

  const latestYear = getLatestYear(chartData.map(([date]) => date));

  return { data: chartData, latestYear };
}

function getOption(data: [string, number][], latestYear: number) {
  const values = data.map((d) => d[1]);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 100;
  console.log({ min, max });
  return {
    title: {
      top: 30,
      left: "center",
      text: String(latestYear),
    },
    tooltip: {},
    visualMap: {
      min,
      max,
      type: "piecewise" as const,
      orient: "horizontal" as const,
      left: "center",
      top: 65,
    },
    calendar: {
      top: 120,
      left: 30,
      right: 30,
      cellSize: ["auto", 13],
      range: latestYear,
      itemStyle: {
        borderWidth: 0.5,
      },
      yearLabel: { show: false },
    },
    series: {
      type: "heatmap",
      coordinateSystem: "calendar",
      data,
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

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current);
    }

    const { data, latestYear } = getChartData(series, settings);
    chartRef.current.setOption(getOption(data, latestYear));

    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [series, settings]);

  useEffect(() => {
    chartRef.current?.resize();
  }, [width, height]);

  return <div ref={containerRef} style={{ width, height }} />;
};

const StaticVisualizationComponent = (
  props: CustomStaticVisualizationProps<Settings>,
) => {
  const width = 540;
  const height = 360;
  const { settings, series } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { data, latestYear } = getChartData(series, settings);
    const chart = echarts.init(containerRef.current, undefined, {
      width,
      height,
    });
    chart.setOption(getOption(data, latestYear));
    setDataUrl(chart.getDataURL({ type: "png", pixelRatio: 2 }));
    chart.dispose();
  }, [series, settings]);

  if (dataUrl) {
    return <img src={dataUrl} width={width} height={height} />;
  }

  return (
    <div
      ref={containerRef}
      style={{ width, height, visibility: "hidden", position: "absolute" }}
    />
  );
};

export default createVisualization;
