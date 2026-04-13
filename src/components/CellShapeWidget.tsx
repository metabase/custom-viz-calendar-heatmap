import type { BaseWidgetProps } from '@metabase/custom-viz';

import type { CellShape, Settings } from '../types';

const PREVIEW_SIZE = 20;

const SHAPES: { value: CellShape; rx: number; label: string }[] = [
  { value: 'square', rx: 0, label: 'Square' },
  { value: 'rounded', rx: 4, label: 'Rounded square' },
  { value: 'circle', rx: PREVIEW_SIZE / 2, label: 'Circle' },
];

export const CellShapeWidget = ({ value = 'rounded', onChange }: BaseWidgetProps<CellShape, Settings>) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {SHAPES.map(({ value: shape, rx, label }) => (
      <button
        key={shape}
        style={{
          border: `1px solid ${value === shape ? 'var(--mb-color-brand)' : 'var(--mb-color-border)'}`,
          borderRadius: 4,
          background: 'none',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
        }}
        title={label}
        onClick={() => onChange(shape)}
      >
        <svg width={PREVIEW_SIZE} height={PREVIEW_SIZE}>
          <rect
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            rx={rx}
            ry={rx}
            fill="var(--mb-color-brand)"
          />
        </svg>
      </button>
    ))}
  </div>
);
