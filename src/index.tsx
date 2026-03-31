import type { CreateCustomVisualization } from "@metabase/custom-viz";
import { DEFAULT_CALENDAR_COLOR } from "./utils/colors";
import { CellShapeWidget } from "./components/CellShapeWidget";
import { DateRangeWidget } from "./components/DateRangeWidget";
import type { Settings } from "./types";
import { StaticVisualizationComponent } from "./StaticVisualization";
import { VisualizationComponent } from "./Visualization";

import { getChartData, hasDuplicateDates } from "./utils/data";
import { findDefaultDimensionName, findDefaultMetricName, isDimensionCol, isMetricCol } from "./utils/isa";

const createVisualization: CreateCustomVisualization<Settings> = () => {
  return {
    id: "grid-heatmap",
    getName: () => "Calendar Heatmap",
    minSize: { width: 15, height: 6 },
    defaultSize: { width: 20, height: 6 },
    isSensible: (data) => data.cols.find(isDimensionCol) && data.cols.find(isMetricCol),
    checkRenderable(series, settings) {
      if (series.length === 0) {
        throw new Error("No series provided");
      }
      const cols = series[0]?.data?.cols ?? [];
      const s = settings ?? {};
      const dimensionName = s.dimension ?? findDefaultDimensionName(series);
      const metricName = s.metric ?? findDefaultMetricName(series);
      const dimensionCol = cols.find((col) => col.name === dimensionName && isDimensionCol(col));
      const metricCol = cols.find((col) => col.name === metricName && isMetricCol(col));

      if (!dimensionCol) {
        throw new Error("Please select a date column for the dimension.");
      }
      if (!metricCol) {
        throw new Error("Please select a numeric column for the metric.");
      }
      if (hasDuplicateDates(series, { ...s, dimension: dimensionName, metric: metricName })) {
        throw new Error(
          "Data is unbinned: multiple entries with the same date. Please aggregate date column by day.",
        );
      }
    },
    settings: {
      dimension: {
        id: "dimension",
        section: "Data",
        title: "Date Column",
        widget: "field",
        getDefault: findDefaultDimensionName,
        getProps(series) {
          const cols = series?.[0]?.data?.cols ?? [];
          const dimensionCol = cols.filter(isDimensionCol);
          return {
            columns: dimensionCol,
            options: dimensionCol.map(({ display_name, name }) => ({ name: display_name, value: name })),
          };
        },
      },
      metric: {
        id: "metric",
        section: "Data",
        title: "Metric Column",
        widget: "field",
        getDefault: findDefaultMetricName,
        getProps(series) {
          const cols = series?.[0]?.data?.cols ?? [];
          const metricCol = cols.filter(isMetricCol);
          return {
            columns: metricCol,
            options: metricCol.map(({ display_name, name }) => ({ name: display_name, value: name })),
          };
        },
      },
      dateRange: {
        id: "dateRange",
        section: "Data",
        title: "Date Range",
        widget: DateRangeWidget,
        getDefault() {
          return undefined;
        },
        getProps(series, vizSettings) {
          const { data } = getChartData(series, {
            ...vizSettings,
            dateRange: undefined,
          });
          const dates = data.map(([d]) => d).sort();
          return {
            minDate: dates[0],
            maxDate: dates[dates.length - 1],
          };
        },
      },
      color: {
        id: "color",
        section: "Display",
        title: "Color",
        widget: "color",
        getDefault() {
          return DEFAULT_CALENDAR_COLOR;
        },
      },
      cellShape: {
        id: "cellShape",
        section: "Display",
        title: "Cell Shape",
        widget: CellShapeWidget,
        getDefault() {
          return "rounded";
        },
      },
    },
    VisualizationComponent,
    StaticVisualizationComponent,
  };
};

export default createVisualization;
