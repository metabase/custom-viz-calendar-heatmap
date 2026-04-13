import { Column, isDate, isNumeric } from "@metabase/custom-viz";

export function isDimensionCol(col: Column | null | undefined): boolean {
  return isDate(col);
}
/**
 * Since isDate and isNumeric are not mutually exclusive, we want to make sure that the dataset contains
 * at least two columns: one for a dimension and one for a metric
 */
export function isMetricCol(col: Column | null | undefined): boolean {
  return !isDimensionCol(col) && isNumeric(col);
}

export function findDefaultDimensionName(cols: Column[]): string | undefined {
  return cols.find(isDimensionCol)?.name;
}

export function findDefaultMetricName(cols: Column[]): string | undefined {
  return cols.find(isMetricCol)?.name;
}
