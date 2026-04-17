import type { CellShape } from "../types";

export const PADDING = 30;
export const CALENDAR_TOP = 24;
export const CALENDAR_DAY_LABEL_WIDTH = 20;
export const CALENDAR_MONTH_LABEL_HEIGHT = 18;
export const CALENDAR_ROWS = 7;
export const CALENDAR_WEEKS = 53;
export const CELL_SIZE_MIN = 12;
export const CELL_SIZE_MAX = 30;
export const VISUALMAP_GAP = 8;
export const VISUALMAP_HEIGHT = 30;

function getCellBorderRadius(cellSize: number): number {
  return Math.max(1, Math.floor((cellSize - CELL_SIZE_MIN) / 3));
}

export function getBorderRadius(
  shape: CellShape | undefined,
  cellSize: number,
): number {
  if (shape === "square") return 0;
  if (shape === "circle") return Math.floor(cellSize / 2);
  return getCellBorderRadius(cellSize);
}

export function getCellSize(width: number): number {
  return Math.max(
    CELL_SIZE_MIN,
    Math.min(
      CELL_SIZE_MAX,
      Math.floor((width - PADDING - CALENDAR_DAY_LABEL_WIDTH) / CALENDAR_WEEKS),
    ),
  );
}

export function getChartWidth(cellSize: number): number {
  return PADDING + CALENDAR_DAY_LABEL_WIDTH + CALENDAR_WEEKS * cellSize;
}

export function getChartHeight(cellSize: number): number {
  return (
    CALENDAR_TOP +
    CALENDAR_MONTH_LABEL_HEIGHT +
    CALENDAR_ROWS * cellSize +
    VISUALMAP_GAP +
    VISUALMAP_HEIGHT
  );
}
