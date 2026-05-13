"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/header";
import { ShopAnalyticsCard } from "@/components/dashboard/shop-analytics-card";
import { getShopDetails } from "@/lib/demo-data/analytics";
import type { DetailedAnalyticsResponse } from "@/lib/demo-data/types";
import { normalizeShopLabel } from "@/lib/dashboard-analytics";

export default function VeillePage() {
  const [analytics, setAnalytics] = useState<DetailedAnalyticsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setAnalytics(await getShopDetails());
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Veille Produits & marques" />
        <main className="flex items-center justify-center p-6">
          <Loader2 className="size-8 animate-spin text-purple" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Veille Produits & marques" />
        <main className="p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500">
            Erreur: {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Veille Produits & marques" />

      <main className="p-6 space-y-8">
        {analytics?.para_shops && analytics.para_shops.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Parapharmacies
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analytics.para_shops.map((shop) => (
                <ShopAnalyticsCard
                  key={shop.name}
                  shopName={normalizeShopLabel(shop.name)}
                  productCount={shop.product_count}
                  availableCount={shop.available_count}
                  averagePrice={shop.average_price}
                  discountCount={shop.discount_count}
                  totalDiscountValue={shop.total_discount_value}
                  averageDiscountPercent={shop.average_discount_percent}
                  cheapestProductCount={shop.cheapest_product_count}
                />
              ))}
            </div>
          </section>
        )}

        {analytics?.retails_shops && analytics.retails_shops.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              E-commerce
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analytics.retails_shops.map((shop) => (
                <ShopAnalyticsCard
                  key={shop.name}
                  shopName={normalizeShopLabel(shop.name)}
                  productCount={shop.product_count}
                  availableCount={shop.available_count}
                  averagePrice={shop.average_price}
                  discountCount={shop.discount_count}
                  totalDiscountValue={shop.total_discount_value}
                  averageDiscountPercent={shop.average_discount_percent}
                  cheapestProductCount={shop.cheapest_product_count}
                />
              ))}
            </div>
          </section>
        )}

        {(!analytics?.para_shops || analytics.para_shops.length === 0) &&
          (!analytics?.retails_shops ||
            analytics.retails_shops.length === 0) && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Aucune donnee analytique disponible
              </p>
            </div>
          )}
      </main>
    </div>
  );
}
