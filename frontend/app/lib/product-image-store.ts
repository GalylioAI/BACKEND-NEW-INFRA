import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "product-images.json");

let _cache: Record<string, string> | null = null;

export function getProductImageStore(): Record<string, string> {
  if (_cache) return _cache;
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    _cache = JSON.parse(raw) as Record<string, string>;
  } catch {
    _cache = {};
  }
  return _cache;
}

export function getStoredProductImage(productId: string): string | null {
  return getProductImageStore()[productId] ?? null;
}

export function saveProductImage(productId: string, imageUrl: string): void {
  const store = getProductImageStore();
  store[productId] = imageUrl;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // read-only filesystem on Netlify — cache only survives the request
  }
}
