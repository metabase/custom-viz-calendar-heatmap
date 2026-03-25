import type { BaseWidgetProps } from "@metabase/custom-viz";

import type { CellShape } from "../types";

type Settings = { cellShape?: CellShape };

const PREVIEW_SIZE = 20;
const SHAPES: { value: CellShape; rx: number; label: string }[] = [
  { value: "square", rx: 0, label: "Square" },
  { value: "rounded", rx: 4, label: "Rounded" },
  { value: "circle", rx: PREVIEW_SIZE / 2, label: "Circle" },
];

export const CellShapeWidget = ({
  value = "rounded",
  onChange,
}: BaseWidgetProps<CellShape, Settings>) => (
  <div style={{ display: "flex", gap: 8 }}>
    {SHAPES.map(({ value: shape, rx, label }) => (
      <button
        key={shape}
        title={label}
        onClick={() => onChange(shape)}
        style={{
          border: `2px solid ${value === shape ? "#509EE3" : "#ccc"}`,
          borderRadius: 4,
          background: "none",
          cursor: "pointer",
          padding: 4,
          display: "flex",
        }}
      >
        <svg width={PREVIEW_SIZE} height={PREVIEW_SIZE}>
          <rect
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            rx={rx}
            ry={rx}
            fill="#c0c4cc"
          />
        </svg>
      </button>
    ))}
  </div>
);
