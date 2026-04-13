import { CustomStaticVisualizationProps } from "@metabase/custom-viz";
import type { Settings } from "./types";
import {
  ColorMap,
  DEFAULT_CALENDAR_COLOR,
  EMPTY_CELL_COLOR,
  getCellColor,
  getColorScale,
  TEXT_COLOR,
} from "./utils/colors";
import {
  formatColumnAsMonth,
  getAllDatesForYear,
  getChartData,
  getWeekDaysLabels,
  toISODateString,
} from "./utils/data";
import { getBorderRadius } from "./utils/looks";

export const StaticVisualizationComponent = ({
  series,
  settings,
  renderingContext,
}: CustomStaticVisualizationProps<Settings>) => {
  const { data, latestYear, dimensionCol } = getChartData(series, settings);
  const color = settings.color ?? DEFAULT_CALENDAR_COLOR;
  const cellShape = settings.cellShape;

  const { fontFamily } = renderingContext;

  const cellSize = 14;
  const step = cellSize + 2;
  const paddingLeft = 28;
  const yearLabelHeight = 24;
  const paddingTop = 20 + yearLabelHeight;
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
    const fill = getCellColor(dataMap.get(dateStr), maxVal, colorScale);
    return (
      <rect
        key={dateStr}
        x={paddingLeft + week * step}
        y={paddingTop + dayOfWeek * step}
        width={cellSize}
        height={cellSize}
        rx={borderRadius}
        ry={borderRadius}
        fill={fill}
      />
    );
  });

  const monthLabels = Array.from({ length: 12 }, (_, m) => {
    const firstOfMonth = new Date(latestYear, m, 1);
    const dayOfYear = Math.round(
      (firstOfMonth.getTime() - jan1.getTime()) / 86400000,
    );
    const week = Math.floor((dayOfYear + jan1DayOfWeek) / 7);
    const name = formatColumnAsMonth(new Date(latestYear, m), dimensionCol);
    return (
      <text
        key={m}
        x={paddingLeft + week * step}
        y={paddingTop - 6}
        fontSize={11}
        fontFamily={fontFamily}
        fill={TEXT_COLOR}
      >
        {name}
      </text>
    );
  });

  const weekDayNames = getWeekDaysLabels(dimensionCol);

  const dayLabels = [1, 3, 5].map((day) => (
    <text
      key={day}
      x={paddingLeft - 4}
      y={paddingTop + day * step + cellSize - 3}
      fontSize={10}
      fontFamily={fontFamily}
      fill={TEXT_COLOR}
      textAnchor="end"
    >
      {weekDayNames[day]}
    </text>
  ));

  const yearLabel = (
    <text
      x={svgWidth / 2}
      y={18}
      fontSize={16}
      fontWeight={500}
      fontFamily={fontFamily}
      fill={TEXT_COLOR}
      textAnchor="middle"
    >
      {latestYear}
    </text>
  );

  const legendKeys: (keyof ColorMap)[] = [
    "empty",
    "low",
    "medium-low",
    "medium-high",
    "high",
  ];
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
        fontFamily={fontFamily}
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
          fill={colorScale[key] ?? EMPTY_CELL_COLOR}
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
        fontFamily={fontFamily}
        fill={TEXT_COLOR}
      >
        More
      </text>
    </g>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {yearLabel}
        {monthLabels}
        {dayLabels}
        {cells}
        {legend}
      </svg>
    </div>
  );
};
