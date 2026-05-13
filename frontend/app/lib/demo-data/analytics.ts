import { demoAsync } from "./async";
import { getAllCatalogProducts, getShopPricesFor } from "./catalog";
import type {
  CatalogProduct,
  CatalogSource,
  DetailedAnalyticsResponse,
  MergeStatsResponse,
  ShopAnalytics,
  ShopDetailedAnalytics,
  StoreProductAdded,
  StoreProductsAddedResponse,
  StoreProductsRemovedResponse,
} from "./types";

function normalizeShopName(name: string) {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function shopsFor(products: CatalogProduct[]) {
  return [
    ...new Set(
      products.flatMap((product) =>
        (product.shopPrices || []).map((price) =>
          normalizeShopName(price.shop),
        ),
      ),
    ),
  ];
}

function buildShopDetail(
  shop: string,
  products: CatalogProduct[],
): ShopDetailedAnalytics {
  const rows = products.flatMap((product) =>
    (product.shopPrices || [])
      .filter((price) => normalizeShopName(price.shop) === shop)
      .map((price) => ({ product, price })),
  );
  const total = rows.reduce((sum, row) => sum + row.price.price, 0);
  const discountRows = rows.filter(
    (row) => row.price.oldPrice && row.price.oldPrice > row.price.price,
  );
  return {
    name: shop,
    product_count: rows.length,
    available_count: rows.filter(
      (row) => row.price.available ?? row.product.inStock,
    ).length,
    total_price: total,
    average_price: rows.length ? total / rows.length : 0,
    cheapest_product_count: rows.filter((row) => {
      const best = Math.min(
        ...(row.product.shopPrices || []).map((price) => price.price),
      );
      return row.price.price === best;
    }).length,
    discount_count: discountRows.length,
    total_discount_value: discountRows.reduce(
      (sum, row) => sum + ((row.price.oldPrice || 0) - row.price.price),
      0,
    ),
    average_discount_percent: discountRows.length
      ? discountRows.reduce(
          (sum, row) =>
            sum +
            (((row.price.oldPrice || row.price.price) - row.price.price) /
              (row.price.oldPrice || row.price.price)) *
              100,
          0,
        ) / discountRows.length
      : 0,
  };
}

function storeProductRow(
  product: CatalogProduct,
  shop: string,
  source: CatalogSource,
  index: number,
): StoreProductAdded {
  const price = product.shopPrices?.find(
    (item) => normalizeShopName(item.shop) === normalizeShopName(shop),
  );
  return {
    id: `${shop}-${product.id}-${index}`,
    url: `/products/${product.id}?source=${source}`,
    shop,
    scraped_at: new Date(Date.now() - index * 86_400_000).toISOString(),
    updated_at: new Date(Date.now() - index * 43_200_000).toISOString(),
    top_category:
      "topCategory" in product
        ? product.topCategory || product.category || null
        : String(
            product.specifications?.top_category || product.category || "",
          ),
    low_category: String(
      product.specifications?.low_category || product.category || "",
    ),
    subcategory: product.category || null,
    title: product.name,
    product_id: product.id,
    sku: product.id.toUpperCase(),
    overview: product.description,
    brand: product.brand,
    price: price?.price ?? product.bestPrice,
    images: [product.image],
    availability: product.inStock ? "available" : "unavailable",
    available: product.inStock,
    store_availability: (product.shopPrices || []).map((offer) => ({
      store: offer.shop,
      available: offer.available ?? product.inStock,
      status:
        (offer.available ?? product.inStock) ? "available" : "unavailable",
    })),
  };
}

export function getPriceAnalytics() {
  const { retail, para } = getAllCatalogProducts();
  const products = [...retail, ...para];
  const shops = shopsFor(products);
  const response: ShopAnalytics[] = shops.map((shop) => ({
    name: shop,
    average_price: buildShopDetail(shop, products).average_price,
    logo_url: null,
  }));
  return demoAsync(response);
}

export function getMergeStats() {
  const { retail, para } = getAllCatalogProducts();
  const response: MergeStatsResponse = {
    para: {
      shop_totals: Object.fromEntries(
        shopsFor(para).map((shop) => [
          `${shop}_total`,
          buildShopDetail(shop, para).product_count,
        ]),
      ),
      common_products: para.filter(
        (product) => (product.shopPrices || []).length > 1,
      ).length,
    },
    retails: {
      shop_totals: Object.fromEntries(
        shopsFor(retail).map((shop) => [
          `${shop}_total`,
          buildShopDetail(shop, retail).product_count,
        ]),
      ),
      common_products: retail.filter(
        (product) => (product.shopPrices || []).length > 1,
      ).length,
    },
  };
  return demoAsync(response);
}

export function getShopDetails() {
  const { retail, para } = getAllCatalogProducts();
  const response: DetailedAnalyticsResponse = {
    para_shops: shopsFor(para).map((shop) => buildShopDetail(shop, para)),
    retails_shops: shopsFor(retail).map((shop) =>
      buildShopDetail(shop, retail),
    ),
  };
  return demoAsync(response);
}

export function getStoreProductsAdded(
  shop: string,
  source = "retails",
  limit = 12,
) {
  const catalogSource: CatalogSource = source === "para" ? "para" : "retail";
  const rows = getShopPricesFor(shop, catalogSource).slice(0, limit);
  const response: StoreProductsAddedResponse = {
    shop,
    source,
    total: rows.length,
    products_added: rows.map((row, index) =>
      storeProductRow(row.product, shop, catalogSource, index),
    ),
  };
  return demoAsync(response);
}

export function getStoreProductsRemoved(
  shop: string,
  source = "retails",
  limit = 12,
) {
  const catalogSource: CatalogSource = source === "para" ? "para" : "retail";
  const rows = getShopPricesFor(shop, catalogSource).slice(0, limit).reverse();
  const response: StoreProductsRemovedResponse = {
    shop,
    source,
    total: rows.length,
    products_removed: rows.map((row, index) =>
      storeProductRow(row.product, shop, catalogSource, index + 1),
    ),
  };
  return demoAsync(response);
}
