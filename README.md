# @metabase/custom-viz-calendar-heatmap

<div align="center">
  [![Build](https://github.com/metabase/custom-viz-calendar-heatmap/actions/workflows/build.yml/badge.svg)](https://github.com/metabase/custom-viz-calendar-heatmap/actions/workflows/build.yml)
  [![Type Check](https://github.com/metabase/custom-viz-calendar-heatmap/actions/workflows/type-check.yml/badge.svg)](https://github.com/metabase/custom-viz-calendar-heatmap/actions/workflows/type-check.yml)
  [![Prettier](https://github.com/metabase/custom-viz-calendar-heatmap/actions/workflows/prettier.yml/badge.svg)](https://github.com/metabase/custom-viz-calendar-heatmap/actions/workflows/prettier.yml)
</div>

A Calendar Heatmap custom visualization for Metabase. Renders a GitHub-style year calendar where each cell represents a day, colored by an aggregated metric value.

Requires Metabase `>= 59`.

## Data requirements

The query must return two columns:

- **Date column** (dimension) — used as the day for each cell.
- **Numeric column** (metric) — used to color each cell.

Rows must be aggregated by day; multiple rows with the same date will fail to render.

## Settings

| Setting       | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| Date column   | Date dimension column. Auto-selected from the first date column.    |
| Metric column | Numeric metric column. Auto-selected from the first numeric column. |
| Color         | Base color used to build the heatmap scale.                         |
| Cell Shape    | Square, rounded, or circle.                                         |

## Development

```bash
npm install
npm run dev         # watch build + preview
npm run build       # production build to dist/
```

The build output in `dist/` along with `metabase-plugin.json` and `public/assets/` is what Metabase loads as the plugin.

## Other scripts

```bash
npm run prettier    # format
npm run type-check  # tsc --noEmit
```
