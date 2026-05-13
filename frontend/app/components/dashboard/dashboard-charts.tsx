"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardShopMetric } from "@/lib/dashboard-analytics";
import {
  formatDashboardCurrency,
  formatDashboardNumber,
} from "@/lib/dashboard-analytics";

function useIsLight() {
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsLight(document.documentElement.dataset.theme === "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  return isLight;
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

interface DashboardChartsProps {
  shops: DashboardShopMetric[];
}

export function PerformanceChart({ shops }: DashboardChartsProps) {
  const isLight = useIsLight();
  const gridColor = isLight ? "rgba(20,32,26,0.08)" : "rgba(255,255,255,0.06)";
  const textColor = isLight ? "#647067" : "#7a9080";
  const green = isLight ? "#14b88f" : "#3BDEB9";
  const blue = isLight ? "#3979ff" : "#60a5fa";
  const tooltipStyle = {
    backgroundColor: isLight ? "#ffffff" : "#111815",
    border: `1px solid ${isLight ? "#dfe7dc" : "rgba(255,255,255,0.08)"}`,
    borderRadius: "8px",
    boxShadow: isLight
      ? "0 12px 32px rgba(33,53,41,0.12)"
      : "0 12px 32px rgba(0,0,0,0.4)",
    fontSize: "12px",
    color: isLight ? "#14201a" : "#e8f0eb",
  };

  const performanceData = shops
    .slice()
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 8)
    .map((shop) => ({
      boutique: shop.label,
      produits: shop.product_count,
      disponibles: shop.available_count,
    }));

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">Produits suivis par boutique</h3>
          <div className="dashboard-card-subtitle">
            Volume catalogue et disponibilite observee
          </div>
        </div>
        <button className="dashboard-refresh" type="button">
          <RefreshCw />
          Live data
        </button>
      </div>

      <div className="dashboard-card-body">
        <div className="dashboard-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={blue} stopOpacity={0.24} />
                  <stop offset="95%" stopColor={blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={green} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridColor}
              />
              <XAxis
                dataKey="boutique"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: textColor }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: textColor }}
                width={40}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatDashboardNumber(toNumber(value))}
              />
              <Area
                type="monotone"
                dataKey="produits"
                stroke={blue}
                strokeWidth={2.5}
                fill="url(#colorProducts)"
                name="Produits"
              />
              <Area
                type="monotone"
                dataKey="disponibles"
                stroke={green}
                strokeWidth={2.5}
                fill="url(#colorAvailable)"
                name="Disponibles"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-legend">
          <span className="dashboard-legend-item">
            <span className="dashboard-dot blue" />
            Produits
          </span>
          <span className="dashboard-legend-item">
            <span className="dashboard-dot green" />
            Disponibles
          </span>
        </div>
      </div>
    </section>
  );
}

export function PredictionChart({ shops }: DashboardChartsProps) {
  const isLight = useIsLight();
  const gridColor = isLight ? "rgba(20,32,26,0.08)" : "rgba(255,255,255,0.06)";
  const textColor = isLight ? "#647067" : "#7a9080";
  const green = isLight ? "#14b88f" : "#3BDEB9";
  const blue = isLight ? "#3979ff" : "#60a5fa";
  const tooltipStyle = {
    backgroundColor: isLight ? "#ffffff" : "#111815",
    border: `1px solid ${isLight ? "#dfe7dc" : "rgba(255,255,255,0.08)"}`,
    borderRadius: "8px",
    boxShadow: isLight
      ? "0 12px 32px rgba(33,53,41,0.12)"
      : "0 12px 32px rgba(0,0,0,0.4)",
    fontSize: "12px",
    color: isLight ? "#14201a" : "#e8f0eb",
  };

  const predictionData = shops
    .slice()
    .sort((a, b) => b.average_price - a.average_price)
    .slice(0, 8)
    .map((shop) => ({
      boutique: shop.label,
      prixMoyen: Number(shop.average_price.toFixed(2)),
      remises: shop.discount_count,
    }));

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">Prix moyen et remises</h3>
          <div className="dashboard-card-subtitle">
            Comparatif des boutiques les plus actives
          </div>
        </div>
        <button className="dashboard-refresh" type="button">
          <RefreshCw />
          Live data
        </button>
      </div>

      <div className="dashboard-card-body">
        <div
          className="dashboard-legend"
          style={{
            justifyContent: "flex-start",
            marginTop: 0,
            marginBottom: 12,
          }}
        >
          <span className="dashboard-legend-item">
            <span className="dashboard-dot green" />
            Prix moyen
          </span>
          <span className="dashboard-legend-item">
            <span className="dashboard-dot blue" />
            Produits en remise
          </span>
        </div>

        <div className="dashboard-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={predictionData} barGap={3}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridColor}
              />
              <XAxis
                dataKey="boutique"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: textColor }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: textColor }}
                width={40}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) =>
                  name === "prixMoyen"
                    ? formatDashboardCurrency(toNumber(value))
                    : formatDashboardNumber(toNumber(value))
                }
              />
              <Bar
                dataKey="prixMoyen"
                fill={green}
                radius={[6, 6, 0, 0]}
                name="prixMoyen"
              />
              <Bar
                dataKey="remises"
                fill={blue}
                radius={[6, 6, 0, 0]}
                name="remises"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
