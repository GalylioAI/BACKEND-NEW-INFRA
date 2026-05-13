import { apiFetch } from "./client";
import type {
  DetailedAnalyticsResponse,
  MergeStatsResponse,
  ShopAnalytics,
  StoreProductsAddedResponse,
  StoreProductsRemovedResponse,
} from "./types";

const noStore = { cache: "no-store" as RequestCache };

export function getPriceAnalytics(init?: RequestInit) {
  return apiFetch<ShopAnalytics[]>("/api/v1/analytics/prices", { ...noStore, ...(init || {}) });
}

export function getMergeStats(init?: RequestInit) {
  return apiFetch<MergeStatsResponse>("/api/v1/analytics/merge-stats", {
    ...noStore,
    ...(init || {}),
  });
}

export function getShopDetails(init?: RequestInit) {
  return apiFetch<DetailedAnalyticsResponse>("/api/v1/analytics/shop-details", {
    ...noStore,
    ...(init || {}),
  });
}

export function getStoreProductsAdded(shop: string, source = "retails", limit = 12, init?: RequestInit) {
  return apiFetch<StoreProductsAddedResponse>(`/api/v1/analytics/store-products-added/${encodeURIComponent(shop)}`, {
    ...noStore,
    ...(init || {}),
    query: { source, limit },
  });
}

export function getStoreProductsRemoved(shop: string, source = "retails", limit = 12, init?: RequestInit) {
  return apiFetch<StoreProductsRemovedResponse>(`/api/v1/analytics/store-products-removed/${encodeURIComponent(shop)}`, {
    ...noStore,
    ...(init || {}),
    query: { source, limit },
  });
}
