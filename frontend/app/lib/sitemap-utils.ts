import { articles } from "./articles";
import {
  getParaCategories,
  getProductCategories,
  listCatalogProducts,
} from "./demo-data/catalog";
import type {
  CatalogProduct,
  CatalogSource,
  CategoryType,
} from "./demo-data/types";
import { productHref } from "./product-utils";

export const SITEMAP_REVALIDATE_SECONDS = 86400;
export const PRODUCT_PAGE_SIZE = 100;
export const MAX_PRODUCT_PAGES_PER_SOURCE = 500;

export type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapUrl {
  loc: string;
  lastmod?: string | Date;
  changefreq?: SitemapChangeFrequency;
  priority?: number;
}

export interface SitemapReference {
  loc: string;
  lastmod?: string | Date;
}

export const SITE_URL = "http://localhost:3000";

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

export function sitemapResponse(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=0, s-maxage=${SITEMAP_REVALIDATE_SECONDS}`,
    },
  });
}

export function renderSitemapIndex(sitemaps: SitemapReference[]) {
  const items = sitemaps
    .map((sitemap) => {
      const lastmod = sitemap.lastmod
        ? `<lastmod>${xmlEscape(toIsoDate(sitemap.lastmod))}</lastmod>`
        : "";

      return `<sitemap><loc>${xmlEscape(sitemap.loc)}</loc>${lastmod}</sitemap>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
}

export function renderUrlSet(urls: SitemapUrl[]) {
  const items = dedupeUrls(urls)
    .map((url) => {
      const lastmod = url.lastmod
        ? `<lastmod>${xmlEscape(toIsoDate(url.lastmod))}</lastmod>`
        : "";
      const changefreq = url.changefreq
        ? `<changefreq>${xmlEscape(url.changefreq)}</changefreq>`
        : "";
      const priority =
        typeof url.priority === "number"
          ? `<priority>${url.priority}</priority>`
          : "";

      return `<url><loc>${xmlEscape(url.loc)}</loc>${lastmod}${changefreq}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}

export function sitemapUrl(
  path: string,
  priority: number,
  changefreq: SitemapChangeFrequency,
  lastmod?: string | Date,
): SitemapUrl {
  return {
    loc: absoluteUrl(path),
    lastmod,
    changefreq,
    priority,
  };
}

export function staticPageUrls(): SitemapUrl[] {
  return [
    sitemapUrl("/", 1, "daily"),
    sitemapUrl("/products", 0.92, "daily"),
    sitemapUrl("/electromenager", 0.86, "daily"),
    sitemapUrl("/parapharmacie", 0.86, "daily"),
    sitemapUrl("/solutions", 0.75, "weekly"),
    sitemapUrl("/pricing", 0.7, "weekly"),
    sitemapUrl("/vols", 0.68, "hourly"),
    sitemapUrl("/inscription", 0.5, "monthly"),
  ];
}

export function blogUrls(): SitemapUrl[] {
  return articles.map((article) =>
    sitemapUrl(
      `/blog/${article.slug}`,
      0.72,
      "monthly",
      articleLastModified(article.date),
    ),
  );
}

function articleLastModified(date: string) {
  const match = date.match(/^([A-Za-zÀ-ÿ]+)\s+(\d{4})$/);
  if (!match) return undefined;

  const month = match[1].toLowerCase();
  const year = match[2];
  const monthByLabel: Record<string, string> = {
    jan: "01",
    janvier: "01",
    fev: "02",
    fév: "02",
    fevrier: "02",
    février: "02",
    mar: "03",
    mars: "03",
    avr: "04",
    avril: "04",
    mai: "05",
    jun: "06",
    juin: "06",
    jul: "07",
    juillet: "07",
    aout: "08",
    août: "08",
    sep: "09",
    septembre: "09",
    oct: "10",
    octobre: "10",
    nov: "11",
    novembre: "11",
    dec: "12",
    déc: "12",
    decembre: "12",
    décembre: "12",
  };

  const monthNumber = monthByLabel[month];
  return monthNumber ? `${year}-${monthNumber}-01` : undefined;
}

export async function safeFetch<T>(
  fetcher: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fetcher();
  } catch {
    return fallback;
  }
}

async function getCategories(
  source: CatalogSource,
  categoryType: CategoryType,
) {
  return safeFetch(
    () =>
      source === "para"
        ? getParaCategories(categoryType)
        : getProductCategories(categoryType),
    [],
  );
}

export async function categoryUrls(): Promise<SitemapUrl[]> {
  const groups: Array<{
    source: CatalogSource;
    categoryType: CategoryType;
    basePath: string;
  }> = [
    { source: "retail", categoryType: "top_category", basePath: "/products" },
    { source: "retail", categoryType: "subcategory", basePath: "/products" },
    { source: "retail", categoryType: "low_category", basePath: "/products" },
    {
      source: "para",
      categoryType: "top_category",
      basePath: "/parapharmacie",
    },
    { source: "para", categoryType: "subcategory", basePath: "/parapharmacie" },
  ];

  const results = await Promise.all(
    groups.map(async ({ source, categoryType, basePath }) => {
      const categories = await getCategories(source, categoryType);

      return categories.map((category) => {
        const params = new URLSearchParams({
          category,
          category_type: categoryType,
        });

        if (source === "para") {
          params.set("source", "para");
        }

        return sitemapUrl(`${basePath}?${params.toString()}`, 0.62, "daily");
      });
    }),
  );

  return results.flat();
}

export async function productUrls(
  source: CatalogSource,
): Promise<SitemapUrl[]> {
  const products: CatalogProduct[] = [];

  for (let page = 1; page <= MAX_PRODUCT_PAGES_PER_SOURCE; page += 1) {
    const response = await safeFetch(
      () =>
        listCatalogProducts(source, {
          page,
          limit: PRODUCT_PAGE_SIZE,
          in_stock: true,
        }),
      null,
    );

    if (!response) break;

    products.push(...response.products);

    if (page >= response.totalPages || response.products.length === 0) break;
  }

  return products.map((product) =>
    sitemapUrl(productHref(product, source), 0.7, "daily"),
  );
}

function dedupeUrls(urls: SitemapUrl[]) {
  const seen = new Set<string>();

  return urls.filter((url) => {
    if (seen.has(url.loc)) return false;
    seen.add(url.loc);
    return true;
  });
}
