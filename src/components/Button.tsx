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

const enabledDefault: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  color: "#374151",
  cursor: "pointer",
};

const enabledHover: CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #d1d5db",
  color: "#111827",
  cursor: "pointer",
};

const enabledActive: CSSProperties = {
  background: "#f3f4f6",
  border: "1px solid #9ca3af",
  cursor: "pointer",
};

const disabledStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  color: "#9ca3af",
  cursor: "default",
};

export function Button({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  let stateStyle: CSSProperties;
  if (disabled) {
    stateStyle = disabledStyle;
  } else if (pressed) {
    stateStyle = enabledActive;
  } else if (hovered) {
    stateStyle = enabledHover;
  } else {
    stateStyle = enabledDefault;
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
