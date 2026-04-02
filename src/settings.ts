import type { Column } from "@metabase/custom-viz";
import { formatValue } from "@metabase/custom-viz";
import { DateString, Value, CellShape, MonthLabelFormatterParams } from "./types";
import { getColorScale, TEXT_COLOR } from "./utils/colors";
import { CALENDAR_DAY_LABEL_WIDTH, getBorderRadius } from "./utils/looks";
import { toISODateString, getAllDatesForYear, getWeekDaysLabels, formatColumnAsMonth } from "./utils/data";
import {
  CALENDAR_TOP,
  CALENDAR_ROWS,
  VISUALMAP_GAP,
  PADDING,
} from "./utils/looks";
import { EMPTY_CELL_COLOR } from "./utils/colors";

export const getOption = (
  data: Array<[DateString, Value]>,
  displayedYear: number,
  color: string,
  dimensionLabel: string,
  metricLabel: string,
  cellSize: number,
  cellShape: CellShape | undefined,
  dimensionCol?: Column,
  metricCol?: Column,
) => {
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

  const borderRadius = getBorderRadius(cellShape, cellSize);

  return {
    tooltip: { show: false },
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
      formatter: (value: number) => formatValue(value, { column: metricCol }),
      text: ["More", "Less"],
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 5,
    },
    calendar: {
      top: CALENDAR_TOP,
      left: PADDING + CALENDAR_DAY_LABEL_WIDTH,
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
        silent: true,
        firstDay: 0,
        color: TEXT_COLOR,
        fontSize: 11,
        nameMap: dimensionCol ? getWeekDaysLabels(dimensionCol) : undefined,
      },
      monthLabel: {
        silent: true,
        color: TEXT_COLOR,
        fontSize: 11,
        formatter: dimensionCol
          ? (params: MonthLabelFormatterParams) => formatColumnAsMonth(params, dimensionCol)
          : undefined,
      },
    },
    series: [
      {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: emptyData,
        silent: true,
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

