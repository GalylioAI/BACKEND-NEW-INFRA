import {
  getMergeStats,
  getPriceAnalytics,
  getShopDetails,
  getStoreProductsAdded,
  getStoreProductsRemoved,
} from "./demo-data/analytics";
import {
  getParaCategories,
  getParaCategoryAnalytics,
  getParaProduct,
  getProduct,
  getProductCategories,
  getProductCategoryAnalytics,
  getRandomParaProducts,
  getRandomProducts,
  listParaProducts,
  listProducts,
  searchParaProducts,
  searchProducts,
} from "./demo-data/catalog";
import type {
  CategoryAnalytics,
  CatalogProduct,
  ParaProduct,
  Product,
  ProductSearchResult,
  ShopDetailedAnalytics,
  ShopPrice,
  StoreProductAdded,
  StoreProductsRemovedResponse,
} from "./demo-data/types";
import {
  formatPrice,
  productCategory,
  safeImageUrl,
  sortedShopPrices,
} from "./product-utils";

type SourceKind = "para" | "retail";
type Accent = "mint" | "blue" | "amber";

export interface DataMarketStoreSummary {
  slug: string;
  shopName: string;
  shopLogo: string | null;
  sector: string;
  coverage: string;
  refreshRate: string;
  datasets: string;
  buyerFit: string;
  highlight: string;
  priceLabel: string;
  accent: Accent;
  chartData: { value: number }[];
  priceValue: string;
  source: SourceKind;
  aliases: string[];
}

export interface DataMarketPreviewRow {
  productId: string;
  title: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  oldPrice: number | null;
  inStock: boolean;
  productUrl: string | null;
  comparedOffers: number;
}

export interface DataMarketFeaturedProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  bestPrice: number;
  storePrice: number;
  comparedOffers: number;
  inStock: boolean;
  description: string;
}

export interface DataMarketDetail {
  store: DataMarketStoreSummary;
  averagePrice: number;
  productCount: number;
  availableCount: number;
  totalPrice: number;
  cheapestProductCount: number;
  discountCount: number;
  totalDiscountValue: number;
  averageDiscountPercent: number;
  catalogTotal: number;
  commonProducts: number;
  priceIndexAverage: number;
  categories: string[];
  selectedCategory: string;
  categoryAnalytics: CategoryAnalytics | null;
  previewRows: DataMarketPreviewRow[];
  searchResults: ProductSearchResult[];
  randomProducts: CatalogProduct[];
  featuredProduct: DataMarketFeaturedProduct | null;
  productsAdded: StoreProductAdded[];
  productsAddedError: string | null;
  productsRemoved: StoreProductAdded[];
  productsRemovedError: string | null;
  includedFields: string[];
  dataset: Record<string, unknown>;
}

const accentCycle: Accent[] = ["mint", "blue", "amber"];

const storeMeta: Record<
  string,
  {
    shopName: string;
    logo: string | null;
    source: SourceKind;
    datasets: string;
    buyerFit: string;
    highlight: string;
    priceValue: string;
    domain?: string;
  }
> = {
  parashop: {
    shopName: "Parashop",
    logo: "/images/parashop.png",
    source: "para",
    datasets: "Pricing, stock, promos, category depth",
    buyerFit: "Brands, distributors, retail media teams",
    highlight: "Fast-moving skincare and wellness demand signals",
    priceValue: "1,490 DT / month",
    domain: "parashop.tn",
  },
  "pharma-shop": {
    shopName: "Pharma Shop",
    logo: "/images/parahouse.png",
    source: "para",
    datasets: "Price history, assortment shifts, promo bursts",
    buyerFit: "Labs, category managers, private equity",
    highlight: "High-value data on care, baby and hygiene ranges",
    priceValue: "1,290 DT / month",
    domain: "pharmashop.tn",
  },
  parafendri: {
    shopName: "Parafendri",
    logo: "/images/parafendri.jpg",
    source: "para",
    datasets: "Availability, pricing ladders, new SKU detection",
    buyerFit: "Market intelligence and sourcing teams",
    highlight: "Useful for competitive assortment mapping",
    priceValue: "990 DT / month",
    domain: "parafendri.tn",
  },
  mytek: {
    shopName: "Mytek",
    logo: "/images/logo/logo.svg",
    source: "retail",
    datasets: "Electronics pricing, stock gaps, promo monitoring",
    buyerFit: "Tech brands and pricing teams",
    highlight: "Deep signal on computing, accessories and electronics",
    priceValue: "1,790 DT / month",
    domain: "mytek.tn",
  },
  spacenet: {
    shopName: "Spacenet",
    logo: "/images/logo/logo.svg",
    source: "retail",
    datasets: "Assortment breadth, promo cadence, price pressure",
    buyerFit: "Retail intelligence and category teams",
    highlight: "Strong read on long-tail electronics assortment",
    priceValue: "1,690 DT / month",
    domain: "spacenet.tn",
  },
  tunisianet: {
    shopName: "Tunisianet",
    logo: "/images/logo/logo.svg",
    source: "retail",
    datasets: "Price tracking, availability and competing offers",
    buyerFit: "Commercial strategy and brand teams",
    highlight: "Reliable signal on consumer electronics and IT pricing",
    priceValue: "1,640 DT / month",
    domain: "tunisianet.com.tn",
  },
  darty: {
    shopName: "Darty",
    logo: "/images/darty-logo.png",
    source: "retail",
    datasets: "Launch tracking, discount alerts, appliance pricing",
    buyerFit: "Tech brands and retail intelligence teams",
    highlight: "Strong signal set for electronics and appliance pricing",
    priceValue: "1,790 DT / month",
    domain: "darty.com.tn",
  },
  technopro: {
    shopName: "Technopro",
    logo: "/images/logo/logo.svg",
    source: "retail",
    datasets: "Catalog pricing, stock activity and market comparison",
    buyerFit: "Brand, distribution and reseller teams",
    highlight: "Useful competitive set for mass electronics and appliances",
    priceValue: "1,590 DT / month",
    domain: "technopro.com.tn",
  },
};

