import { Column, formatValue, Series } from "@metabase/custom-viz";
import { Settings } from "../types";

export function getChartData(
  series: Series,
  settings: Settings,
): {
  data: [string, number][];
  years: number[];
  latestYear: number;
  dimensionLabel: string;
  metricLabel: string;
  dimensionCol: Column;
  metricCol: Column;
} {
  const [{ data }] = series;
  const dimIndex = data.cols.findIndex(
    (col) => col.name === settings.dimension,
  );
  const metricIndex = data.cols.findIndex(
    (col) => col.name === settings.metric,
  );

  if (dimIndex === -1 || metricIndex === -1) {
    throw new Error("There is no valid columns to render a chart");
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
    dimensionCol: data.cols[dimIndex],
    metricCol: data.cols[metricIndex],
  };
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

export function hasDuplicateDates(series: Series, settings: Settings): boolean {
  const { data } = getChartData(series, settings);
  const dates = data.map(([date]) => toISODateString(date));
  const seen = new Set<string>();
  for (const date of dates) {
    if (seen.has(date)) return true;
    seen.add(date);
  }
  return false;
}

export function toISODateString(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-CA");
}

export function getAllDatesForYear(year: number): string[] {
  const dates: string[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(toISODateString(d));
  }
  return dates;
}

export function formatColumnAsMonth(date: Date, dimensionCol: Column): string {
  return formatValue(date, {
    column: { ...dimensionCol, unit: "month-of-year" },
    date_abbreviate: true,
  });
}

function formatColumnAsDay(date: Date, dimensionCol: Column): string {
  return formatValue(date, {
    column: { ...dimensionCol, unit: "day-of-week" },
    date_abbreviate: true,
  });
}

export function getWeekDaysLabels(dimensionCol: Column): string[] {
  /**
   * Fixed Sunday; actual date doesn't matter, only the day-of-week.
   * echarts nameMap requires index 0 = Sunday
   */
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    return formatColumnAsDay(day, dimensionCol);
  });
}
