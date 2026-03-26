import * as echarts from "echarts";
import { useEffect, useRef, useState } from "react";
import { Button } from "./components/Button";
import type {
  ClickObject,
  CustomVisualizationProps,
} from "@metabase/custom-viz";
import type { Settings } from "./types";
import { getChartData, toISODateString } from "./utils/data";
import { getCellSize, getChartWidth, getChartHeight } from "./utils/looks";
import { DEFAULT_CALENDAR_COLOR } from "./utils/colors";
import { getOption } from "./settings";

export function VisualizationComponent(
  props: CustomVisualizationProps<Settings>,
) {
  const { height, width, settings, series, onVisualizationClick } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const onVisualizationClickRef = useRef(onVisualizationClick);
  const seriesRef = useRef(series);
  const settingsRef = useRef(settings);
  const [displayedYear, setDisplayedYear] = useState<number | null>(null);

  const { data, years, latestYear, dimensionLabel, metricLabel } = getChartData(
    series,
    settings,
  );

  useEffect(() => {
    setDisplayedYear(latestYear);
  }, [latestYear]);

  useEffect(() => {
    onVisualizationClickRef.current = onVisualizationClick;
  }, [onVisualizationClick]);
  useEffect(() => {
    seriesRef.current = series;
  }, [series]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    chart.on("click", (params: echarts.ECElementEvent) => {
      if (typeof onVisualizationClickRef.current !== "function") return;

      // Empty cells (series index 0) have no data to drill into
      if (params.seriesIndex === 0) {
        onVisualizationClickRef.current(null);
        return;
      }

      const [dateStr, metricValue] = params.data as [string, number];
      const cols = seriesRef.current[0].data.cols;
      const rows = seriesRef.current[0].data.rows;
      const dimIndex = cols.findIndex(
        (c) => c.name === settingsRef.current.dimension,
      );
      const metricIndex = cols.findIndex(
        (c) => c.name === settingsRef.current.metric,
      );
      const dimCol = cols[dimIndex];
      const metricCol = cols[metricIndex];

      // Find the original row matching this date
      const isoDate = toISODateString(dateStr);
      const matchedRow = rows.find(
        (row) => toISODateString(String(row[dimIndex])) === isoDate,
      );

      const clickObject: ClickObject<Settings> = {
        value: metricValue,
        column: metricCol,
        dimensions: dimCol ? [{ value: dateStr, column: dimCol }] : [],
        event: params.event?.event as MouseEvent | undefined,
        origin: matchedRow
          ? { row: matchedRow as (string | number | null)[], cols }
          : undefined,
      };

      onVisualizationClickRef.current(clickObject);
    });

    return () => {
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  const currentYear = displayedYear ?? latestYear;
  const yearIndex = years.indexOf(currentYear);
  const canGoPrev = yearIndex > 0;
  const canGoNext = yearIndex < years.length - 1;
  const color = settings.color ?? DEFAULT_CALENDAR_COLOR;
  const cellShape = settings.cellShape;

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
        cellShape,
      ),
      true,
    );
  }, [
    data,
    currentYear,
    color,
    dimensionLabel,
    metricLabel,
    cellSize,
    cellShape,
  ]);

  useEffect(() => {
    chartRef.current?.resize();
  }, [width, height]);

  const chartWidth = getChartWidth(cellSize);

  return (
    <div
      style={{
        position: "relative",
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
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}
