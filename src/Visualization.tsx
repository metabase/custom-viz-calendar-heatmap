import type {
  ClickObject,
  CustomVisualizationProps,
} from "@metabase/custom-viz";
import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./components/Button";
import { useLatest } from "./hooks/useLatest";
import { getOption } from "./settings";
import type { Settings } from "./types";
import { DEFAULT_CALENDAR_COLOR } from "./utils/colors";
import { getChartData, toISODateString } from "./utils/data";
import { getCellSize, getChartHeight, getChartWidth } from "./utils/looks";

export function VisualizationComponent({
  height,
  width,
  settings,
  series,
  onClick,
  onHover,
  colorScheme,
}: CustomVisualizationProps<Settings>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const onClickRef = useLatest(onClick);
  const onHoverRef = useLatest(onHover);
  const seriesRef = useLatest(series);
  const settingsRef = useLatest(settings);
  const [displayedYear, setDisplayedYear] = useState<number | null>(null);

  const { data, years, latestYear, dimensionCol, metricCol } = getChartData(
    series,
    settings,
  );

  useEffect(() => {
    setDisplayedYear(latestYear);
  }, [latestYear]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    setupTooltip(chart);

    chart.on("click", (params: echarts.ECElementEvent) => {
      if (typeof onClickRef.current !== "function") {
        return;
      }

      // Empty cells (series index 0) have no data to drill into
      if (params.seriesIndex === 0) {
        onClickRef.current(null);
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
        /** settings need to be included in the click object to support custom click behavior */
        settings: settingsRef.current,
      };

      onClickRef.current(clickObject);
    });

    return () => {
      chart.dispose();
      chartRef.current = null;
    };
  }, [colorScheme]);

  const setupTooltip = (chart: echarts.ECharts) => {
    chart.on("mouseover", (params: echarts.ECElementEvent) => {
      if (typeof onHoverRef.current !== "function") {
        return;
      }

      // Empty cells (series index 0) have no data to drill into
      if (params.seriesIndex === 0) {
        return;
      }

      const [dateString, metricValue] = params.data as [string, number];
      const columns = seriesRef.current[0].data.cols;
      const dimensionIndex = columns.findIndex(
        ({ name }) => name === settingsRef.current.dimension,
      );
      const metricIndex = columns.findIndex(
        ({ name }) => name === settingsRef.current.metric,
      );
      const dimensionColumn = columns[dimensionIndex];
      const metricColumn = columns[metricIndex];

      const cellPixel = chart.convertToPixel("calendar", [dateString]);
      const chartRect = chart.getDom().getBoundingClientRect();

      onHoverRef.current({
        value: metricValue,
        column: metricColumn,
        dimensions: [{ value: dateString, column: dimensionColumn }],
        data: [
          {
            key: dimensionColumn.display_name,
            col: dimensionColumn,
            value: dateString,
          },
          {
            key: metricColumn.display_name,
            col: metricColumn,
            value: metricValue,
          },
        ],
        event: new MouseEvent("mouseover", {
          clientX: chartRect.left + cellPixel[0],
          clientY: chartRect.top + cellPixel[1],
        }),
      });
    });

    chart.on("mouseout", () => onHoverRef.current?.(null));
  };

  const currentYear = displayedYear ?? latestYear;
  const yearIndex = years.indexOf(currentYear);
  const canGoPrev = yearIndex > 0;
  const canGoNext = yearIndex < years.length - 1;
  const color = settings.color ?? DEFAULT_CALENDAR_COLOR;
  const cellShape = settings.cellShape;

  const cellSize = width ? getCellSize(width) : 0;

  const option = useMemo(() => {
    return getOption(
      data,
      currentYear,
      color,
      colorScheme,
      cellSize,
      cellShape,
      dimensionCol,
      metricCol,
    );
  }, [
    data,
    currentYear,
    color,
    colorScheme,
    cellSize,
    cellShape,
    dimensionCol,
    metricCol,
  ]);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

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
      <div
        style={{
          overflowX: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            marginBottom: 10,
            marginTop: 10,
            width: chartWidth,
          }}
        >
          <Button
            onClick={() => setDisplayedYear(years[yearIndex - 1])}
            disabled={!canGoPrev}
            colorScheme={colorScheme}
          >
            Previous
          </Button>

          <span style={{ fontSize: 16, fontWeight: 500 }}>{currentYear}</span>

          <Button
            onClick={() => setDisplayedYear(years[yearIndex + 1])}
            disabled={!canGoNext}
            colorScheme={colorScheme}
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
}
