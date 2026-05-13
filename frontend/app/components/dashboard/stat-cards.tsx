"use client";

import { PackageSearch, Repeat2, Store } from "lucide-react";

import type { MergeStatsResponse } from "@/lib/demo-data/types";
import {
  buildDashboardSummary,
  formatDashboardCurrency,
  formatDashboardNumber,
} from "@/lib/dashboard-analytics";
import type { DashboardShopMetric } from "@/lib/dashboard-analytics";

interface StatCardsProps {
  mergeStats: MergeStatsResponse | null;
  shops: DashboardShopMetric[];
}

export function StatCards({ mergeStats, shops }: StatCardsProps) {
  const summary = buildDashboardSummary(mergeStats, shops);

  return (
    <>
      <section className="dashboard-stats-grid">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Produits compares</span>
            <span className="dashboard-stat-icon">
              <PackageSearch />
            </span>
          </div>
          <div className="dashboard-stat-value">
            {formatDashboardNumber(summary.totalProducts)}
          </div>
          <div className="dashboard-stat-note">
            {formatDashboardNumber(summary.retailProducts)} retail et{" "}
            {formatDashboardNumber(summary.paraProducts)} parapharmacie.
          </div>
          <div className="dashboard-progress">
            <span
              style={{ width: `${Math.min(100, summary.availabilityRate)}%` }}
            />
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Magasins indexes</span>
            <span className="dashboard-stat-icon">
              <Store />
            </span>
          </div>
          <div className="dashboard-stat-value">
            {formatDashboardNumber(summary.totalShops)}
          </div>
          <div className="dashboard-stat-note">
            {summary.paraShops} parapharmacies, {summary.retailShops}{" "}
            e-commerce.
          </div>
          <div className="dashboard-progress">
            <span
              style={{ width: `${Math.min(100, summary.totalShops * 10)}%` }}
            />
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-top">
            <span className="dashboard-stat-label">Prix croises</span>
            <span className="dashboard-stat-icon">
              <Repeat2 />
            </span>
          </div>
          <div className="dashboard-stat-value">
            {formatDashboardNumber(summary.totalCommon)}
          </div>
          <div className="dashboard-stat-note">
            {formatDashboardNumber(summary.totalDiscounts)} remises,{" "}
            {formatDashboardCurrency(summary.totalDiscountValue)} d&apos;ecarts
            observes.
          </div>
          <div className="dashboard-progress">
            <span
              style={{
                width: `${Math.min(100, summary.totalCommon > 0 ? (summary.totalDiscounts / summary.totalCommon) * 100 : 0)}%`,
              }}
            />
          </div>
        </article>
      </section>

      {mergeStats?.para && (
        <section className="dashboard-card dashboard-card-body mb-4">
          <div
            className="dashboard-card-header"
            style={{ padding: 0, marginBottom: 14 }}
          >
            <div>
              <h3 className="dashboard-card-title">Parapharmacies</h3>
              <div className="dashboard-card-subtitle">
                Volume catalogue par boutique
              </div>
            </div>
            <span className="dashboard-badge">
              {formatDashboardNumber(mergeStats.para.common_products)} communs
            </span>
          </div>
          <div className="dashboard-shop-grid">
            {Object.entries(mergeStats.para.shop_totals).map(
              ([shopName, total]) => (
                <div key={shopName} className="dashboard-mini-stat">
                  <span>
                    {shopName.replace(/_total$/i, "").replace(/_/g, " ")}
                  </span>
                  <strong>{formatDashboardNumber(total)}</strong>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {mergeStats?.retails && (
        <section className="dashboard-card dashboard-card-body mb-4">
          <div
            className="dashboard-card-header"
            style={{ padding: 0, marginBottom: 14 }}
          >
            <div>
              <h3 className="dashboard-card-title">E-commerce</h3>
              <div className="dashboard-card-subtitle">
                Couverture observee sur les enseignes retail
              </div>
            </div>
            <span className="dashboard-badge">
              {formatDashboardNumber(mergeStats.retails.common_products)}{" "}
              communs
            </span>
          </div>
          <div className="dashboard-shop-grid">
            {Object.entries(mergeStats.retails.shop_totals).map(
              ([shopName, total]) => (
                <div key={shopName} className="dashboard-mini-stat">
                  <span>
                    {shopName.replace(/_total$/i, "").replace(/_/g, " ")}
                  </span>
                  <strong>{formatDashboardNumber(total)}</strong>
                </div>
              ),
            )}
          </div>
        </section>
      )}
    </>
  );
}
