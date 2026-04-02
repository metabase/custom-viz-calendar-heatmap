import type { CreateCustomVisualization } from "@metabase/custom-viz";
import { defineSetting } from "@metabase/custom-viz";
import { DEFAULT_CALENDAR_COLOR } from "./utils/colors";
import { CellShapeWidget } from "./components/CellShapeWidget";
import type { Settings } from "./types";
import { StaticVisualizationComponent } from "./StaticVisualization";
import { VisualizationComponent } from "./Visualization";

import { hasDuplicateDates } from "./utils/data";
import { findDefaultDimensionName, findDefaultMetricName, isDimensionCol, isMetricCol } from "./utils/isa";

const createVisualization: CreateCustomVisualization<Settings> = () => {
  return {
    id: "grid-heatmap",
    getName: () => "Calendar Heatmap",
    minSize: { width: 15, height: 6 },
    defaultSize: { width: 20, height: 6 },
    checkRenderable(series, settings) {
      if (series.length === 0) {
        throw new Error("No series provided");
      }
      const cols = series[0]?.data?.cols ?? [];
      const s = settings ?? {};
      const dimensionName = s.dimension ?? findDefaultDimensionName(cols);
      const metricName = s.metric ?? findDefaultMetricName(cols);
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
      dimension: defineSetting({
        id: "dimension",
        section: "Data",
        title: "Date Column",
        widget: "field",
        getDefault: (series) => findDefaultDimensionName(series?.[0]?.data?.cols ?? []),
        getProps: (series) => {
          const cols = series?.[0]?.data?.cols ?? [];
          const dimensionCols = cols.filter(isDimensionCol);
          return {
            columns: dimensionCols,
            options: dimensionCols.map(({ display_name, name }) => ({ name: display_name, value: name })),
          };
        },
      }),
      metric: defineSetting({
        id: "metric",
        section: "Data",
        title: "Metric Column",
        widget: "field",
        getDefault: (series) => findDefaultMetricName(series?.[0]?.data?.cols ?? []),
        getProps: (series) => {
          const cols = series?.[0]?.data?.cols ?? [];
          const metricCols = cols.filter(isMetricCol);
          return {
            columns: metricCols,
            options: metricCols.map(({ display_name, name }) => ({ name: display_name, value: name })),
          };
        },
      }),
      color: defineSetting({
        id: "color",
        section: "Display",
        title: "Color",
        widget: "color",
        getDefault: () => DEFAULT_CALENDAR_COLOR,
        getProps: () => ({}),
      }),
      cellShape: defineSetting({
        id: "cellShape",
        section: "Display",
        title: "Cell Shape",
        widget: CellShapeWidget,
        getDefault: () => "rounded",
        getProps: () => ({}),
      }),
    },
    VisualizationComponent,
    StaticVisualizationComponent,
  };
};

export default createVisualization;
