import type {
  DetailedAnalyticsResponse,
  MergeStatsResponse,
  ShopDetailedAnalytics,
} from "./demo-data/types";

export interface DashboardShopMetric extends ShopDetailedAnalytics {
  id: string;
  label: string;
  sector: "Parapharmacie" | "E-commerce";
  catalogTotal: number;
  commonProducts: number;
  availabilityRate: number;
  discountRate: number;
  cheapestRate: number;
  signal: string;
}

export interface DashboardSummary {
  totalProducts: number;
  totalAvailable: number;
  totalShops: number;
  totalCommon: number;
  totalDiscounts: number;
  totalDiscountValue: number;
  weightedAveragePrice: number;
  availabilityRate: number;
  paraProducts: number;
  retailProducts: number;
  paraShops: number;
  retailShops: number;
  focusValue: string;
  focusText: string;
  focusProgress: number;
}

export function formatDashboardNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
) {
  return value.toLocaleString("fr-FR", options);
}

export function formatDashboardCurrency(value: number) {
  return `${formatDashboardNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} DT`;
}

export function normalizeShopLabel(name: string) {
  return name
    .replace(/_total$/i, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function computeSignal(shop: ShopDetailedAnalytics) {
  if (shop.product_count === 0) return "A surveiller";

  const cheapestRate = shop.cheapest_product_count / shop.product_count;
  const discountRate = shop.discount_count / shop.product_count;
  const availabilityRate = shop.available_count / shop.product_count;

  if (cheapestRate >= 0.22) return "Leader prix";
  if (discountRate >= 0.18) return "Promo active";
  if (availabilityRate < 0.7) return "Stock faible";
  return "Stable";
}

function buildSectorMetrics(
  shops: ShopDetailedAnalytics[],
  sector: "Parapharmacie" | "E-commerce",
  catalogTotal: number,
  commonProducts: number,
): DashboardShopMetric[] {
  return shops.map((shop) => ({
    ...shop,
    id: `${sector}-${shop.name}`,
    label: normalizeShopLabel(shop.name),
    sector,
    catalogTotal,
    commonProducts,
    availabilityRate:
      shop.product_count > 0
        ? (shop.available_count / shop.product_count) * 100
        : 0,
    discountRate:
      shop.product_count > 0
        ? (shop.discount_count / shop.product_count) * 100
        : 0,
    cheapestRate:
      shop.product_count > 0
        ? (shop.cheapest_product_count / shop.product_count) * 100
        : 0,
    signal: computeSignal(shop),
  }));
}

export function buildDashboardShops(
  mergeStats: MergeStatsResponse | null,
  details: DetailedAnalyticsResponse | null,
) {
  const paraCatalogTotal = mergeStats?.para
    ? Object.values(mergeStats.para.shop_totals).reduce(
        (sum, value) => sum + value,
        0,
      )
    : 0;
  const retailCatalogTotal = mergeStats?.retails
    ? Object.values(mergeStats.retails.shop_totals).reduce(
        (sum, value) => sum + value,
        0,
      )
    : 0;

  const paraShops = buildSectorMetrics(
    details?.para_shops || [],
    "Parapharmacie",
    paraCatalogTotal,
    mergeStats?.para?.common_products || 0,
  );
  const retailShops = buildSectorMetrics(
    details?.retails_shops || [],
    "E-commerce",
    retailCatalogTotal,
    mergeStats?.retails?.common_products || 0,
  );

  return [...paraShops, ...retailShops];
}

export function buildDashboardSummary(
  mergeStats: MergeStatsResponse | null,
  shops: DashboardShopMetric[],
): DashboardSummary {
  const paraProducts = mergeStats?.para
    ? Object.values(mergeStats.para.shop_totals).reduce(
        (sum, value) => sum + value,
        0,
      )
    : 0;
  const retailProducts = mergeStats?.retails
    ? Object.values(mergeStats.retails.shop_totals).reduce(
        (sum, value) => sum + value,
        0,
      )
    : 0;
  const totalProducts = paraProducts + retailProducts;
  const totalCommon =
    (mergeStats?.para?.common_products || 0) +
    (mergeStats?.retails?.common_products || 0);
  const totalAvailable = shops.reduce(
    (sum, shop) => sum + shop.available_count,
    0,
  );
  const totalDiscounts = shops.reduce(
    (sum, shop) => sum + shop.discount_count,
    0,
  );
  const totalDiscountValue = shops.reduce(
    (sum, shop) => sum + shop.total_discount_value,
    0,
  );
  const weightedPriceTotal = shops.reduce(
    (sum, shop) => sum + shop.average_price * shop.product_count,
    0,
  );
  const weightedProductTotal = shops.reduce(
    (sum, shop) => sum + shop.product_count,
    0,
  );
  const weightedAveragePrice =
    weightedProductTotal > 0 ? weightedPriceTotal / weightedProductTotal : 0;
  const availabilityRate =
    weightedProductTotal > 0
      ? (totalAvailable / weightedProductTotal) * 100
      : 0;
  const totalShops = shops.length;
  const paraShops = shops.filter(
    (shop) => shop.sector === "Parapharmacie",
  ).length;
  const retailShops = shops.filter(
    (shop) => shop.sector === "E-commerce",
  ).length;
  const leaderSector =
    paraProducts >= retailProducts ? "parapharmacie" : "e-commerce";
  const leaderVolume = Math.max(paraProducts, retailProducts);
  const focusProgress =
    totalProducts > 0
      ? Math.min(100, Math.round((leaderVolume / totalProducts) * 100))
      : 0;

  return {
    totalProducts,
    totalAvailable,
    totalShops,
    totalCommon,
    totalDiscounts,
    totalDiscountValue,
    weightedAveragePrice,
    availabilityRate,
    paraProducts,
    retailProducts,
    paraShops,
    retailShops,
    focusValue: `${availabilityRate.toFixed(0)}%`,
    focusText: `${leaderSector} concentre ${formatDashboardNumber(leaderVolume)} references catalogue et ${formatDashboardNumber(totalDiscounts)} offres en remise suivies.`,
    focusProgress,
  };
}