const includedFields = [
  "id",
  "name",
  "brand",
  "category",
  "topCategory",
  "bestPrice",
  "originalPrice",
  "image",
  "description",
  "inStock",
  "shopPrices[].shop",
  "shopPrices[].price",
  "shopPrices[].oldPrice",
  "shopPrices[].available",
  "shopPrices[].url",
];

const fallbackChartData = [
  { value: 20 },
  { value: 24 },
  { value: 30 },
  { value: 34 },
  { value: 36 },
  { value: 42 },
];

function buildFallbackSummary(
  slug: string,
  index: number,
): DataMarketStoreSummary {
  const meta = storeMeta[slug];

  return {
    slug,
    shopName: meta.shopName,
    shopLogo: meta.logo,
    sector: sourceLabel(meta.source),
    coverage: "Demo data snapshot",
    refreshRate: "Local preview · static dataset",
    datasets: meta.datasets,
    buyerFit: meta.buyerFit,
    highlight: `${meta.highlight} Demo metrics are generated locally for this preview.`,
    priceLabel: "Full Data Access",
    accent: accentCycle[index % accentCycle.length],
    chartData: fallbackChartData,
    priceValue: meta.priceValue,
    source: meta.source,
    aliases: slug === "technopro" ? ["technopro", "oktek"] : [slug],
  };
}

function buildFallbackDetail(store: DataMarketStoreSummary): DataMarketDetail {
  const dataset = {
    store: {
      slug: store.slug,
      name: store.shopName,
      sector: store.sector,
      price_value: store.priceValue,
    },
    analytics: {
      average_price: 0,
      product_count: 0,
      available_count: 0,
      total_price: 0,
      cheapest_product_count: 0,
      discount_count: 0,
      total_discount_value: 0,
      average_discount_percent: 0,
      catalog_total: 0,
      common_products: 0,
    },
    categories: ["Catalogue"],
    selected_category: "Catalogue",
    category_analytics: null,
    featured_product: null,
    search_results: [],
    random_products: [],
    preview_rows: [],
    products_added: [],
    products_removed: [],
    included_fields: includedFields,
    exported_at: new Date().toISOString(),
  };

  return {
    store,
    averagePrice: 0,
    productCount: 0,
    availableCount: 0,
    totalPrice: 0,
    cheapestProductCount: 0,
    discountCount: 0,
    totalDiscountValue: 0,
    averageDiscountPercent: 0,
    catalogTotal: 0,
    commonProducts: 0,
    priceIndexAverage: 0,
    categories: ["Catalogue"],
    selectedCategory: "Catalogue",
    categoryAnalytics: null,
    previewRows: [],
    searchResults: [],
    randomProducts: [],
    featuredProduct: null,
    productsAdded: [],
    productsAddedError: "Backend unavailable",
    productsRemoved: [],
    productsRemovedError: "Backend unavailable",
    includedFields,
    dataset,
  };
}

function canonicalShopName(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-");
  if (normalized === "oktek") return "technopro";
  if (normalized === "para-fendri") return "parafendri";
  if (normalized === "pharmashop") return "pharma-shop";
  return normalized;
}

