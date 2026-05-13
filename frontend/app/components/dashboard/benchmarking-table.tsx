"use client";

import type { DashboardShopMetric } from "@/lib/dashboard-analytics";
import {
  formatDashboardCurrency,
  formatDashboardNumber,
} from "@/lib/dashboard-analytics";

interface BenchmarkingTableProps {
  shops: DashboardShopMetric[];
}

export function BenchmarkingTable({ shops }: BenchmarkingTableProps) {
  const benchmarkData = shops
    .slice()
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 8);

  return (
    <section className="dashboard-card dashboard-table-card">
      <div className="dashboard-card-header">
        <div>
          <h3 className="dashboard-card-title">Benchmarking actif</h3>
          <div className="dashboard-card-subtitle">
            Boutiques, couverture et signal prix
          </div>
        </div>
      </div>

      <div className="dashboard-card-body">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Boutique</th>
              <th>Secteur</th>
              <th>Produits</th>
              <th>Prix moyen</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {benchmarkData.map((row) => (
              <tr key={row.id}>
                <td>{row.label}</td>
                <td>{row.sector}</td>
                <td>{formatDashboardNumber(row.product_count)}</td>
                <td>{formatDashboardCurrency(row.average_price)}</td>
                <td>
                  <span className="dashboard-badge">{row.signal}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
