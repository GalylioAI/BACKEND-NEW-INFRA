"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Database,
  LineChart,
  Lock,
  Sparkles,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface ShopDataWidgetProps {
  shopName: string;
  shopLogo: string | null;
  sector: string;
  coverage: string;
  refreshRate: string;
  datasets: string;
  buyerFit: string;
  highlight: string;
  priceLabel: string;
  chartData: { value: number }[];
  accent?: "mint" | "blue" | "amber";
  slug: string;
}

export function ShopDataWidget({
  shopName,
  shopLogo,
  sector,
  coverage,
  refreshRate,
  datasets,
  buyerFit,
  highlight,
  priceLabel,
  chartData,
  accent = "mint",
  slug,
}: ShopDataWidgetProps) {
  const accentClass = `is-${accent}`;
  const initials = shopName.slice(0, 2).toUpperCase();

  return (
    <article className={`dashboard-data-card ${accentClass}`}>
      <div className="dashboard-data-card-glow" />

      <div className="dashboard-data-card-top">
        <div className="dashboard-data-card-logoWrap">
          <div className="dashboard-data-card-logo">
            {shopLogo ? (
              <Image
                src={shopLogo}
                alt={shopName}
                width={74}
                height={74}
                className="object-contain"
              />
            ) : (
              <span className="dashboard-data-card-logoFallback">
                {initials}
              </span>
            )}
          </div>
          <div>
            <span className="dashboard-data-card-sector">{sector}</span>
            <h3>{shopName}</h3>
          </div>
        </div>

        <span className="dashboard-data-card-access">
          <Lock className="size-3" />
          {priceLabel}
        </span>
      </div>

      <p className="dashboard-data-card-highlight">{highlight}</p>

      <div className="dashboard-data-card-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id={`gradient-${shopName}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.34} />
                <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              strokeWidth={2.4}
              fill={`url(#gradient-${shopName})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-data-card-metrics">
        <div className="dashboard-data-card-metric">
          <span>
            <Database className="size-4" /> Coverage
          </span>
          <strong>{coverage}</strong>
        </div>
        <div className="dashboard-data-card-metric">
          <span>
            <LineChart className="size-4" /> Refresh
          </span>
          <strong>{refreshRate}</strong>
        </div>
      </div>

      <div className="dashboard-data-card-panel">
        <div className="dashboard-data-card-row">
          <span>Datasets</span>
          <strong>{datasets}</strong>
        </div>
        <div className="dashboard-data-card-row">
          <span>Buyer fit</span>
          <strong>{buyerFit}</strong>
        </div>
      </div>

      <div className="dashboard-data-card-footer">
        <div className="dashboard-data-card-proof">
          <BadgeCheck className="size-4" />
          Premium B2B pack
        </div>
        <Link
          href={`/dashboard/data-market/${slug}`}
          className="dashboard-data-card-cta"
        >
          <Sparkles className="size-4" />
          Full Data Access
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
