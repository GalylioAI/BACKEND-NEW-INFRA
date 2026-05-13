"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getParaCategories,
  getProductCategories,
  listCatalogProducts,
} from "../lib/demo-data/catalog";
import type {
  CatalogProduct,
  CatalogSource,
  CategoryType,
  ProductListResponse,
} from "../lib/demo-data/types";
import { getDemoErrorMessage } from "../lib/demo-data/errors";
import {
  bestShopName,
  compactNumber,
  formatPrice,
  productCategory,
  productHref,
  safeImageUrl,
  savingsPercent,
  sortedShopPrices,
  sourceLabel,
  normalizeShopName,
  PRODUCT_IMAGE_FALLBACK,
} from "../lib/product-utils";

/* ── theme hook ─────────────────────────────────────────────────────── */
function useIsLight() {
  const [light, setLight] = useState(
    typeof document !== "undefined" &&
      document.documentElement.dataset.theme === "light",
  );
  useEffect(() => {
    const check = () =>
      setLight(document.documentElement.dataset.theme === "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  return light;
}

/* ── dark tokens ─────────────────────────────────────────────────────── */
const DARK = {
  bg: "#000000",
  bgAlt: "rgba(6,8,10,0.98)",
  topbar: "rgba(0,0,0,0.92)",
  hero: "radial-gradient(120% 120% at 12% 0%, rgba(245,158,11,0.17) 0%, rgba(245,158,11,0.03) 42%, transparent 65%), linear-gradient(180deg,rgba(255,255,255,0.045) 0%,rgba(255,255,255,0.01) 58%,transparent 100%)",
  heroBorder: "rgba(245,158,11,0.2)",
  card: "linear-gradient(180deg, rgba(16,18,22,0.95) 0%, rgba(10,12,15,0.92) 100%)",
  cardBorder: "rgba(255,255,255,0.10)",
  cardBorderHover: "rgba(251,146,60,0.55)",
  cardShadow: "0 16px 36px rgba(0,0,0,0.35)",
  cardMedia:
    "linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))",
  cardMediaBorder: "rgba(255,255,255,0.14)",
  sidebar: "rgba(10,12,15,0.95)",
  sidebarBorder: "rgba(59,222,185,0.12)",
  accent: "#3BDEB9",
  accentDim: "rgba(59,222,185,0.12)",
  accentBorder: "rgba(59,222,185,0.3)",
  grad: "linear-gradient(90deg,#3BDEB9 0%,#77E590 55%,#CCFF9B 100%)",
  gradBtn: "linear-gradient(90deg,#3BDEB9,#77E590)",
  text: "#ffffff",
  subText: "rgba(255,255,255,0.7)",
  muted: "rgba(255,255,255,0.38)",
  rowBest: "rgba(59,222,185,0.1)",
  rowBestBorder: "rgba(59,222,185,0.35)",
  rowOther: "rgba(255,255,255,0.04)",
  rowOtherBorder: "rgba(255,255,255,0.05)",
  priceOrig: "rgba(255,255,255,0.35)",
  inputBg: "rgba(255,255,255,0.06)",
  inputBorder: "rgba(255,255,255,0.18)",
  pill: "rgba(59,222,185,0.12)",
  pillBorder: "rgba(59,222,185,0.3)",
  statCard:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.01))",
  statBorder: "rgba(245,158,11,0.28)",
  statLine: "rgba(251,146,60,0.95)",
  statText: "#ffffff",
  heroAccent: "#f59e0b",
  heroGrad: "linear-gradient(90deg,#f59e0b 0%,#fb923c 55%,#fdba74 100%)",
  catActive: "rgba(251,146,60,0.65)",
  catActiveShadow: "rgba(251,146,60,0.25)",
  catBorder: "rgba(255,255,255,0.22)",
  logoColor: "#ffffff",
  logoDot: "#3BDEB9",
  paginationBg:
    "linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))",
  paginationBorder: "rgba(255,255,255,0.12)",
  pageIndicatorBg: "rgba(59,222,185,0.1)",
  pageIndicatorBorder: "rgba(59,222,185,0.28)",
  pageIndicatorText: "#d9fff2",
  backBtn: "rgba(255,255,255,0.28)",
  stockIn: "linear-gradient(90deg,#c2410c 0%,#ea580c 52%,#fb923c 100%)",
  stockInBorder: "rgba(255,255,255,0.45)",
  stockOut: "rgba(255,255,255,0.1)",
  stockOutBorder: "rgba(255,255,255,0.16)",
  optionBg: "#0a140f",
  shimmer:
    "linear-gradient(110deg, rgba(255,255,255,0.035), rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
};

/* ── light tokens ────────────────────────────────────────────────────── */
const LIGHT = {
  bg: "#f8fafc",
  bgAlt: "#f1f5f9",
  topbar: "rgba(249,248,255,0.95)",
  hero: "radial-gradient(120% 120% at 12% 0%, rgba(79,70,229,0.11) 0%, rgba(79,70,229,0.035) 45%, transparent 70%), radial-gradient(90% 90% at 100% 100%, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.02) 40%, transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.92) 100%)",
  heroBorder: "rgba(79,70,229,0.17)",
  card: "linear-gradient(180deg, #ffffff 0%, #faf9ff 100%)",
  cardBorder: "rgba(91,33,182,0.12)",
  cardBorderHover: "rgba(91,33,182,0.45)",
  cardShadow: "0 4px 20px rgba(91,33,182,0.08), 0 1px 4px rgba(0,0,0,0.04)",
  cardMedia:
    "linear-gradient(180deg,rgba(91,33,182,0.06),rgba(91,33,182,0.02))",
  cardMediaBorder: "rgba(91,33,182,0.10)",
  sidebar: "rgba(255,255,255,0.96)",
  sidebarBorder: "rgba(91,33,182,0.12)",
  accent: "#7C3AED",
  accentDim: "rgba(91,33,182,0.08)",
  accentBorder: "rgba(91,33,182,0.25)",
  grad: "linear-gradient(90deg,#5B21B6 0%,#7C3AED 55%,#8B5CF6 100%)",
  gradBtn: "linear-gradient(90deg,#5B21B6,#7C3AED)",
  text: "#0f172a",
  subText: "rgba(15,23,42,0.76)",
  muted: "rgba(15,23,42,0.5)",
  rowBest: "rgba(91,33,182,0.07)",
  rowBestBorder: "rgba(91,33,182,0.28)",
  rowOther: "rgba(91,33,182,0.02)",
  rowOtherBorder: "rgba(91,33,182,0.08)",
  priceOrig: "rgba(30,27,75,0.35)",
  inputBg: "rgba(255,255,255,0.9)",
  inputBorder: "rgba(91,33,182,0.18)",
  pill: "rgba(91,33,182,0.08)",
  pillBorder: "rgba(91,33,182,0.25)",
  statCard:
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
  statBorder: "rgba(79,70,229,0.22)",
  statLine: "rgba(79,70,229,0.72)",
  statText: "#0f172a",
  heroAccent: "#4338ca",
  heroGrad: "linear-gradient(90deg,#4338ca 0%,#6366f1 52%,#0ea5e9 100%)",
  catActive: "rgba(91,33,182,0.65)",
  catActiveShadow: "rgba(91,33,182,0.15)",
  catBorder: "rgba(91,33,182,0.20)",
  logoColor: "#0f172a",
  logoDot: "#6366f1",
  paginationBg:
    "linear-gradient(180deg,rgba(255,255,255,0.9),rgba(237,233,254,0.5))",
  paginationBorder: "rgba(91,33,182,0.12)",
  pageIndicatorBg: "rgba(91,33,182,0.08)",
  pageIndicatorBorder: "rgba(91,33,182,0.22)",
  pageIndicatorText: "#4C1D95",
  backBtn: "rgba(91,33,182,0.20)",
  stockIn: "linear-gradient(90deg,#15803d 0%,#16a34a 52%,#22c55e 100%)",
  stockInBorder: "rgba(255,255,255,0.5)",
  stockOut: "rgba(91,33,182,0.08)",
  stockOutBorder: "rgba(91,33,182,0.15)",
  optionBg: "#f5f3ff",
  shimmer:
    "linear-gradient(110deg, rgba(91,33,182,0.03), rgba(91,33,182,0.07), rgba(91,33,182,0.03))",
};

const PRICE_RANGES = [
  { label: "Tous les prix", min: undefined, max: undefined },
  { label: "Moins de 500 DT", min: 0, max: 500 },
  { label: "500 - 1 000 DT", min: 500, max: 1000 },
  { label: "1 000 - 2 000 DT", min: 1000, max: 2000 },
  { label: "2 000 - 5 000 DT", min: 2000, max: 5000 },
  { label: "Plus de 5 000 DT", min: 5000, max: undefined },
];

const SORTS = [
  { label: "Prix croissant", value: "price_asc" },
  { label: "Prix decroissant", value: "price_desc" },
  { label: "Meilleures economies", value: "savings" },
  { label: "Disponibilite", value: "availability" },
];

interface ProductListingSectionProps {
  source?: CatalogSource;
  title?: string;
  eyebrow?: string;
  description?: string;
  initialCategory?: string;
  initialCategoryType?: CategoryType;
  lockedCategory?: boolean;
}

type Tokens = typeof DARK;

function StatCard({
  value,
  label,
  T,
}: {
  value: string;
  label: string;
  T: Tokens;
}) {
  return (
    <div
      className="plx-stat-card"
      style={{
        position: "relative",
        overflow: "hidden",
        background: T.statCard,
        border: `1px solid ${T.statBorder}`,
        borderRadius: 20,
        padding: "20px 24px",
        textAlign: "center",
        backdropFilter: "blur(16px)",
        boxShadow:
          T === LIGHT
            ? "0 4px 16px rgba(91,33,182,0.08)"
            : "0 16px 38px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.09)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "16%",
          right: "16%",
          top: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${T.statLine}, transparent)`,
        }}
      />
      <div
        className="plx-stat-card-value"
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: T.statText,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        className="plx-stat-card-label"
        style={{
          fontSize: 11,
          color: T.statText,
          opacity: T === LIGHT ? 0.65 : 1,
          marginTop: 8,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ProductCard({
  product,
  source,
  T,
}: {
  product: CatalogProduct;
  source: CatalogSource;
  T: Tokens;
}) {
  const [image, setImage] = useState(safeImageUrl(product.image));
  const shops = sortedShopPrices(product).slice(0, 3);
  const savings = savingsPercent(product);

  useEffect(() => {
    setImage(safeImageUrl(product.image));
  }, [product.image]);

  return (
    <article
      className="plx-card"
      style={{
        display: "flex",
        flexDirection: "column",
        background: T.card,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: 20,
        overflow: "hidden",
        minHeight: 455,
        boxShadow: T.cardShadow,
      }}
    >
      <a
        href={productHref(product, source)}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          className="plx-card-media"
          style={{
            position: "relative",
            height: 168,
            borderRadius: 14,
            overflow: "hidden",
            background: T.cardMedia,
            margin: "14px 14px 0",
            flexShrink: 0,
            border: `1px solid ${T.cardMediaBorder}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 8,
              borderRadius: 10,
              background: "#ffffff",
              overflow: "hidden",
            }}
          >
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImage(PRODUCT_IMAGE_FALLBACK)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                padding: 10,
                filter: "contrast(1.06) saturate(1.04)",
              }}
            />
          </div>
          <span
            className="plx-card-badge"
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              padding: "4px 9px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#ffffff",
              background: product.inStock ? T.stockIn : T.stockOut,
              border: `1px solid ${product.inStock ? T.stockInBorder : T.stockOutBorder}`,
              boxShadow: product.inStock
                ? "0 4px 12px rgba(0,0,0,0.2)"
                : "none",
            }}
          >
            {product.inStock ? "EN STOCK" : "RUPTURE"}
          </span>
          {savings && (
            <span
              className="plx-card-badge"
              style={{
                position: "absolute",
                right: 12,
                top: 12,
                padding: "4px 9px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 900,
                background: T.accentDim,
                color: T.accent,
                border: `1px solid ${T.accentBorder}`,
              }}
            >
              -{savings}%
            </span>
          )}
        </div>

        <div
          className="plx-card-body"
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: 1,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span
                className="plx-card-brand"
                style={{
                  color: T.accent,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {product.brand || sourceLabel(source)}
              </span>
              <span
                className="plx-card-cat"
                style={{ color: T.muted, fontSize: 11, whiteSpace: "nowrap" }}
              >
                {productCategory(product)}
              </span>
            </div>
            <h3
              className="plx-card-title"
              style={{
                color: T.text,
                fontSize: 15,
                lineHeight: 1.35,
                minHeight: 62,
                margin: 0,
                fontWeight: 800,
              }}
            >
              {product.name}
            </h3>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span
                className="plx-card-price"
                style={{ color: T.text, fontWeight: 950, fontSize: 24 }}
              >
                {formatPrice(product.bestPrice)}
              </span>
              {product.originalPrice &&
                product.originalPrice > product.bestPrice && (
                  <span
                    className="plx-card-price-old"
                    style={{
                      color: T.priceOrig,
                      textDecoration: "line-through",
                      fontSize: 13,
                    }}
                  >
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {shops.length > 0 ? (
                shops.map((shop, index) => (
                  <div
                    key={`${shop.shop}-${shop.price}`}
                    className="plx-card-shop-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: index === 0 ? T.rowBest : T.rowOther,
                      border: `1px solid ${index === 0 ? T.rowBestBorder : T.rowOtherBorder}`,
                    }}
                  >
                    <span
                      className="plx-card-shop-name"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        color: T.subText,
                        fontSize: 12,
                        fontWeight: 700,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: index === 0 ? T.accent : T.muted,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {normalizeShopName(shop.shop)}
                      </span>
                    </span>
                    <span
                      className="plx-card-shop-price"
                      style={{
                        color: index === 0 ? T.accent : T.text,
                        fontSize: 12,
                        fontWeight: 900,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatPrice(shop.price)}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    background: T.rowOther,
                    color: T.muted,
                    fontSize: 12,
                  }}
                >
                  Details boutique indisponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </a>
    </article>
  );
}

function ThemedCheckbox({ checked, T }: { checked: boolean; T: Tokens }) {
  return (
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        border: `2px solid ${checked ? T.accent : T.muted}`,
        background: checked ? T.accent : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.15s",
      }}
    >
      {checked && (
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </div>
  );
}

function Chip({
  label,
  onRemove,
  T,
}: {
  label: string;
  onRemove: () => void;
  T: Tokens;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 10px",
        borderRadius: 999,
        background: T.pill,
        border: `1px solid ${T.pillBorder}`,
        color: T.accent,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer ${label}`}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: T.accent,
          lineHeight: 1,
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </span>
  );
}

function SkeletonGrid({ T }: { T: Tokens }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          style={{
            minHeight: 430,
            borderRadius: 18,
            border: `1px solid ${T.cardBorder}`,
            background: T.shimmer,
            backgroundSize: "240% 100%",
            animation: "plx-shimmer 1.5s infinite",
          }}
        />
      ))}
    </div>
  );
}

export default function ProductListingSection({
  source = "retail",
  title,
  eyebrow = "Comparaison de prix",
  description,
  initialCategory,
  initialCategoryType = "top_category",
  lockedCategory = false,
}: ProductListingSectionProps) {
  const isLight = useIsLight();
  const T = isLight ? LIGHT : DARK;

  const [categories, setCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [activeCat, setActiveCat] = useState(initialCategory || "Tous");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activePriceIndex, setActivePriceIndex] = useState(0);
  const [activeStore, setActiveStore] = useState("Tous");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("price_asc");
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<ProductListResponse<CatalogProduct> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

  const pageTitle =
    title || (source === "para" ? "Parapharmacie" : "Catalogue produits");
  const titleParts = pageTitle.trim().split(/\s+/);
  const titleLead = titleParts[0] || pageTitle;
  const titleRest = titleParts.slice(1).join(" ");
  const pageDescription =
    description ||
    (source === "para"
      ? "Comparez les produits de parapharmacie disponibles en Tunisie avec les prix reels des boutiques."
      : "Comparez les prix en temps reel sur les grandes enseignes tunisiennes.");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;
    async function loadCategories() {
      try {
        const values =
          source === "para"
            ? await getParaCategories(initialCategoryType)
            : await getProductCategories(initialCategoryType);
        if (!ignore) {
          const merged = initialCategory
            ? [
                initialCategory,
                ...values.filter((item) => item !== initialCategory),
              ]
            : values;
          setCategories(merged.slice(0, 18));
        }
      } catch {
        if (!ignore && initialCategory) setCategories([initialCategory]);
      }
    }
    loadCategories();
    return () => {
      ignore = true;
    };
  }, [initialCategory, initialCategoryType, source]);

  useEffect(() => {
    let ignore = false;
    const price = PRICE_RANGES[activePriceIndex];
    async function loadProducts() {
      setLoading(true);
      setError("");
      try {
        const response = await listCatalogProducts(source, {
          category: activeCat !== "Tous" ? activeCat : undefined,
          category_type: activeCat !== "Tous" ? initialCategoryType : undefined,
          search: search || undefined,
          min_price: price.min,
          max_price: price.max,
          in_stock: inStockOnly || undefined,
          page,
          limit: 24,
        });
        if (!ignore) setData(response as ProductListResponse<CatalogProduct>);
      } catch (err) {
        if (!ignore) {
          setError(
            getDemoErrorMessage(err, "Impossible de charger les produits."),
          );
          setData(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      ignore = true;
    };
  }, [
    activeCat,
    activePriceIndex,
    inStockOnly,
    initialCategoryType,
    page,
    retryKey,
    search,
    source,
  ]);

  const visibleProducts = useMemo(() => {
    const products = [...(data?.products || [])];
    const storeFiltered =
      activeStore === "Tous"
        ? products
        : products.filter((product) =>
            (product.shopPrices || []).some(
              (shop) => normalizeShopName(shop.shop) === activeStore,
            ),
          );
    return storeFiltered.sort((a, b) => {
      if (sort === "price_desc") return b.bestPrice - a.bestPrice;
      if (sort === "savings")
        return (savingsPercent(b) || 0) - (savingsPercent(a) || 0);
      if (sort === "availability") return Number(b.inStock) - Number(a.inStock);
      return a.bestPrice - b.bestPrice;
    });
  }, [activeStore, data?.products, sort]);

  const stores = useMemo(() => {
    const names = new Set<string>();
    (data?.products || []).forEach((product) => {
      (product.shopPrices || []).forEach((shop) =>
        names.add(normalizeShopName(shop.shop)),
      );
    });
    return ["Tous", ...Array.from(names).sort()];
  }, [data?.products]);

  const resetFilters = () => {
    setActiveCat(initialCategory || "Tous");
    setActivePriceIndex(0);
    setActiveStore("Tous");
    setInStockOnly(false);
    setSearchInput("");
    setSearch("");
    setPage(1);
  };
  const handleCategory = (category: string) => {
    if (lockedCategory) return;
    setActiveCat(category);
    setPage(1);
  };
  const scrollCategories = (dir: "left" | "right") => {
    const node = categoryScrollRef.current;
    if (!node) return;
    node.scrollBy({
      left:
        dir === "right"
          ? Math.max(220, Math.round(node.clientWidth * 0.55))
          : -Math.max(220, Math.round(node.clientWidth * 0.55)),
      behavior: "smooth",
    });
  };

  const Sidebar = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: T.muted,
            display: "block",
            marginBottom: 10,
          }}
        >
          Recherche
        </label>
        <div style={{ position: "relative" }}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nom, marque, reference..."
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: 12,
              padding: "10px 12px 10px 34px",
              color: T.text,
              fontSize: 13,
              outline: "none",
            }}
          />
          <svg
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: T.muted,
            }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: T.muted,
            display: "block",
            marginBottom: 12,
          }}
        >
          Prix
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PRICE_RANGES.map((range, index) => (
            <button
              key={range.label}
              type="button"
              onClick={() => {
                setActivePriceIndex(index);
                setPage(1);
              }}
              style={{
                textAlign: "left",
                background:
                  activePriceIndex === index ? T.rowBest : "transparent",
                border: `1px solid ${activePriceIndex === index ? T.rowBestBorder : "transparent"}`,
                borderRadius: 10,
                padding: "8px 10px",
                color: activePriceIndex === index ? T.text : T.subText,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: T.muted,
            display: "block",
            marginBottom: 12,
          }}
        >
          Boutique
        </label>
        <select
          value={activeStore}
          onChange={(e) => setActiveStore(e.target.value)}
          style={{
            width: "100%",
            background: T.inputBg,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 12,
            padding: "10px 12px",
            color: T.text,
            fontSize: 13,
            outline: "none",
          }}
        >
          {stores.map((store) => (
            <option
              key={store}
              value={store}
              style={{ background: T.optionBg }}
            >
              {store}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: T.muted,
            display: "block",
            marginBottom: 10,
          }}
        >
          Disponibilite
        </label>
        <button
          type="button"
          onClick={() => {
            setInStockOnly((v) => !v);
            setPage(1);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            padding: "8px",
            borderRadius: 8,
            background: inStockOnly ? T.rowBest : "transparent",
            border: `1px solid ${inStockOnly ? T.rowBestBorder : "transparent"}`,
            width: "100%",
            color: inStockOnly ? T.text : T.subText,
          }}
        >
          <ThemedCheckbox checked={inStockOnly} T={T} />
          <span style={{ fontSize: 13 }}>En stock uniquement</span>
        </button>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        style={{
          background: "none",
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 999,
          padding: "8px 0",
          fontSize: 12,
          fontWeight: 700,
          color: T.accent,
          cursor: "pointer",
          width: "100%",
        }}
      >
        Reinitialiser les filtres
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text }}>
      <style>{`
        .plx-card:hover { box-shadow:0 20px 48px rgba(0,0,0,${isLight ? 0.12 : 0.5}) !important; border-color:${T.cardBorderHover} !important; transform:translateY(-4px); transition:all 0.25s; }
        .plx-cat { transition:all .22s ease, transform .22s ease, box-shadow .22s ease; }
        .plx-cat:hover { border-color:${T.catActive} !important; color:${T.text} !important; background:${T.accentDim} !important; transform:translateY(-2px); }
        input::placeholder { color:${T.muted}; }
        input:focus { border-color:${T.accentBorder} !important; box-shadow: 0 0 0 3px ${T.accentDim} !important; }
        select { appearance:none; }
        @keyframes plx-shimmer { 0% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${T.accentBorder}; border-radius:99px; }
        .plx-products-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
        .plx-pagination{ display:flex; justify-content:center; align-items:center; gap:10px; margin-top:30px; flex-wrap:wrap; padding:10px; border-radius:16px; border:1px solid ${T.paginationBorder}; background:${T.paginationBg}; box-shadow:0 14px 30px rgba(0,0,0,${isLight ? 0.06 : 0.28}); }
        .plx-page-btn{ display:inline-flex; align-items:center; justify-content:center; min-height:36px; border-radius:999px; font-size:12px; font-weight:800; color:${T.text} !important; border:1px solid ${T.catBorder} !important; background:${T.accentDim} !important; transition:transform .2s ease, box-shadow .25s ease; }
        .plx-page-btn:hover:not(:disabled){ transform:translateY(-2px) scale(1.02); background:${T.rowBest} !important; border-color:${T.accentBorder} !important; }
        .plx-page-btn:disabled{ opacity:0.45 !important; cursor:not-allowed !important; }
        .plx-page-indicator{ border-radius:999px; padding:8px 14px; border:1px solid ${T.pageIndicatorBorder}; background:${T.pageIndicatorBg}; color:${T.pageIndicatorText}; font-size:12px; font-weight:800; white-space:nowrap; }
        .plx-cat-nav{ width:36px;height:36px;border-radius:999px; display:inline-flex;align-items:center;justify-content:center; border:1px solid ${T.catBorder}; background:${T.accentDim}; color:${T.text};cursor:pointer;flex-shrink:0; transition:all .2s ease; }
        .plx-cat-nav:hover{ background:${T.rowBest}; border-color:${T.accentBorder}; transform:translateY(-1px); }
        @media(min-width:1024px){ .plx-sidebar-wrap{ display:flex !important; } .plx-mobile-bar{ display:none !important; } }
        @media(max-width:1280px){ .plx-products-grid{grid-template-columns:repeat(3,minmax(0,1fr));} }
        @media(max-width:900px){ .plx-products-grid{grid-template-columns:repeat(2,minmax(0,1fr));} }
        @media(max-width:560px){ .plx-products-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;} .plx-card{min-height:360px !important;border-radius:14px !important;} .plx-card-media{height:118px !important;margin:10px 10px 0 !important;border-radius:10px !important;} .plx-card-badge{top:8px !important;left:8px !important;padding:2px 6px !important;font-size:8px !important;letter-spacing:0.05em !important;border-radius:999px !important;line-height:1.1 !important;} .plx-card-badge[style*="right"]{right:8px !important;left:auto !important;} .plx-card-body{padding:10px !important;gap:8px !important;} .plx-card-brand,.plx-card-cat{font-size:9px !important;} .plx-card-title{font-size:12px !important;min-height:46px !important;line-height:1.25 !important;} .plx-card-price{font-size:18px !important;} .plx-card-price-old{font-size:10px !important;} .plx-card-shop-row{padding:6px 7px !important;border-radius:8px !important;} .plx-card-shop-name,.plx-card-shop-price{font-size:10px !important;} .plx-pagination{gap:8px;padding:8px;border-radius:14px;margin-top:22px;} .plx-page-btn{min-height:34px;padding:8px 12px !important;font-size:11px;} .plx-page-indicator{width:100%;text-align:center;order:-1;font-size:11px;padding:7px 12px;} }
        @media(max-width:767px){ .plx-hero-stats{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:10px !important;} .plx-stat-card{border-radius:14px !important;padding:13px 10px !important;} .plx-stat-card-value{font-size:20px !important;} .plx-stat-card-label{font-size:9px !important;margin-top:5px !important;} .plx-topbar{height:auto !important;min-height:64px;padding:10px 14px !important;display:grid !important;grid-template-columns:1fr auto;grid-template-areas:"logo back" "crumb crumb";row-gap:8px;column-gap:10px;align-items:center !important;} .plx-logo{grid-area:logo;min-width:0;} .plx-crumb{grid-area:crumb;font-size:12px !important;white-space:nowrap;overflow-x:auto;padding-bottom:2px;} .plx-back{grid-area:back;padding:7px 12px !important;font-size:12px !important;gap:5px !important;} .plx-back-text{display:none;} }
      `}</style>

      {/* Topbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: T.topbar,
          backdropFilter: "blur(22px)",
          borderBottom: `1px solid ${T.cardBorder}`,
        }}
      >
        <div
          className="plx-topbar"
          style={{
            maxWidth: 1520,
            margin: "0 auto",
            padding: "0 20px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            className="plx-logo"
            href="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "2.8rem",
                fontWeight: 900,
                letterSpacing: "-3px",
                color: T.logoColor,
                lineHeight: 1,
              }}
            >
              1111
            </span>
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "1.1rem",
                fontWeight: 600,
                color: T.logoDot,
                lineHeight: 1,
                marginTop: "2px",
              }}
            >
              .tn
            </span>
          </a>
          <nav
            className="plx-crumb"
            style={{
              fontSize: 13,
              color: T.muted,
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <a
              href="/"
              style={{
                color: T.accent,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Accueil
            </a>
            <span>/</span>
            <span style={{ color: T.subText }}>{pageTitle}</span>
          </nav>
          <a
            className="plx-back"
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              borderRadius: 999,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              color: T.text,
              background: "transparent",
              border: `1px solid ${T.backBtn}`,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="plx-back-text">Retour a l&apos;accueil</span>
          </a>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          background: T.hero,
          borderBottom: `1px solid ${T.heroBorder}`,
          padding: "46px 20px 36px",
        }}
      >
        <div style={{ maxWidth: 1520, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: T.heroAccent,
              marginBottom: 10,
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              fontSize: "clamp(1.8rem,4vw,2.8rem)",
              fontWeight: 900,
              letterSpacing: "-1px",
              margin: "0 0 12px",
              lineHeight: 1.1,
              color: T.text,
            }}
          >
            {titleLead}
            {titleRest ? " " : ""}
            {titleRest && (
              <span
                style={{
                  fontFamily: "'Playfair Display',Georgia,serif",
                  fontStyle: "italic",
                  background: T.heroGrad,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {titleRest}
              </span>
            )}
          </h1>
          <p
            style={{
              color: T.subText,
              fontSize: 15,
              margin: "0 0 30px",
              maxWidth: 760,
              lineHeight: 1.75,
            }}
          >
            {pageDescription}
          </p>
          <div
            className="plx-hero-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 14,
              maxWidth: 980,
            }}
          >
            <StatCard
              value={loading && !data ? "..." : compactNumber(data?.total || 0)}
              label="Produits"
              T={T}
            />
            <StatCard value={`${stores.length - 1}`} label="Boutiques" T={T} />
            <StatCard
              value={compactNumber(data?.totalPages || 0)}
              label="Pages"
              T={T}
            />
            <StatCard value={sourceLabel(source)} label="Source" T={T} />
          </div>
        </div>
      </div>

      <div
        style={{ maxWidth: 1520, margin: "0 auto", padding: "36px 20px 80px" }}
      >
        {/* Category bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
          }}
        >
          <button
            type="button"
            className="plx-cat-nav"
            aria-label="Categories precedentes"
            onClick={() => scrollCategories("left")}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div
            ref={categoryScrollRef}
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
              flex: 1,
              scrollbarWidth: "none",
            }}
          >
            {!lockedCategory && (
              <button
                type="button"
                onClick={() => handleCategory("Tous")}
                className="plx-cat"
                style={{
                  borderRadius: 999,
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                  border:
                    activeCat === "Tous"
                      ? `1px solid ${T.catActive}`
                      : `1px solid ${T.catBorder}`,
                  background:
                    activeCat === "Tous" ? T.accentDim : "transparent",
                  color: T.text,
                  boxShadow:
                    activeCat === "Tous"
                      ? `0 0 0 1px ${T.catActiveShadow} inset`
                      : "none",
                }}
              >
                Tous
              </button>
            )}
            {(lockedCategory ? [activeCat] : categories).map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategory(category)}
                className="plx-cat"
                style={{
                  borderRadius: 999,
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: lockedCategory ? "default" : "pointer",
                  flexShrink: 0,
                  border:
                    category === activeCat
                      ? `1px solid ${T.catActive}`
                      : `1px solid ${T.catBorder}`,
                  background:
                    category === activeCat ? T.accentDim : "transparent",
                  color: T.text,
                  boxShadow:
                    category === activeCat
                      ? `0 0 0 1px ${T.catActiveShadow} inset`
                      : "none",
                }}
              >
                {category}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="plx-cat-nav"
            aria-label="Categories suivantes"
            onClick={() => scrollCategories("right")}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Mobile filter bar */}
        <div
          className="plx-mobile-bar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: isLight ? "#ffffff" : DARK.card,
              border: `1px solid ${T.cardBorder}`,
              borderRadius: 999,
              color: T.subText,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filtres
          </button>
          <span style={{ fontSize: 13, color: T.muted }}>
            {data?.total || 0} resultats
          </span>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: `rgba(0,0,0,${isLight ? 0.4 : 0.7})`,
                backdropFilter: "blur(4px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 300,
                background: T.bgAlt,
                padding: 24,
                overflowY: "auto",
                borderRight: `1px solid ${T.cardBorder}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  Filtres
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: T.muted,
                    cursor: "pointer",
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
          {/* Desktop sidebar */}
          <aside
            className="plx-sidebar-wrap"
            style={{ width: 240, flexShrink: 0, display: "none" }}
          >
            <div
              style={{
                background: T.sidebar,
                border: `1px solid ${T.sidebarBorder}`,
                borderRadius: 20,
                padding: 24,
                backdropFilter: "blur(20px)",
                boxShadow: isLight
                  ? "0 4px 20px rgba(91,33,182,0.08)"
                  : "0 16px 38px rgba(0,0,0,0.36)",
                position: "sticky",
                top: 80,
                width: "100%",
              }}
            >
              <Sidebar />
            </div>
          </aside>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 14, color: T.subText, fontWeight: 500 }}>
                <span style={{ color: T.text, fontWeight: 700 }}>
                  {data?.total || 0}
                </span>{" "}
                produits trouves
                {activeStore !== "Tous" && (
                  <span style={{ color: T.muted }}>
                    {" "}
                    ({visibleProducts.length} sur cette page)
                  </span>
                )}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: T.muted }}>
                  Trier&nbsp;:
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{
                    background: isLight ? "#ffffff" : DARK.card,
                    border: `1px solid ${T.cardBorder}`,
                    borderRadius: 10,
                    padding: "7px 12px",
                    color: T.text,
                    fontSize: 13,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {SORTS.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                      style={{ background: T.optionBg }}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(activeCat !== "Tous" ||
              activePriceIndex !== 0 ||
              activeStore !== "Tous" ||
              inStockOnly ||
              searchInput) && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                {activeCat !== "Tous" && !lockedCategory && (
                  <Chip
                    label={activeCat}
                    onRemove={() => setActiveCat("Tous")}
                    T={T}
                  />
                )}
                {activePriceIndex !== 0 && (
                  <Chip
                    label={PRICE_RANGES[activePriceIndex].label}
                    onRemove={() => setActivePriceIndex(0)}
                    T={T}
                  />
                )}
                {activeStore !== "Tous" && (
                  <Chip
                    label={activeStore}
                    onRemove={() => setActiveStore("Tous")}
                    T={T}
                  />
                )}
                {inStockOnly && (
                  <Chip
                    label="En stock"
                    onRemove={() => setInStockOnly(false)}
                    T={T}
                  />
                )}
                {searchInput && (
                  <Chip
                    label={`"${searchInput}"`}
                    onRemove={() => setSearchInput("")}
                    T={T}
                  />
                )}
              </div>
            )}

            {error ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "70px 20px",
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: 20,
                  background: isLight ? "#ffffff" : DARK.card,
                }}
              >
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: T.text,
                    margin: "0 0 8px",
                  }}
                >
                  Chargement impossible
                </p>
                <p style={{ color: T.muted, margin: "0 0 18px" }}>{error}</p>
                <button
                  type="button"
                  onClick={() => setRetryKey((v) => v + 1)}
                  style={{
                    border: 0,
                    borderRadius: 999,
                    padding: "10px 18px",
                    background: T.gradBtn,
                    color: "#ffffff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Reessayer
                </button>
              </div>
            ) : loading ? (
              <SkeletonGrid T={T} />
            ) : visibleProducts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 20px",
                  color: T.muted,
                  border: `1px solid ${T.cardBorder}`,
                  borderRadius: 20,
                  background: isLight ? "#ffffff" : DARK.card,
                }}
              >
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.subText,
                    margin: "0 0 8px",
                  }}
                >
                  Aucun produit trouve
                </p>
                <p style={{ fontSize: 14, margin: 0 }}>
                  Essayez de modifier vos filtres ou votre recherche.
                </p>
              </div>
            ) : (
              <>
                <div className="plx-products-grid">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      source={source}
                      T={T}
                    />
                  ))}
                </div>
                {(data?.totalPages || 0) > 1 && (
                  <div className="plx-pagination">
                    <button
                      type="button"
                      className="plx-page-btn"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((v) => Math.max(1, v - 1))}
                      style={{
                        padding: "9px 15px",
                        cursor: page <= 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Precedent
                    </button>
                    <span className="plx-page-indicator">
                      Page {data?.page || page} / {data?.totalPages || 1}
                    </span>
                    <button
                      type="button"
                      className="plx-page-btn"
                      disabled={page >= (data?.totalPages || 1) || loading}
                      onClick={() => setPage((v) => v + 1)}
                      style={{
                        padding: "9px 15px",
                        cursor:
                          page >= (data?.totalPages || 1)
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
