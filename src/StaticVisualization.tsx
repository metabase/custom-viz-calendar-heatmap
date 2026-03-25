import { CustomStaticVisualizationProps } from "@metabase/custom-viz";
import { DEFAULT_CALENDAR_COLOR } from "./colors";
import type { Settings } from "./types";
import { getChartData } from "./data";
import { getColorScale } from "./colors";
import { toISODateString, getAllDatesForYear } from "./data";
import { getBorderRadius } from "./looks";
import { EMPTY_CELL_COLOR } from "./colors";
import { TEXT_COLOR } from "./colors";

export const StaticVisualizationComponent = (
  props: CustomStaticVisualizationProps<Settings>,
) => {
  const { series, settings } = props;
  const { data, latestYear } = getChartData(series, settings);
  const color = settings.color ?? DEFAULT_CALENDAR_COLOR;
  const cellShape = settings.cellShape;

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
  const borderRadius = getBorderRadius(cellShape, cellSize);

  const cells = allDates.map((dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfYear = Math.round((date.getTime() - jan1.getTime()) / 86400000);
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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
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
