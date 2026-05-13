"use client";

import { useEffect, useState } from "react";
import { Bell, Heart, Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import {
  alertTypeLabels,
  getApiErrorMessage,
  listAdminAlerts,
  listPopularFavorites,
  type Alert,
  type PopularFavorite,
} from "@/lib/api";

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [popular, setPopular] = useState<PopularFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([listAdminAlerts({ per_page: 50 }), listPopularFavorites(10)])
      .then(([adminAlerts, popularFavorites]) => {
        if (!active) return;
        setAlerts(adminAlerts.items);
        setPopular(popularFavorites.items);
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, "Chargement impossible."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="dashboard-page">
      <DashboardHeader title="Admin alerts" />
      <main className="dashboard-main space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading backend alerts...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="dashboard-card dashboard-card-body">
              <div className="mb-4 flex items-center gap-2">
                <Bell className="size-5 text-purple" />
                <h2 className="dashboard-card-title">All alerts</h2>
              </div>
              <div className="space-y-3">
                {alerts.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong>{alertTypeLabels[item.type]}</strong>
                      <span className="text-xs text-muted-foreground">
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Product {item.product_id}
                    </p>
                  </article>
                ))}
                {!alerts.length && (
                  <p className="text-sm text-muted-foreground">
                    No alerts found.
                  </p>
                )}
              </div>
            </section>

            <section className="dashboard-card dashboard-card-body">
              <div className="mb-4 flex items-center gap-2">
                <Heart className="size-5 text-purple" />
                <h2 className="dashboard-card-title">Popular favorites</h2>
              </div>
              <div className="space-y-3">
                {popular.map((item) => (
                  <article
                    key={item.product_id}
                    className="rounded-2xl border border-border bg-background p-4"
                  >
                    <strong>{item.product_id}</strong>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.favorite_count} favorites
                    </p>
                  </article>
                ))}
                {!popular.length && (
                  <p className="text-sm text-muted-foreground">
                    No popular favorites found.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
