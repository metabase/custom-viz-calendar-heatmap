import type {
  ClickObject,
  CreateCustomVisualization,
  CustomVisualizationProps,
} from "@metabase/custom-viz";
import type { Series } from "@metabase/custom-viz";
import * as echarts from "echarts";
import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { getColorScale, TEXT_COLOR, DEFAULT_CALENDAR_COLOR } from "./colors";
import { CellShapeWidget } from "./CellShapeWidget";
import { DateRangeWidget } from "./DateRangeWidget";
import type { CellShape, DateString, Value, Settings } from "./types";
import { StaticVisualizationComponent } from "./StaticVisualization";
import { VisualizationComponent } from "./Visualization";

import {
  getChartData,
  hasDuplicateDates,
  toISODateString,
  getAllDatesForYear,
} from "./data";

const createVisualization: CreateCustomVisualization<Settings> = () => {
  return {
    id: "grid-heatmap",
    getName: () => "Calendar Heatmap",
    minSize: { width: 15, height: 6 },
    defaultSize: { width: 20, height: 6 },
    isSensible() {
      return true;
    },
    checkRenderable(series, settings) {
      // TODO: improve check renderable logic using utils
      if (series.length === 0) {
        throw new Error("No series provided");
      }
      const s = settings ?? {};
      const dimension = s.dimension ?? series[0]?.data?.cols?.[0]?.name;
      const metric = s.metric ?? series[0]?.data?.cols?.[1]?.name;
      if (hasDuplicateDates(series, { ...s, dimension, metric })) {
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
        getDefault(series) {
          // TODO: isa utils required for this.
          return series?.[0]?.data?.cols?.[0]?.name;
        },
        getProps(series) {
          const cols = series?.[0]?.data?.cols ?? [];
          return {
            columns: cols,
            options: cols.map((col) => ({
              name: col.display_name,
              value: col.name,
            })),
          };
        },
      },
      metric: {
        id: "metric",
        section: "Data",
        title: "Metric Column",
        widget: "field",
        getDefault(series) {
          // TODO: isa utils required for this.
          return series?.[0]?.data?.cols?.[1]?.name;
        },
        getProps(series) {
          const cols = series?.[0]?.data?.cols ?? [];
          return {
            columns: cols,
            options: cols.map((col) => ({
              name: col.display_name,
              value: col.name,
            })),
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