function displayShopName(value: string) {
  const canonical = canonicalShopName(value);
  return (
    storeMeta[canonical]?.shopName ||
    canonical.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
  );
}

function sourceLabel(source: SourceKind) {
  return source === "para" ? "Parapharmacie" : "E-commerce";
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function chartFromAnalytics(detail?: ShopDetailedAnalytics | null) {
  if (!detail)
    return [
      { value: 20 },
      { value: 24 },
      { value: 30 },
      { value: 34 },
      { value: 36 },
      { value: 42 },
    ];

  const base = Math.max(12, Math.round(detail.average_price / 18));
  const availability =
    detail.product_count > 0
      ? Math.round((detail.available_count / detail.product_count) * 100)
      : 0;
  const discounts = Math.round(detail.discount_count / 12);
  const cheapest = Math.round(detail.cheapest_product_count / 22);
  const promo = Math.round(detail.average_discount_percent * 2);

  return [
    { value: Math.max(8, base - 6) },
    { value: base },
    { value: base + discounts },
    { value: base + cheapest },
    { value: base + promo },
    { value: Math.max(base + 4, availability) },
  ];
}

function findShopPrice(product: CatalogProduct, aliases: string[]) {
  return (
    (product.shopPrices || []).find((price) =>
      aliases.includes(canonicalShopName(price.shop)),
    ) || null
  );
}

function toPreviewRow(
  product: CatalogProduct,
  shopPrice: ShopPrice,
): DataMarketPreviewRow {
  return {
    productId: product.id,
    title: product.name,
    brand: product.brand,
    category: productCategory(product),
    image: safeImageUrl(product.image),
    price: shopPrice.price,
    oldPrice: shopPrice.oldPrice ?? null,
    inStock: Boolean(shopPrice.available ?? product.inStock),
    productUrl: shopPrice.url || null,
    comparedOffers: (product.shopPrices || []).length,
  };
}

function pickSearchTerm(category: string, fallback: string) {
  const firstWord = category.split(/[\s/&-]+/).find(Boolean);
  return firstWord && firstWord.length > 2 ? firstWord : fallback;
}

async function getPreviewProducts(source: SourceKind, aliases: string[]) {
  const firstPage =
    source === "para"
      ? await listParaProducts({ page: 1, limit: 24 })
      : await listProducts({ page: 1, limit: 24 });

  let matches = firstPage.products
    .filter((product) => findShopPrice(product, aliases))
    .slice(0, 6);

  if (matches.length < 4) {
    const secondPage =
      source === "para"
        ? await listParaProducts({ page: 2, limit: 24 })
        : await listProducts({ page: 2, limit: 24 });

    const more = secondPage.products.filter((product) =>
      findShopPrice(product, aliases),
    );
    matches = [...matches, ...more].slice(0, 6);
  }

  return matches;
}

function buildSummary(
  slug: string,
  detailByShop: Map<string, ShopDetailedAnalytics>,
  catalogTotals: Map<string, number>,
  commonByShop: Map<string, number>,
  priceByShop: Map<string, number>,
  aliases: string[],
  index: number,
): DataMarketStoreSummary {
  const meta = storeMeta[slug];
  const detail = detailByShop.get(slug);
  const coverageValue = catalogTotals.get(slug) ?? detail?.product_count ?? 0;
  const avgPrice = priceByShop.get(slug) ?? detail?.average_price ?? 0;
  const commonProducts = commonByShop.get(slug) ?? 0;

  return {
    slug,
    shopName: meta.shopName,
    shopLogo: meta.logo,
    sector: sourceLabel(meta.source),
    coverage: `${formatCompact(coverageValue)} references`,
    refreshRate: `Local demo sync · ${commonProducts} produits communs`,
    datasets: meta.datasets,
    buyerFit: meta.buyerFit,
    highlight: `${meta.highlight} Prix moyen observe: ${formatPrice(avgPrice)}.`,
    priceLabel: "Full Data Access",
    accent: accentCycle[index % accentCycle.length],
    chartData: chartFromAnalytics(detail),
    priceValue: meta.priceValue,
    source: meta.source,
    aliases,
  };
}

export async function getDataMarketStores() {
  try {
    const [priceAnalytics, mergeStats, shopDetails] = await Promise.all([
      getPriceAnalytics(),
      getMergeStats(),
      getShopDetails(),
    ]);

    const detailByShop = new Map<string, ShopDetailedAnalytics>();
    shopDetails.para_shops.forEach((shop) =>
      detailByShop.set(canonicalShopName(shop.name), shop),
    );
    shopDetails.retails_shops.forEach((shop) =>
      detailByShop.set(canonicalShopName(shop.name), shop),
    );

    const priceByShop = new Map<string, number>();
    priceAnalytics.forEach((shop) =>
      priceByShop.set(canonicalShopName(shop.name), shop.average_price),
    );

    const catalogTotals = new Map<string, number>();
    const commonByShop = new Map<string, number>();

    if (mergeStats.para) {
      Object.entries(mergeStats.para.shop_totals).forEach(([name, total]) => {
        catalogTotals.set(
          canonicalShopName(name.replace(/_total$/i, "")),
          total,
        );
      });
      shopDetails.para_shops.forEach((shop) => {
        commonByShop.set(
          canonicalShopName(shop.name),
          mergeStats.para?.common_products || 0,
        );
      });
    }

    if (mergeStats.retails) {
      Object.entries(mergeStats.retails.shop_totals).forEach(
        ([name, total]) => {
          catalogTotals.set(
            canonicalShopName(name.replace(/_total$/i, "")),
            total,
          );
        },
      );
      shopDetails.retails_shops.forEach((shop) => {
        commonByShop.set(
          canonicalShopName(shop.name),
          mergeStats.retails?.common_products || 0,
        );
      });
    }

    const rawNames = new Set<string>();
    priceAnalytics.forEach((shop) =>
      rawNames.add(canonicalShopName(shop.name)),
    );
    shopDetails.para_shops.forEach((shop) =>
      rawNames.add(canonicalShopName(shop.name)),
    );
    shopDetails.retails_shops.forEach((shop) =>
      rawNames.add(canonicalShopName(shop.name)),
    );
    catalogTotals.forEach((_, key) => rawNames.add(key));

    const slugs = [...rawNames]
      .filter((name) => storeMeta[name])
      .sort((a, b) => displayShopName(a).localeCompare(displayShopName(b)));

    return slugs.map((slug, index) => {
      const aliases = slug === "technopro" ? ["technopro", "oktek"] : [slug];
      return buildSummary(
        slug,
        detailByShop,
        catalogTotals,
        commonByShop,
        priceByShop,
        aliases,
        index,
      );
    });
  } catch {
    return Object.keys(storeMeta).map((slug, index) =>
      buildFallbackSummary(slug, index),
    );
  }
}

export async function getDataMarketStore(slug: string) {
  const stores = await getDataMarketStores();
  return stores.find((store) => store.slug === slug) || null;
}

export async function getDataMarketStoreDetail(
  slug: string,
): Promise<DataMarketDetail | null> {
  const fallbackStore = buildFallbackSummary(slug, 0);

  try {
    const [store, mergeStats, shopDetails, priceAnalytics] = await Promise.all([
      getDataMarketStore(slug),
      getMergeStats(),
      getShopDetails(),
      getPriceAnalytics(),
    ]);

    const activeStore = store || fallbackStore;
    const canonical = activeStore.slug;
    const detail =
      [...shopDetails.para_shops, ...shopDetails.retails_shops].find(
        (shop) => canonicalShopName(shop.name) === canonical,
      ) || null;

    const priceAverage =
      priceAnalytics.find((shop) => canonicalShopName(shop.name) === canonical)
        ?.average_price ||
      detail?.average_price ||
      0;

    const categories =
      activeStore.source === "para"
        ? await getParaCategories("top_category")
        : await getProductCategories("subcategory");

    const previewProducts = await getPreviewProducts(
      activeStore.source,
      activeStore.aliases,
    );
    const previewRows = previewProducts
      .map((product) => {
        const price = findShopPrice(product, activeStore.aliases);
        return price ? toPreviewRow(product, price) : null;
      })
      .filter((row): row is DataMarketPreviewRow => Boolean(row));

    const selectedCategory = previewProducts[0]
      ? productCategory(previewProducts[0])
      : categories[0] || "Catalogue";

    const [
      categoryAnalytics,
      randomProducts,
      searchResults,
      productsAddedResult,
      productsRemovedResult,
    ] = await Promise.all([
      activeStore.source === "para"
        ? getParaCategoryAnalytics(selectedCategory).catch(() => null)
        : getProductCategoryAnalytics(selectedCategory).catch(() => null),
      activeStore.source === "para"
        ? getRandomParaProducts(selectedCategory, "top_category", 4).catch(
            () => [] as ParaProduct[],
          )
        : getRandomProducts(selectedCategory, "subcategory", 4).catch(
            () => [] as Product[],
          ),
      activeStore.source === "para"
        ? searchParaProducts(
            pickSearchTerm(selectedCategory, activeStore.shopName),
            6,
            activeStore.slug,
          ).catch(() => [] as ProductSearchResult[])
        : searchProducts(
            pickSearchTerm(selectedCategory, activeStore.shopName),
            6,
            activeStore.slug,
          ).catch(() => [] as ProductSearchResult[]),
      getStoreProductsAdded(activeStore.slug, activeStore.source, 8)
        .then((data) => ({ data, error: null as string | null }))
        .catch((error: unknown) => ({
          data: {
            shop: activeStore.slug,
            source: activeStore.source,
            total: 0,
            products_added: [],
          },
          error:
            error instanceof Error
              ? error.message
              : "Impossible de charger products_added.",
        })),
      getStoreProductsRemoved(activeStore.slug, activeStore.source, 8)
        .then((data) => ({ data, error: null as string | null }))
        .catch((error: unknown) => ({
          data: {
            shop: activeStore.slug,
            source: activeStore.source,
            total: 0,
            products_removed: [],
          } as StoreProductsRemovedResponse,
          error:
            error instanceof Error
              ? error.message
              : "Impossible de charger products_removed.",
        })),
    ]);

    const productsAddedResponse = productsAddedResult.data;
    const productsAddedError = productsAddedResult.error;
    const productsRemovedResponse = productsRemovedResult.data;
    const productsRemovedError = productsRemovedResult.error;

    let featuredProduct: DataMarketFeaturedProduct | null = null;
    if (previewProducts[0]) {
      const fullProduct =
        activeStore.source === "para"
          ? await getParaProduct(previewProducts[0].id).catch(() => null)
          : await getProduct(previewProducts[0].id).catch(() => null);

      if (fullProduct) {
        const shopPrice = findShopPrice(fullProduct, activeStore.aliases);
        if (shopPrice) {
          featuredProduct = {
            id: fullProduct.id,
            name: fullProduct.name,
            brand: fullProduct.brand,
            category: productCategory(fullProduct),
            image: safeImageUrl(fullProduct.image),
            bestPrice: fullProduct.bestPrice,
            storePrice: shopPrice.price,
            comparedOffers: sortedShopPrices(fullProduct).length,
            inStock: Boolean(shopPrice.available ?? fullProduct.inStock),
            description: fullProduct.description || fullProduct.name,
          };
        }
      }
    }

    const commonProducts =
      activeStore.source === "para"
        ? mergeStats.para?.common_products || 0
        : mergeStats.retails?.common_products || 0;

    const catalogTotal =
      (activeStore.source === "para"
        ? mergeStats.para?.shop_totals
        : mergeStats.retails?.shop_totals)?.[
        canonical === "technopro"
          ? "oktek_total"
          : canonical.replace(/-/g, "_") + "_total"
      ] ||
      detail?.product_count ||
      0;

    const dataset = {
      store: {
        slug: activeStore.slug,
        name: activeStore.shopName,
        sector: activeStore.sector,
        price_value: activeStore.priceValue,
      },
      analytics: {
        average_price: priceAverage,
        product_count: detail?.product_count || 0,
        available_count: detail?.available_count || 0,
        total_price: detail?.total_price || 0,
        cheapest_product_count: detail?.cheapest_product_count || 0,
        discount_count: detail?.discount_count || 0,
        total_discount_value: detail?.total_discount_value || 0,
        average_discount_percent: detail?.average_discount_percent || 0,
        catalog_total: catalogTotal,
        common_products: commonProducts,
      },
      categories,
      selected_category: selectedCategory,
      category_analytics: categoryAnalytics,
      featured_product: featuredProduct,
      search_results: searchResults,
      random_products: randomProducts,
      preview_rows: previewRows,
      products_added: productsAddedResponse.products_added,
      products_removed: productsRemovedResponse.products_removed,
      included_fields: includedFields,
      exported_at: new Date().toISOString(),
    };

    return {
      store: activeStore,
      averagePrice: priceAverage,
      productCount: detail?.product_count || 0,
      availableCount: detail?.available_count || 0,
      totalPrice: detail?.total_price || 0,
      cheapestProductCount: detail?.cheapest_product_count || 0,
      discountCount: detail?.discount_count || 0,
      totalDiscountValue: detail?.total_discount_value || 0,
      averageDiscountPercent: detail?.average_discount_percent || 0,
      catalogTotal,
      commonProducts,
      priceIndexAverage: priceAverage,
      categories,
      selectedCategory,
      categoryAnalytics,
      previewRows,
      searchResults,
      randomProducts,
      featuredProduct,
      productsAdded: productsAddedResponse.products_added,
      productsAddedError,
      productsRemoved: productsRemovedResponse.products_removed,
      productsRemovedError,
      includedFields,
      dataset,
    };
  } catch {
    return buildFallbackDetail(fallbackStore);
  }
}
