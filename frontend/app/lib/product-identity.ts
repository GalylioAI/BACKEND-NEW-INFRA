import { getAllCatalogProducts } from "./demo-data/catalog";
import type { CatalogProduct, CatalogSource } from "./demo-data/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATIC_PRODUCT_NAMESPACE = "1111.tn/static-catalog/product/v1";

function hash32(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function isUuid(value: string | null | undefined) {
  return Boolean(value && UUID_RE.test(value));
}

export function staticProductUuid(productId: string) {
  if (isUuid(productId)) return productId;
  const seed = `${STATIC_PRODUCT_NAMESPACE}:${productId}`;
  const hex = [
    hash32(`${seed}:0`),
    hash32(`${seed}:1`),
    hash32(`${seed}:2`),
    hash32(`${seed}:3`),
  ].join("");
  const chars = hex.slice(0, 32).split("");
  chars[12] = "5";
  chars[16] = ((Number.parseInt(chars[16] || "0", 16) & 0x3) | 0x8).toString(
    16,
  );
  const uuidHex = chars.join("");
  return [
    uuidHex.slice(0, 8),
    uuidHex.slice(8, 12),
    uuidHex.slice(12, 16),
    uuidHex.slice(16, 20),
    uuidHex.slice(20, 32),
  ].join("-");
}

export function productBackendId(productId: string) {
  return staticProductUuid(productId);
}

export function productLink(product: CatalogProduct, source: CatalogSource) {
  return `/products/${encodeURIComponent(product.id)}?source=${source}`;
}

export function findStaticProductByBackendId(productId: string): {
  product: CatalogProduct;
  source: CatalogSource;
  backendId: string;
} | null {
  const catalog = getAllCatalogProducts();
  const all: Array<{ product: CatalogProduct; source: CatalogSource }> = [
    ...catalog.retail.map((product) => ({
      product,
      source: "retail" as CatalogSource,
    })),
    ...catalog.para.map((product) => ({
      product,
      source: "para" as CatalogSource,
    })),
  ];

  for (const item of all) {
    const backendId = staticProductUuid(item.product.id);
    if (backendId === productId) {
      return { ...item, backendId };
    }
  }

  return null;
}

export const syntheticProductIdNote =
  "Identifiant produit synthetique stable jusqu'a l'arrivee du backend catalogue.";
