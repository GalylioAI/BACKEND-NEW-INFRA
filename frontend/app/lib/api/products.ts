import { isLikelyPlaceholderProductImage } from "../product-utils";
import { apiFetch } from "./client";
import type {
  CatalogProduct,
  CatalogSource,
  CategoryAnalytics,
  CategoryType,
  FakePromoItem,
  ParaProduct,
  Product,
  ProductListResponse,
  ProductListingParams,
  ProductSearchResult,
} from "./types";

function withDefaultCache<T extends RequestInit>(init?: T): T & { cache: RequestCache } {
  return { cache: "no-store", ...(init || {}) } as T & { cache: RequestCache };
}

export function getProductCategories(type: CategoryType = "subcategory", init?: RequestInit) {
  const pathByType: Record<CategoryType, string> = {
    subcategory: "/api/v1/products/categories",
    low_category: "/api/v1/products/low-categories",
    top_category: "/api/v1/products/top-categories",
  };

  return apiFetch<string[]>(pathByType[type], withDefaultCache(init));
}

export function getParaCategories(type: CategoryType = "top_category", init?: RequestInit) {
  return apiFetch<string[]>("/api/v1/para/categories", {
    ...withDefaultCache(init),
    query: { type },
  });
}

export function listProducts(params: ProductListingParams = {}, init?: RequestInit) {
  return apiFetch<ProductListResponse<Product>>("/api/v1/products/listing", {
    ...withDefaultCache(init),
    query: { ...params },
  });
}

export function listParaProducts(params: ProductListingParams = {}, init?: RequestInit) {
  return apiFetch<ProductListResponse<ParaProduct>>("/api/v1/para/listing", {
    ...withDefaultCache(init),
    query: { ...params },
  });
}

export function listCatalogProducts(
  source: CatalogSource,
  params: ProductListingParams = {},
  init?: RequestInit,
) {
  return source === "para" ? listParaProducts(params, init) : listProducts(params, init);
}

export function getRandomProducts(
  category: string,
  category_type: CategoryType = "subcategory",
  limit = 8,
  init?: RequestInit,
) {
  return apiFetch<Product[]>("/api/v1/products/random", {
    ...withDefaultCache(init),
    query: { category, category_type, limit },
  });
}

export function getRandomParaProducts(
  category: string,
  category_type: CategoryType = "top_category",
  limit = 8,
  init?: RequestInit,
) {
  return apiFetch<ParaProduct[]>("/api/v1/para/random", {
    ...withDefaultCache(init),
    query: { category, category_type, limit },
  });
}

export function searchProducts(q: string, limit = 10, shop?: string, init?: RequestInit) {
  return apiFetch<ProductSearchResult[]>("/api/v1/products/search", {
    ...withDefaultCache(init),
    query: { q, limit, shop },
  });
}

export function searchParaProducts(q: string, limit = 10, shop?: string, init?: RequestInit) {
  return apiFetch<ProductSearchResult[]>("/api/v1/para/search", {
    ...withDefaultCache(init),
    query: { q, limit, shop },
  });
}

export function getProduct(productId: string, init?: RequestInit) {
  return apiFetch<Product>(`/api/v1/products/${encodeURIComponent(productId)}`, withDefaultCache(init));
}

export function getParaProduct(productId: string, init?: RequestInit) {
  return apiFetch<ParaProduct>(`/api/v1/para/${encodeURIComponent(productId)}`, withDefaultCache(init));
}

export function getProductBySku(sku: string, init?: RequestInit) {
  return apiFetch<Product>(`/api/v1/products/by-sku/${encodeURIComponent(sku)}`, withDefaultCache(init));
}

export function getParaProductBySku(sku: string, init?: RequestInit) {
  return apiFetch<ParaProduct>(`/api/v1/para/by-sku/${encodeURIComponent(sku)}`, withDefaultCache(init));
}

export function getProductCategoryAnalytics(category: string, init?: RequestInit) {
  return apiFetch<CategoryAnalytics>("/api/v1/products/analytics/by-category", {
    ...withDefaultCache(init),
    query: { category },
  });
}

export function getParaCategoryAnalytics(category: string, init?: RequestInit) {
  return apiFetch<CategoryAnalytics>("/api/v1/para/analytics/by-category", {
    ...withDefaultCache(init),
    query: { category },
  });
}

export function getFakePromos(limit = 10, init?: RequestInit) {
  return apiFetch<FakePromoItem[]>("/api/v1/products/fake-promos/list", {
    ...withDefaultCache(init),
    query: { limit },
  });
}

export async function getCatalogProduct(
  productId: string,
  preferredSource?: CatalogSource,
): Promise<{ product: CatalogProduct; source: CatalogSource } | null> {
  if (preferredSource === "para") {
    try {
      return { product: await getParaProduct(productId), source: "para" };
    } catch {
      return null;
    }
  }

  if (preferredSource === "retail") {
    try {
      return { product: await getProduct(productId), source: "retail" };
    } catch {
      return null;
    }
  }

  try {
    return { product: await getProduct(productId), source: "retail" };
  } catch {
    try {
      return { product: await getParaProduct(productId), source: "para" };
    } catch {
      return null;
    }
  }
}

/** Replace listing placeholder images with `getProduct` photos when needed. */
export async function enrichCatalogProductImages(
  products: CatalogProduct[],
  signal: AbortSignal,
  concurrency = 5,
): Promise<CatalogProduct[]> {
  const out: CatalogProduct[] = [];
  for (let i = 0; i < products.length; i += concurrency) {
    const chunk = products.slice(i, i + concurrency);
    const resolved = await Promise.all(
      chunk.map(async (p) => {
        if (!isLikelyPlaceholderProductImage(p.image)) return p;
        try {
          const full = await getProduct(p.id, { signal });
          if (full.image && !isLikelyPlaceholderProductImage(full.image)) {
            return { ...p, image: full.image };
          }
        } catch {
          /* keep listing payload */
        }
        return p;
      }),
    );
    out.push(...resolved);
  }
  return out;
}
