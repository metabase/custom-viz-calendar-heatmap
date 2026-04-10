import Color from "color";

export const TEXT_COLOR = "#57606a";
export const TEXT_COLOR_DARK = "#c9d1d9"; 
export const DEFAULT_CALENDAR_COLOR = "#85b8e8";
export const EMPTY_CELL_COLOR = "#ebedf0";
export const EMPTY_CELL_COLOR_DARK = "#21262d";

export type ColorMap = Record<
  "empty" | "low" | "medium-low" | "medium-high" | "high",
  string
>;

/** Linear interpolate between two colors (t: 0 = from, 1 = to) */
function lerpColor(from: string, to: string, t: number): string {
  const a = Color(from).rgb().array();
  const b = Color(to).rgb().array();
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return Color.rgb(r, g, bl).string();
}

const LIGHTNESS = 92;
const DARKEN = 0.2;
const SATURATE = 0.1;

export function getColorScale(color: string): ColorMap {
  const lightColor = Color(color).lightness(LIGHTNESS).saturate(SATURATE);
  const darkColor = Color(color).darken(DARKEN).saturate(SATURATE);
  const light = lightColor.string();
  const dark = darkColor.string();
  const scale = (t: number) => lerpColor(light, dark, t);
  const colors = [0, 0.25, 0.5, 0.75, 1].map((value) => scale(value));

  return {
    "empty": colors[0],
    "low": colors[1],
    "medium-low": colors[2],
    "medium-high": colors[3],
    "high": colors[4],
  };
}

export const getCellColor = (
  value: number | undefined,
  max: number,
  colorScale: ColorMap,
): string => {
  if (value === undefined) return EMPTY_CELL_COLOR;
  if (value <= 0) return colorScale["empty"];
  if (value <= max * 0.25) return colorScale["low"];
  if (value <= max * 0.5) return colorScale["medium-low"];
  if (value <= max * 0.75) return colorScale["medium-high"];
  return colorScale["high"];
};
