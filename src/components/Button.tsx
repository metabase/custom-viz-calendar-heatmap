import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";

type ButtonState = "default" | "hover" | "active" | "disabled";

const lightStyles: Record<ButtonState, CSSProperties> = {
  default: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#374151",
    cursor: "pointer",
  },
  hover: {
    background: "#f9fafb",
    border: "1px solid #d1d5db",
    color: "#111827",
    cursor: "pointer",
  },
  active: {
    background: "#f3f4f6",
    border: "1px solid #9ca3af",
    cursor: "pointer",
  },
  disabled: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#9ca3af",
    cursor: "default",
  },
};

const darkStyles: Record<ButtonState, CSSProperties> = {
  default: {
    background: "#21262d",
    border: "1px solid #30363d",
    color: "#c9d1d9",
    cursor: "pointer",
  },
  hover: {
    background: "#30363d",
    border: "1px solid #8b949e",
    color: "#e6edf3",
    cursor: "pointer",
  },
  active: {
    background: "#3d444d",
    border: "1px solid #8b949e",
    cursor: "pointer",
  },
  disabled: {
    background: "#21262d",
    border: "1px solid #30363d",
    color: "#484f58",
    cursor: "default",
  },
};

export function Button({
  children,
  colorScheme,
  disabled,
  onClick,
}: {
  children: ReactNode;
  colorScheme?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const stateStyle = useMemo(() => {
    const styles =
      colorScheme?.toLowerCase() === "dark" ? darkStyles : lightStyles;

    if (disabled) {
      return styles.disabled;
    }

    if (pressed) {
      return styles.active;
    }

    if (hovered) {
      return styles.hover;
    }

    return styles.default;
  }, [colorScheme, disabled, hovered, pressed]);

  return (
    <button
      disabled={disabled}
      type="button"
      style={{
        pointerEvents: "all",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 12,
        padding: "4px 10px",
        transition:
          "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
        ...stateStyle,
      }}
      onClick={onClick}
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
