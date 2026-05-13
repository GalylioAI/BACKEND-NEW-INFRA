import { notFound } from "next/navigation";
import {
  getCatalogProduct,
  listCatalogProducts,
} from "../../lib/demo-data/catalog";
import type {
  CatalogProduct,
  CatalogSource,
  CategoryType,
} from "../../lib/demo-data/types";
import {
  bestShopName,
  formatPrice,
  normalizeShopName,
  productCategory,
  savingsPercent,
  sortedShopPrices,
  sourceLabel,
} from "../../lib/product-utils";
import type { ShopSeries } from "./PriceEvolutionChart";
import ProductPageClient from "./ProductPageClient";

/* ── Types ──────────────────────────────────────────────────────────── */
interface ProductDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: CatalogSource }>;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function asText(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  return JSON.stringify(value);
}

function specifications(product: CatalogProduct) {
  const fromApi = Object.entries(product.specifications || {})
    .map(([label, value]) => ({ label, value: asText(value) }))
    .filter((item): item is { label: string; value: string } =>
      Boolean(item.value),
    );

  if (fromApi.length > 0) return fromApi;

  return [
    { label: "Marque", value: product.brand || "Non renseignée" },
    { label: "Catégorie", value: productCategory(product) },
    {
      label: "Disponibilité",
      value: product.inStock ? "En stock" : "Indisponible",
    },
    { label: "Source", value: bestShopName(product) },
  ];
}

function extractProductImages(product: CatalogProduct): string[] {
  const imagesFromArray = Array.isArray(product.images) ? product.images : [];
  const spec = product.specifications || {};
  const specCandidates: string[] = [];

  const maybePush = (value: unknown) => {
    if (typeof value === "string" && value.trim()) specCandidates.push(value);
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === "string" && entry.trim())
          specCandidates.push(entry);
      });
    }
  };

  maybePush((spec as Record<string, unknown>).images);
  maybePush((spec as Record<string, unknown>).gallery);
  maybePush((spec as Record<string, unknown>).photos);
  maybePush((spec as Record<string, unknown>).image_urls);

  return [
    ...new Set(
      [product.image, ...imagesFromArray, ...specCandidates].filter(Boolean),
    ),
  ];
}

function categoryParams(
  product: CatalogProduct,
  source: CatalogSource,
): { category?: string; category_type?: CategoryType } {
  if (source === "para" && "topCategory" in product && product.topCategory) {
    return { category: product.topCategory, category_type: "top_category" };
  }
  if (product.category)
    return { category: product.category, category_type: "subcategory" };
  return {};
}

async function getRecommendations(
  product: CatalogProduct,
  source: CatalogSource,
) {
  try {
    const response = await listCatalogProducts(source, {
      ...categoryParams(product, source),
      limit: 6,
      page: 1,
    });
    return response.products
      .filter((item) => item.id !== product.id)
      .slice(0, 5);
  } catch {
    return [];
  }
}

/* ── Chart helpers ──────────────────────────────────────────────────── */
const SHOP_COLORS = [
  "#56B4E9",
  "#E69F00",
  "#CC79A7",
  "#0072B2",
  "#D55E00",
  "#F0E442",
];

function seededNoise(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297) * 233280;
  return x - Math.floor(x);
}

function buildPriceSeries(
  shopName: string,
  startPrice: number,
  endPrice: number,
  points = 12,
): number[] {
  const seed = shopName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const drop = endPrice - startPrice;
  const series: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const smooth = t * t * (3 - 2 * t);
    const noise = (seededNoise(seed, i) - 0.5) * Math.abs(drop) * 0.18;
    series.push(Math.round(startPrice + drop * smooth + noise));
  }
  series[points - 1] = endPrice;
  return series;
}

function buildMonths(count = 12): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString("fr-FR", { month: "short" }));
  }
  return months;
}

function buildChartSeries(product: CatalogProduct): ShopSeries[] {
  const shops = sortedShopPrices(product);
  if (shops.length === 0) return [];
  return shops.slice(0, 4).map((shop, idx) => {
    const current = shop.price;
    const old =
      shop.oldPrice && shop.oldPrice > current ? shop.oldPrice : current * 1.06;
    return {
      shop: normalizeShopName(shop.shop),
      color: SHOP_COLORS[idx % SHOP_COLORS.length],
      values: buildPriceSeries(shop.shop, old, current),
    };
  });
}

/* ── Page (server component — data fetching only) ───────────────────── */
export default async function ProductDetailsPage({
  params,
  searchParams,
}: ProductDetailsPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const preferredSource =
    query.source === "para" || query.source === "retail"
      ? query.source
      : undefined;
  const result = await getCatalogProduct(id, preferredSource);
  if (!result) notFound();

  const { product, source } = result;
  const stores = sortedShopPrices(product);
  const specs = specifications(product);
  const recommendations = await getRecommendations(product, source);
  const savings = savingsPercent(product);

  function resolveImage(p: CatalogProduct): string {
    return p.image;
  }

  const productImage = resolveImage(product);
  const productImages = extractProductImages({
    ...product,
    image: productImage,
  });
  const category = productCategory(product);
  const chartSeries = buildChartSeries(product);
  const chartMonths = buildMonths(12);
  const availableShopsCount = stores.filter(
    (shop) => shop.available ?? true,
  ).length;
  const totalShopsCount = stores.length;
  const bestGap =
    product.originalPrice && product.originalPrice > product.bestPrice
      ? product.originalPrice - product.bestPrice
      : null;

  return (
    <ProductPageClient
      product={product}
      source={source}
      stores={stores}
      specs={specs}
      recommendations={recommendations}
      savings={savings}
      productImages={productImages}
      category={category}
      chartSeries={chartSeries}
      chartMonths={chartMonths}
      availableShopsCount={availableShopsCount}
      totalShopsCount={totalShopsCount}
      bestGap={bestGap}
    />
  );
}
