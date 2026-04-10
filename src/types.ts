export type CellShape = "square" | "rounded" | "circle";

export type Settings = {
  dimension?: string;
  metric?: string;
  color?: string;
  cellShape?: CellShape;
};

export type DateString = string;
export type Value = number;
export type MonthLabelFormatterParams = { yyyy: string; M: number }
