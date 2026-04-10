import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

const base: CSSProperties = {
  pointerEvents: "all",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  padding: "4px 10px",
  transition:
    "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
};

const lightStyles = {
  default: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#374151",
    cursor: "pointer",
  } satisfies CSSProperties,
  hover: {
    background: "#f9fafb",
    border: "1px solid #d1d5db",
    color: "#111827",
    cursor: "pointer",
  } satisfies CSSProperties,
  active: {
    background: "#f3f4f6",
    border: "1px solid #9ca3af",
    cursor: "pointer",
  } satisfies CSSProperties,
  disabled: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#9ca3af",
    cursor: "default",
  } satisfies CSSProperties,
};

const darkStyles = {
  default: {
    background: "#21262d",
    border: "1px solid #30363d",
    color: "#c9d1d9",
    cursor: "pointer",
  } satisfies CSSProperties,
  hover: {
    background: "#30363d",
    border: "1px solid #8b949e",
    color: "#e6edf3",
    cursor: "pointer",
  } satisfies CSSProperties,
  active: {
    background: "#3d444d",
    border: "1px solid #8b949e",
    cursor: "pointer",
  } satisfies CSSProperties,
  disabled: {
    background: "#21262d",
    border: "1px solid #30363d",
    color: "#484f58",
    cursor: "default",
  } satisfies CSSProperties,
};

export function Button({
  children,
  onClick,
  disabled,
  colorScheme,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  colorScheme?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const styles =
    colorScheme?.toLowerCase() === "dark" ? darkStyles : lightStyles;

  let stateStyle: CSSProperties;
  if (disabled) {
    stateStyle = styles.disabled;
  } else if (pressed) {
    stateStyle = styles.active;
  } else if (hovered) {
    stateStyle = styles.hover;
  } else {
    stateStyle = styles.default;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...stateStyle }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {children}
    </button>
  );
}
