import type { CatalogProduct, CatalogSource, ShopDetailedAnalytics, ShopPrice } from "./api/types";

export const PRODUCT_IMAGE_FALLBACK = "/images/item-cart.png";

export function formatPrice(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Prix indisponible";

  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 3,
    maximumFractionDigits: 3,
  })} DT`;
}

export function compactNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function safeImageUrl(image?: string | null) {
  if (!image) return PRODUCT_IMAGE_FALLBACK;
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) return image;
  return PRODUCT_IMAGE_FALLBACK;
}

/** Retail listing sometimes returns a shop theme placeholder instead of the real product photo. */
export function isLikelyPlaceholderProductImage(url?: string | null): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  if (u.includes("/assets/img/refrigerateur")) return true;
  if (u.includes("medicine_theme") && u.includes("refrigerateur")) return true;
  if (u.includes("no-image") || u.includes("no_image") || u.includes("noimage")) return true;
  if (u.includes("placeholder") || u.includes("default-product") || u.includes("default_product")) return true;
  if (u.includes("/assets/img/default") || u.includes("/images/default")) return true;
  if (u.endsWith("logo.png") || u.endsWith("logo.jpg") || u.endsWith("logo.webp")) return true;
  return false;
}

export function productCategory(product: CatalogProduct) {
  return "topCategory" in product && product.topCategory ? product.topCategory : product.category || "Catalogue";
}

export function productHref(product: CatalogProduct, source: CatalogSource) {
  return `/products/${encodeURIComponent(product.id)}?source=${source}`;
}

export function sortedShopPrices(product: CatalogProduct): ShopPrice[] {
  return [...(product.shopPrices || [])].sort((a, b) => a.price - b.price);
}

export function bestShopName(product: CatalogProduct) {
  return sortedShopPrices(product)[0]?.shop || "Meilleur prix";
}

export function savingsPercent(product: CatalogProduct) {
  if (!product.originalPrice || product.originalPrice <= product.bestPrice) return null;
  return Math.round(((product.originalPrice - product.bestPrice) / product.originalPrice) * 100);
}

export function sourceLabel(source: CatalogSource) {
  return source === "para" ? "Parapharmacie" : "E-commerce";
}

export function normalizeShopName(shop: string) {
  return shop
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

export function shopLogo(shop: string) {
  const normalized = shop.toLowerCase().replace(/\s+/g, "_");
  const localLogos: Record<string, string> = {
    darty: "/images/darty-logo.png",
    parashop: "/images/parashop.png",
    parafendri: "/images/parafendri.jpg",
    pharma_shop: "/images/parahouse.png",
  };

  return localLogos[normalized] || `https://www.google.com/s2/favicons?domain=${normalized}.tn&sz=128`;
}

export function analyticsToStoreCards(shops: ShopDetailedAnalytics[], limit = 6) {
  return [...shops]
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, limit)
    .map((shop, index) => ({
      id: shop.name,
      name: normalizeShopName(shop.name),
      logo: shopLogo(shop.name),
      productCount: shop.product_count,
      availableCount: shop.available_count,
      averagePrice: shop.average_price,
      cheapestCount: shop.cheapest_product_count,
      discountCount: shop.discount_count,
      rank: index + 1,
    }));
}
