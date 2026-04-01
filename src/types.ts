export type CellShape = "square" | "rounded" | "circle";

export type Settings = {
  dimension?: string;
  metric?: string;
  color?: string;
  cellShape?: CellShape;
  dateRange?: { start?: string; end?: string };
};

export type DateString = string;
export type Value = number;
export type MonthLabelFormatterParams = { yyyy: string; MM: string }
