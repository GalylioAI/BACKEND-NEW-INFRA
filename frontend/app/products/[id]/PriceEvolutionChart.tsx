"use client";

import { useId, useMemo, useState, useEffect } from "react";

function useIsLight() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const check = () =>
      setLight(document.documentElement.dataset.theme === "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  return light;
}

export type ShopSeries = {
  shop: string;
  color: string;
  values: number[];
};

type Props = {
  series: ShopSeries[];
  months: string[];
  bestPrice: number;
  originalPrice?: number | null;
};

const PAD = { t: 16, r: 16, b: 36, l: 62 };
const W = 600;
const H = 320;
const CW = W - PAD.l - PAD.r;
const CH = H - PAD.t - PAD.b;

function px(i: number, len: number) {
  return PAD.l + (i / (len - 1)) * CW;
}
function py(v: number, min: number, max: number) {
  if (max === min) return PAD.t + CH / 2;
  return PAD.t + CH - ((v - min) / (max - min)) * CH;
}
function fmt(v: number) {
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " DT";
}

function toSafeId(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/g, "-");
}

export default function PriceEvolutionChart({
  series,
  months,
  bestPrice,
  originalPrice,
}: Props) {
  const isLight = useIsLight();
  const [activeShop, setActiveShop] = useState<string | null>(null);
  const [hover, setHover] = useState<{ si: number; pi: number } | null>(null);
  const svgScopeId = useId().replace(/:/g, "-");

  const gridStroke = isLight
    ? "rgba(91,33,182,0.08)"
    : "rgba(255,255,255,0.06)";
  const labelFill = isLight ? "rgba(30,27,75,0.45)" : "rgba(240,240,245,0.45)";
  const axisStroke = isLight ? "rgba(91,33,182,0.12)" : "rgba(255,255,255,0.1)";
  const legendColor = (active: boolean) =>
    isLight
      ? active
        ? "rgba(30,27,75,0.9)"
        : "rgba(30,27,75,0.3)"
      : active
        ? "rgba(240,240,245,0.85)"
        : "rgba(240,240,245,0.3)";
  const tooltipBg = isLight ? "#ffffff" : "#16161f";
  const tooltipTextMuted = isLight
    ? "rgba(30,27,75,0.45)"
    : "rgba(240,240,245,0.45)";
  const tooltipTextSoft = isLight
    ? "rgba(30,27,75,0.5)"
    : "rgba(240,240,245,0.5)";
  const statPillBg = isLight ? "rgba(91,33,182,0.08)" : "rgba(59,222,185,0.1)";
  const statPillBorder = isLight
    ? "rgba(91,33,182,0.18)"
    : "rgba(59,222,185,0.2)";
  const statPillColor = isLight ? "#5B21B6" : "#3BDEB9";
  const oldPriceBg = isLight ? "rgba(30,27,75,0.05)" : "rgba(255,255,255,0.04)";
  const oldPriceBorder = isLight
    ? "rgba(30,27,75,0.08)"
    : "rgba(255,255,255,0.08)";
  const oldPriceColor = isLight
    ? "rgba(30,27,75,0.5)"
    : "rgba(240,240,245,0.5)";
  const dotStroke = isLight ? "rgba(30,27,75,0.6)" : "rgba(255,255,255,0.6)";
  const hoverLine = isLight ? "rgba(30,27,75,0.15)" : "rgba(255,255,255,0.15)";
  const footerColor = isLight ? "rgba(30,27,75,0.3)" : "rgba(240,240,245,0.25)";

  const { min, max, yTicks } = useMemo(() => {
    const all = series.flatMap((s) => s.values);
    const rawMin = Math.min(...all);
    const rawMax = Math.max(...all);
    const pad = (rawMax - rawMin) * 0.12 || rawMax * 0.05;
    const min = Math.max(0, rawMin - pad);
    const max = rawMax + pad;
    const step = Math.ceil((max - min) / 4 / 50) * 50 || 100;
    const tMin = Math.floor(min / step) * step;
    const ticks: number[] = [];
    for (let t = tMin; t <= max + step; t += step) ticks.push(t);
    return { min, max, yTicks: ticks.slice(0, 6) };
  }, [series]);

  const tooltip = useMemo(() => {
    if (!hover) return null;
    const s = series[hover.si];
    if (!s) return null;
    const v = s.values[hover.pi];
    const x = px(hover.pi, months.length);
    const y = py(v, min, max);
    return {
      x,
      y,
      shop: s.shop,
      color: s.color,
      value: v,
      month: months[hover.pi],
    };
  }, [hover, series, months, min, max]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        {series.map((s) => (
          <button
            key={s.shop}
            onClick={() => setActiveShop(activeShop === s.shop ? null : s.shop)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "4px 10px",
              borderRadius: 8,
              outline:
                activeShop === s.shop
                  ? `1px solid ${s.color}`
                  : "1px solid transparent",
              transition: "outline 0.15s ease",
            }}
          >
            <span
              style={{
                width: 24,
                height: 3,
                borderRadius: 99,
                background: s.color,
                display: "block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: legendColor(
                  activeShop === null || activeShop === s.shop,
                ),
                transition: "color 0.15s",
              }}
            >
              {s.shop}
            </span>
          </button>
        ))}

        {/* Stat pills */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: statPillBg,
              border: `1px solid ${statPillBorder}`,
              borderRadius: 6,
              padding: "3px 10px",
              color: statPillColor,
            }}
          >
            Actuel : {fmt(bestPrice)}
          </div>
          {originalPrice && originalPrice > bestPrice && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: oldPriceBg,
                border: `1px solid ${oldPriceBorder}`,
                borderRadius: 6,
                padding: "3px 10px",
                color: oldPriceColor,
                textDecoration: "line-through",
              }}
            >
              {fmt(originalPrice)}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: "relative", width: "100%", overflow: "visible" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.shop}
                id={`area-${svgScopeId}-${toSafeId(s.shop)}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
            <clipPath id={`chart-clip-${svgScopeId}`}>
              <rect x={PAD.l} y={PAD.t} width={CW} height={CH} />
            </clipPath>
          </defs>

          {/* Y grid lines + labels */}
          {yTicks.map((tick) => {
            const yy = py(tick, min, max);
            if (yy < PAD.t - 4 || yy > PAD.t + CH + 4) return null;
            return (
              <g key={tick}>
                <line
                  x1={PAD.l}
                  y1={yy}
                  x2={W - PAD.r}
                  y2={yy}
                  stroke={gridStroke}
                  strokeWidth={1}
                />
                <text
                  x={PAD.l - 8}
                  y={yy + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill={labelFill}
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* X axis baseline */}
          <line
            x1={PAD.l}
            y1={PAD.t + CH}
            x2={W - PAD.r}
            y2={PAD.t + CH}
            stroke={axisStroke}
            strokeWidth={1}
          />

          {/* X labels */}
          {months.map((m, i) => {
            const show =
              months.length <= 8 || i % 2 === 0 || i === months.length - 1;
            if (!show) return null;
            return (
              <text
                key={i}
                x={px(i, months.length)}
                y={H - 6}
                textAnchor="middle"
                fontSize={11}
                fill={labelFill}
                fontFamily="'Plus Jakarta Sans', sans-serif"
              >
                {m}
              </text>
            );
          })}

          {/* Area fills + lines — render under-active ones dimmed */}
          <g clipPath={`url(#chart-clip-${svgScopeId})`}>
            {series.map((s) => {
              const dimmed = activeShop !== null && activeShop !== s.shop;
              const pts = s.values.map(
                (v, i) =>
                  `${px(i, months.length).toFixed(1)},${py(v, min, max).toFixed(1)}`,
              );
              const linePath = pts
                .map((p, i) => (i === 0 ? `M${p}` : `L${p}`))
                .join(" ");
              const areaPath = `${linePath} L${px(months.length - 1, months.length).toFixed(1)},${PAD.t + CH} L${PAD.l},${PAD.t + CH} Z`;

              return (
                <g
                  key={s.shop}
                  style={{ transition: "opacity 0.2s" }}
                  opacity={dimmed ? 0.15 : 1}
                >
                  <path
                    d={areaPath}
                    fill={`url(#area-${svgScopeId}-${toSafeId(s.shop)})`}
                  />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </g>

          {/* Hover vertical line */}
          {tooltip && (
            <line
              x1={tooltip.x}
              y1={PAD.t}
              x2={tooltip.x}
              y2={PAD.t + CH}
              stroke={hoverLine}
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          )}

          {/* Dots — interactive hit areas */}
          {series.map((s, si) => {
            const dimmed = activeShop !== null && activeShop !== s.shop;
            return s.values.map((v, pi) => {
              const cx = px(pi, months.length);
              const cy = py(v, min, max);
              const isHovered = hover?.si === si && hover?.pi === pi;
              return (
                <g
                  key={`${si}-${pi}`}
                  onMouseEnter={() => {
                    if (!dimmed) setHover({ si, pi });
                  }}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "crosshair" }}
                >
                  <circle cx={cx} cy={cy} r={14} fill="transparent" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : 3}
                    fill={s.color}
                    opacity={dimmed ? 0.15 : 1}
                    stroke={isHovered ? dotStroke : "none"}
                    strokeWidth={1.5}
                    style={{ transition: "r 0.1s ease" }}
                  />
                </g>
              );
            });
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: `clamp(8px, calc(${((tooltip.x - PAD.l) / CW) * 100}% - 62px), calc(100% - 132px))`,
              top: `${(tooltip.y / H) * 100}%`,
              transform: "translateY(-110%)",
              pointerEvents: "none",
              background: tooltipBg,
              border: `1px solid ${tooltip.color}44`,
              borderRadius: 10,
              padding: "8px 12px",
              minWidth: 124,
              boxShadow: `0 8px 24px rgba(0,0,0,${isLight ? 0.12 : 0.5}), 0 0 0 1px ${tooltip.color}22`,
              zIndex: 10,
            }}
          >
            <div
              style={{ fontSize: 10, color: tooltipTextMuted, marginBottom: 2 }}
            >
              {tooltip.month}
            </div>
            <div
              style={{ fontSize: 13, fontWeight: 800, color: tooltip.color }}
            >
              {fmt(tooltip.value)}
            </div>
            <div style={{ fontSize: 11, color: tooltipTextSoft, marginTop: 2 }}>
              {tooltip.shop}
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 10,
          color: footerColor,
          textAlign: "right",
          fontStyle: "italic",
        }}
      >
        Tendance estimée · mis à jour régulièrement
      </p>
    </div>
  );
}
