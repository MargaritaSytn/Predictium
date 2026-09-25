import { useRef, useState, useEffect } from "react";
import { TimeSeriesPoint, CategoryStat } from "../types";
import styles from "./BarChart.module.css";

const CAT_COLORS: Record<string, string> = {
  sports: "var(--cat-sports)",
  politics: "var(--cat-politics)",
  technology: "var(--cat-tech)",
  crypto: "var(--cat-crypto)",
  space: "var(--cat-space)",
};

interface BarChartProps {
  data: TimeSeriesPoint[] | CategoryStat[];
  labelKey: "date" | "category";
  color?: string;
  height?: number;
  title?: string;
  orientation?: "vertical" | "horizontal";
  formatLabel?: (raw: string) => string;
}

const PAD = { top: 16, right: 8, bottom: 30, left: 36 };
const PAD_H = { top: 8, right: 48, bottom: 8, left: 72 };

export default function BarChart({
  data,
  labelKey,
  color = "var(--accent)",
  height = 180,
  title,
  orientation = "vertical",
  formatLabel,
}: BarChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(400);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSvgWidth(entry.contentRect.width || 400);
    });
    ro.observe(el);
    setSvgWidth(el.clientWidth || 400);
    return () => ro.disconnect();
  }, []);

  const getLabel = (item: TimeSeriesPoint | CategoryStat): string => {
    const raw = labelKey === "date"
      ? (item as TimeSeriesPoint).date
      : (item as CategoryStat).category;
    return formatLabel ? formatLabel(raw) : raw;
  };

  const getValue = (item: TimeSeriesPoint | CategoryStat): number => item.count;

  if (orientation === "horizontal") {
    return (
      <div className={styles.wrapper} ref={wrapperRef}>
        {title && <p className={styles.chartTitle}>{title}</p>}
        <svg
          className={styles.svg}
          viewBox={`0 0 ${svgWidth} ${height}`}
          height={height}
        >
          {data.length === 0 ? (
            <text
              x={svgWidth / 2}
              y={height / 2}
              textAnchor="middle"
              fontSize="12"
              fill="var(--text-muted)"
            >
              Немає даних
            </text>
          ) : (
            renderHorizontal(data, svgWidth, height, labelKey, getLabel, getValue)
          )}
        </svg>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {title && <p className={styles.chartTitle}>{title}</p>}
      <svg
        className={styles.svg}
        viewBox={`0 0 ${svgWidth} ${height}`}
        height={height}
      >
        {data.length === 0 ? (
          <text
            x={svgWidth / 2}
            y={height / 2}
            textAnchor="middle"
            fontSize="12"
            fill="var(--text-muted)"
          >
            Немає даних
          </text>
        ) : (
          renderVertical(data, svgWidth, height, color, getLabel, getValue)
        )}
      </svg>
    </div>
  );
}

function renderVertical(
  data: (TimeSeriesPoint | CategoryStat)[],
  svgWidth: number,
  height: number,
  color: string,
  getLabel: (item: TimeSeriesPoint | CategoryStat) => string,
  getValue: (item: TimeSeriesPoint | CategoryStat) => number,
) {
  const chartW = svgWidth - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;
  const n = data.length;
  const maxValue = Math.max(...data.map(getValue), 1);
  const showLabels = n <= 60;
  const slotW = chartW / n;
  const barW = Math.max(2, Math.min(slotW * 0.65, 32));

  const ticks = [0, 0.5, 1].map((f) => ({
    value: Math.round(maxValue * f),
    y: PAD.top + chartH * (1 - f),
  }));

  return (
    <>
      {/* Grid lines */}
      {ticks.map((t) => (
        <g key={t.y}>
          <line
            x1={PAD.left}
            x2={svgWidth - PAD.right}
            y1={t.y}
            y2={t.y}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 4}
            y={t.y + 3}
            textAnchor="end"
            fontSize="8"
            fill="var(--text-muted)"
          >
            {t.value}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((item, i) => {
        const val = getValue(item);
        const barH = (val / maxValue) * chartH;
        const x = PAD.left + i * slotW + (slotW - barW) / 2;
        const y = PAD.top + chartH - barH;
        const label = getLabel(item);

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="2"
              fill={color}
              opacity="0.85"
            />
            {val > 0 && barH > 14 && (
              <text
                x={x + barW / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize="8"
                fill="var(--text-muted)"
              >
                {val}
              </text>
            )}
            {showLabels && (
              <text
                x={x + barW / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize="8"
                fill="var(--text-muted)"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

function renderHorizontal(
  data: (TimeSeriesPoint | CategoryStat)[],
  svgWidth: number,
  height: number,
  labelKey: "date" | "category",
  getLabel: (item: TimeSeriesPoint | CategoryStat) => string,
  getValue: (item: TimeSeriesPoint | CategoryStat) => number,
) {
  const chartW = svgWidth - PAD_H.left - PAD_H.right;
  const chartH = height - PAD_H.top - PAD_H.bottom;
  const n = data.length;
  const maxValue = Math.max(...data.map(getValue), 1);
  const slotH = chartH / n;
  const barThick = Math.max(8, slotH * 0.55);

  return (
    <>
      {data.map((item, i) => {
        const val = getValue(item);
        const barW = (val / maxValue) * chartW;
        const y = PAD_H.top + i * slotH + (slotH - barThick) / 2;
        const label = getLabel(item);
        const catKey = labelKey === "category" ? (item as CategoryStat).category : "";
        const fillColor = CAT_COLORS[catKey] ?? "var(--accent)";

        return (
          <g key={i}>
            <rect
              x={PAD_H.left}
              y={y}
              width={Math.max(barW, 2)}
              height={barThick}
              rx="3"
              fill={fillColor}
              opacity="0.85"
            />
            <text
              x={PAD_H.left - 6}
              y={y + barThick / 2 + 4}
              textAnchor="end"
              fontSize="9"
              fill="var(--text-secondary)"
            >
              {label}
            </text>
            {val > 0 && (
              <text
                x={PAD_H.left + barW + 6}
                y={y + barThick / 2 + 4}
                fontSize="9"
                fill="var(--text-muted)"
              >
                {val}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}
