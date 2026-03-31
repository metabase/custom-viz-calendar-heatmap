import { Column, isDate, isNumeric, type Series } from "@metabase/custom-viz";

export const isDimensionCol = (col: Column | null | undefined) => isDate(col);
/**
 * Since isDate and isNumeric are not mutually exclusive, we want to make sure that the dataset contains
 * at least two columns: one for a dimension and one for a metric
 */
export const isMetricCol = (col: Column | null | undefined) => !isDimensionCol(col) && isNumeric(col);
export const findDefaultDimensionName = (series: Series) => series?.[0]?.data?.cols?.find(isDimensionCol)?.name;
export const findDefaultMetricName = (series: Series) => series?.[0]?.data?.cols?.find(isMetricCol)?.name;
