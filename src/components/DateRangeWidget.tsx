import type { BaseWidgetProps } from "@metabase/custom-viz";

type DateRange = { start?: string; end?: string };
type Settings = { dateRange?: DateRange };

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ccd1d5",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 700,
  color: "#2e353b",
  background: "#fff",
  outline: "none",
  cursor: "pointer",
};

function ResetButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      title="Reset to full range"
      onClick={onClick}
      disabled={disabled}
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        border: "1px solid #ccd1d5",
        borderRadius: 8,
        background: !disabled ? "#f3f4f6" : "#fff",
        cursor: disabled ? "default" : "pointer",
        color: disabled ? "#ccd1d5" : "#74838f",
        padding: 0,
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      <svg
        width="30"
        height="30"
        version="1.1"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        color="currentColor"
      >
        <path d="m77.379 64.039c-3.707 7.2734-10.172 12.762-17.949 15.246-7.7656 2.5234-16.215 1.8359-23.469-1.9102-7.2578-3.7227-12.742-10.18-15.242-17.945-2.5039-7.7695-1.8164-16.211 1.9062-23.469 3.7266-7.2617 10.18-12.746 17.949-15.246 7.7656-2.5 16.207-1.8125 23.469 1.9102l1.6445 0.84375 1.2266-2.3867-0.003906-0.003906c0.44922-0.82031 1.3125-1.3281 2.25-1.3164 0.9375 0.007812 1.7891 0.53516 2.2227 1.3633l3.8125 7.7969v0.003906c0.375 0.70312 0.38281 1.5469 0.019532 2.2578-0.38281 0.69141-1.0625 1.1719-1.8477 1.3008l-8.5352 1.4102c-0.93359 0.16406-1.8789-0.21875-2.4375-0.98047-0.5625-0.76562-0.64062-1.7812-0.20703-2.625l1.2148-2.3711-1.6445-0.84375c-7.125-3.6562-15.547-3.7891-22.785-0.35938-7.2383 3.4297-12.469 10.031-14.152 17.859-1.6875 7.832 0.36328 16 5.5508 22.102 5.1836 6.1055 12.914 9.4492 20.914 9.0508 8-0.39844 15.355-4.4922 19.91-11.082 4.5547-6.5859 5.7852-14.918 3.332-22.543-0.42578-1.3125 0.29688-2.7227 1.6094-3.1445s2.7227 0.29688 3.1445 1.6133c2.5234 7.7617 1.8398 16.211-1.9023 23.469z" />
      </svg>
    </button>
  );
}

export const DateRangeWidget = ({
  value,
  onChange,
  minDate,
  maxDate,
}: BaseWidgetProps<DateRange | undefined, Settings> & {
  minDate?: string;
  maxDate?: string;
}) => {
  const start = value?.start ?? "";
  const end = value?.end ?? "";
  const isFiltered = Boolean(start || end);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="date"
        value={start}
        min={minDate}
        max={end || maxDate}
        onChange={(e) =>
          onChange({ ...value, start: e.target.value || undefined })
        }
        style={INPUT_STYLE}
      />
      <input
        type="date"
        value={end}
        min={start || minDate}
        max={maxDate}
        onChange={(e) =>
          onChange({ ...value, end: e.target.value || undefined })
        }
        style={INPUT_STYLE}
      />
      <ResetButton onClick={() => onChange(undefined)} disabled={!isFiltered} />
    </div>
  );
};
