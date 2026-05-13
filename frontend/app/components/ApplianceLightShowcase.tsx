"use client";

import { ArrowRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";

function useIsLight() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const check = () => setLight(document.documentElement.dataset.theme === "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return light;
}

function makeT(light: boolean) {
  return light ? {
    teal: "#5B21B6", tealMid: "#7C3AED", lime: "#A78BFA",
    panel: "#f0f2ef", panelFade: "#f0f2ef", card: "#ffffff",
    cardBorder: "rgba(91,33,182,0.15)", border: "rgba(91,33,182,0.22)",
    muted: "rgba(0,0,0,0.45)", text: "#0a0f0d", textSoft: "rgba(0,0,0,0.65)",
    price: "#5B21B6", ctaText: "#ffffff",
    rowBest: "rgba(91,33,182,0.08)", rowBestBorder: "rgba(91,33,182,0.28)",
    rowOther: "rgba(0,0,0,0.03)", chipInactiveBg: "rgba(0,0,0,0.04)", glow: "rgba(91,33,182,0.08)",
  } : {
    teal: "#3BDEB9", tealMid: "#77E590", lime: "#CCFF9B",
    panel: "#000000", panelFade: "#000000", card: "#000000",
    cardBorder: "rgba(59,222,185,0.15)", border: "rgba(59,222,185,0.22)",
    muted: "rgba(255,255,255,0.42)", text: "#ffffff", textSoft: "rgba(255,255,255,0.78)",
    price: "#3BDEB9", ctaText: "#0a140f",
    rowBest: "rgba(59,222,185,0.12)", rowBestBorder: "rgba(59,222,185,0.35)",
    rowOther: "rgba(255,255,255,0.04)", chipInactiveBg: "rgba(255,255,255,0.04)", glow: "rgba(59,222,185,0.14)",
  };
}
import { listProducts } from "../lib/api/products";
import type { CatalogProduct } from "../lib/api/types";
import { SHOWCASE_SECTION_GUTTER_PX, SHOWCASE_SECTION_MAX_WIDTH } from "../lib/showcase-layout";
import { formatPrice, isLikelyPlaceholderProductImage, normalizeShopName, productHref, safeImageUrl, sortedShopPrices } from "../lib/product-utils";
import type { TrendingProduct } from "./TrendingSection";


type CompareRow = { name: string; dot: string; price: string; highlight: boolean; ok: boolean };
type LightProduct = TrendingProduct & { compareRows?: CompareRow[] };

const FRIDGE_SIDEBAR_IMG =
  "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=800&auto=format&fit=crop";

/** API `category` + UI labels + sidebar art (aligned with TrendingSection fallbacks). */
const APPLIANCE_SHOWCASE_CATEGORIES = [
  {
    api: "Réfrigérateur",
    chip: "Réfrigérateurs",
    bannerTitle: "Réfrigérateurs",
    bannerImg: FRIDGE_SIDEBAR_IMG,
  },
  {
    api: "PC de Bureau",
    chip: "PC de Bureau",
    bannerTitle: "PC de Bureau",
    bannerImg: "https://images.unsplash.com/photo-1593640408182-31c228b52b2f?q=80&w=800&auto=format&fit=crop",
  },
  {
    api: "Pc Portable",
    chip: "Pc Portable",
    bannerTitle: "Pc Portables",
    bannerImg: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop",
  },
  {
    api: "Imprimante",
    chip: "Imprimante",
    bannerTitle: "Imprimantes",
    bannerImg: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=800&auto=format&fit=crop",
  },
  {
    api: "Machine à Laver",
    chip: "Machine à Laver",
    bannerTitle: "Machines à Laver",
    bannerImg: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=800&auto=format&fit=crop",
  },
  {
    api: "Lave Vaisselle",
    chip: "Lave Vaisselle",
    bannerTitle: "Lave Vaisselles",
    bannerImg: "https://images.unsplash.com/photo-1585515320310-259814833e62?q=80&w=800&auto=format&fit=crop",
  },
] as const;

function pickBestImage(product: CatalogProduct): string {
  const raw = product as unknown as { images?: string[] };
  const imgs = raw.images;
  if (Array.isArray(imgs) && imgs.length > 1) {
    const alt = imgs.slice(1).find((src) => src && src.startsWith("http") && !isLikelyPlaceholderProductImage(src));
    if (alt) return alt;
    const any = imgs.find((src) => src && src.startsWith("http") && !isLikelyPlaceholderProductImage(src));
    if (any) return any;
  }
  return safeImageUrl(product.image);
}

function catalogToLightProduct(product: CatalogProduct, isLight: boolean): LightProduct {
  const T = makeT(isLight);
  const stores = sortedShopPrices(product).slice(0, 3);
  return {
    id: product.id,
    brand: product.brand || "Produit",
    name: product.name,
    price: formatPrice(product.bestPrice),
    originalPrice:
      product.originalPrice && product.originalPrice > product.bestPrice ? formatPrice(product.originalPrice) : undefined,
    image: pickBestImage(product),
    inStock: product.inStock,
    href: productHref(product, "retail"),
    stores:
      stores.length > 0
        ? stores.map((shop, index) => ({
            name: normalizeShopName(shop.shop),
            dot: index === 0 ? T.teal : "rgba(100,116,139,0.9)",
            price: formatPrice(shop.price),
            best: index === 0,
          }))
        : [{ name: "Meilleur prix", dot: T.teal, price: formatPrice(product.bestPrice), best: true }],
  };
}

function rowsForProduct(p: LightProduct): CompareRow[] {
  if (p.compareRows && p.compareRows.length > 0) return p.compareRows;
  return p.stores.map((s) => ({
    name: s.name,
    dot: s.dot,
    price: s.price,
    highlight: s.best,
    ok: s.best,
  }));
}

function LightProductCard({ p, fallbackImg, isLight }: { p: LightProduct; fallbackImg: string; isLight: boolean }) {
  const T = makeT(isLight);
  const href = p.href || `/products/${p.id}`;
  const rows = rowsForProduct(p);
  const img = p.image || fallbackImg;

  return (
    <div
      className="appliance-secondary-card"
      style={{
        display: "flex",
        width: "calc((100% - 16px) / 2)",
        maxWidth: 220,
        minWidth: 160,
        flexBasis: "calc((100% - 16px) / 2)",
        flexShrink: 0,
        flexDirection: "column",
        borderRadius: 16,
        border: `1px solid ${T.cardBorder}`,
        background: T.card,
        padding: 12,
        boxShadow: isLight ? "0 4px 20px rgba(91,33,182,0.10), 0 1px 4px rgba(0,0,0,0.06)" : "0 8px 32px rgba(0,0,0,0.45)",
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
      }}
    >
      <a
        href={href}
        style={{
          position: "relative",
          marginBottom: 12,
          height: 220,
          width: "100%",
          overflow: "hidden",
          borderRadius: 12,
          background: isLight ? "linear-gradient(180deg,rgba(91,33,182,0.06),rgba(91,33,182,0.02))" : "linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))",
          border: isLight ? "1px solid rgba(91,33,182,0.15)" : "1px solid rgba(255,255,255,0.1)",
          display: "block",
        }}
      >
        <div style={{ position: "absolute", inset: 4, borderRadius: 10, background: "rgba(255,255,255,0.97)", overflow: "hidden" }}>
          <img
            className="showcase-product-img"
            src={img}
            alt={p.name}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 767px) 44vw, (max-width: 1279px) 28vw, 220px"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 4,
            }}
          />
        </div>
        {p.inStock && (
          <span
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              borderRadius: 999,
              padding: "2px 8px",
              fontSize: 9,
              fontWeight: 800,
              background: isLight ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.88)",
              border: `1px solid ${isLight ? "rgba(91,33,182,0.35)" : "rgba(59,222,185,0.45)"}`,
              color: T.teal,
              boxShadow: isLight ? "0 2px 8px rgba(91,33,182,0.15)" : "none",
            }}
          >
            En stock
          </span>
        )}
      </a>

      <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: T.teal }}>
          {p.brand}
        </span>
        <a
          href={href}
          style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1.35,
            color: T.text,
            textDecoration: "none",
            minHeight: 32,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p.name}
        </a>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: T.text, whiteSpace: "nowrap" }}>{p.price}</span>
          {p.originalPrice && (
            <span style={{ fontSize: 10, color: T.muted, textDecoration: "line-through" }}>{p.originalPrice}</span>
          )}
        </div>

        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: T.muted }}
          >
            Comparer les prix
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {rows.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                  padding: "6px 8px",
                  background: r.highlight ? T.rowBest : T.rowOther,
                  border: r.highlight ? `1px solid ${T.rowBestBorder}` : `1px solid ${isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 500, color: r.highlight ? T.text : T.textSoft }}>{r.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: r.highlight ? T.price : T.textSoft,
                    }}
                  >
                    {r.price}
                  </span>
                  {r.ok ? (
                    <Check size={12} strokeWidth={3} style={{ color: T.teal }} />
                  ) : (
                    <X size={12} strokeWidth={3} style={{ color: "rgba(248,113,113,0.85)" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <a
          className="showcase-cta"
          href={href}
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderRadius: 999,
            padding: "10px 14px",
            fontSize: 11,
            fontWeight: 800,
            color: T.text,
            background: "transparent",
            border: `1px solid ${T.border}`,
            textDecoration: "none",
          }}
        >
          Voir les offres
          <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
        </a>
      </div>
    </div>
  );
}

export function ApplianceLightShowcase() {
  const isLight = useIsLight();
  const T = makeT(isLight);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [chipIdx, setChipIdx] = useState(0);
  const [showcaseProducts, setShowcaseProducts] = useState<LightProduct[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(true);

  const activeCategory = useMemo(() => APPLIANCE_SHOWCASE_CATEGORIES[chipIdx], [chipIdx]);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const apiCategory = activeCategory.api;

    async function loadShowcase() {
      setShowcaseLoading(true);
      try {
        let res = await listProducts(
          { category: apiCategory, category_type: "top_category", limit: 24 },
          { signal: ac.signal },
        );
        if (!res.products?.length) {
          res = await listProducts(
            { category: apiCategory, category_type: "subcategory", limit: 24 },
            { signal: ac.signal },
          );
        }
        if (!res.products?.length) {
          res = await listProducts(
            { category: apiCategory, category_type: "low_category", limit: 24 },
            { signal: ac.signal },
          );
        }
        const rawList = res.products || [];
        // Enrich placeholder images by scraping og:image from the shop product page
        const concurrency = 6;
        const enriched: typeof rawList = [];
        for (let i = 0; i < rawList.length; i += concurrency) {
          const chunk = rawList.slice(i, i + concurrency);
          const resolved = await Promise.all(
            chunk.map(async (p) => {
              const listingBest = pickBestImage(p);
              if (!isLikelyPlaceholderProductImage(listingBest)) return { ...p, image: listingBest };
              // Listing image is a placeholder — check file store then scrape og:image
              const shopUrl = p.shopPrices?.find((s) => s.url)?.url;
              if (shopUrl) {
                try {
                  const params = new URLSearchParams({ id: p.id, url: shopUrl });
                  const res = await fetch(`/api/product-image?${params}`, { signal: ac.signal });
                  if (res.ok) {
                    const json = await res.json() as { image?: string | null };
                    if (json.image && !isLikelyPlaceholderProductImage(json.image)) {
                      return { ...p, image: json.image };
                    }
                  }
                } catch { /* keep listing image */ }
              }
              return p;
            }),
          );
          enriched.push(...resolved);
          if (cancelled) return;
        }
        if (!cancelled) {
          setShowcaseProducts(enriched.map((product) => catalogToLightProduct(product, isLight)));
        }
      } catch {
        if (!cancelled) setShowcaseProducts([]);
      } finally {
        if (!cancelled) setShowcaseLoading(false);
      }
    }

    loadShowcase();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [activeCategory.api, isLight]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [chipIdx, showcaseProducts.length]);

  const moreHref = `/products?category=${encodeURIComponent(activeCategory.api)}&type=subcategory`;

  const scrollStrip = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section
      className="appliance-light-shell"
      style={{
        width: "100%",
        maxWidth: SHOWCASE_SECTION_MAX_WIDTH,
        margin: "48px auto 0",
        padding: `32px ${SHOWCASE_SECTION_GUTTER_PX}px`,
        background: T.panel,
        borderRadius: 24,
        border: `1px solid ${T.cardBorder}`,
        boxShadow: "0 16px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        [data-theme="light"] .appliance-light-shell {
          background: #ffffff !important;
          border-color: rgba(0,0,0,0.1) !important;
          box-shadow: 0 14px 42px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.65) !important;
        }
        [data-theme="light"] .appliance-light-shell .appliance-secondary-card {
          background: #ffffff !important;
          border-color: rgba(0,0,0,0.09) !important;
          box-shadow: 0 6px 20px rgba(15,23,42,0.07) !important;
        }
        [data-theme="light"] .appliance-light-shell .appliance-light-arrow {
          background: #ffffff !important;
          border-color: rgba(0,0,0,0.12) !important;
        }
        [data-theme="light"] .appliance-light-shell .appliance-secondary-more {
          background: #ffffff !important;
          border-color: rgba(0,0,0,0.12) !important;
          color: #111827 !important;
          box-shadow: 0 10px 30px rgba(15,23,42,0.08) !important;
        }
        .appliance-secondary-card:hover {
          box-shadow: 0 12px 36px rgba(0,0,0,0.55), 0 0 28px rgba(59,222,185,0.15) !important;
          transform: translateY(-2px);
          border-color: rgba(59,222,185,0.4) !important;
        }
        .appliance-light-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding-bottom: 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .appliance-light-scroll::-webkit-scrollbar { display: none; }
        @media (min-width: 640px) {
          .appliance-light-scroll {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            overflow-x: visible;
          }
        }
        @media (min-width: 1024px) {
          .appliance-light-scroll {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (min-width: 1280px) {
          .appliance-light-scroll {
            display: flex;
            overflow-x: auto;
          }
        }
        .appliance-light-banner { display: none; }
        @media (min-width: 1024px) {
          .appliance-light-banner { display: block !important; }
          .appliance-light-row { flex-direction: row !important; align-items: stretch !important; }
          .appliance-light-wrap .appliance-light-arrow { display: flex !important; }
        }
        .appliance-light-wrap .appliance-light-arrow { display: none; }
        @media (max-width: 767px) {
          .appliance-light-shell {
            padding: 20px 12px !important;
            border-radius: 16px !important;
          }
          .appliance-light-scroll {
            gap: 8px !important;
          }
          .appliance-secondary-card {
            width: calc((100% - 8px) / 2) !important;
            max-width: 156px !important;
            min-width: 140px !important;
            padding: 6px !important;
            border-radius: 10px !important;
          }
          .appliance-secondary-card > a {
            height: 108px !important;
            margin-bottom: 6px !important;
            border-radius: 8px !important;
          }
          .appliance-secondary-card .showcase-product-img {
            padding: 1px !important;
          }
          .appliance-secondary-card > div { gap: 4px !important; }
          .appliance-secondary-card > div > span:first-child { font-size: 8px !important; }
          .appliance-secondary-card > div > a {
            font-size: 9px !important;
            min-height: 22px !important;
            line-height: 1.2 !important;
          }
          .appliance-secondary-card > div > div:nth-child(3) span:first-child { font-size: 12px !important; }
          .appliance-secondary-card > div > div:nth-child(3) span:last-child { font-size: 8px !important; }
          .appliance-secondary-card > div > div:nth-child(4) > span {
            font-size: 7px !important;
            letter-spacing: 0.04em !important;
          }
          .appliance-secondary-card > div > div:nth-child(4) > div > div {
            padding: 3px 5px !important;
            border-radius: 6px !important;
          }
          .appliance-secondary-card > div > div:nth-child(4) > div > div span { font-size: 8px !important; }
          .appliance-secondary-card > div > div:nth-child(4) > div > div:nth-child(n+3) { display: none !important; }
          .appliance-secondary-card > div > div:nth-child(4) > div { gap: 3px !important; }
          .appliance-secondary-card > a > span {
            padding: 1px 6px !important;
            font-size: 8px !important;
            top: 6px !important;
            right: 6px !important;
          }
          .appliance-secondary-card .showcase-cta {
            padding: 6px 8px !important;
            font-size: 9px !important;
          }
          .appliance-secondary-card .showcase-cta svg {
            width: 12px !important;
            height: 12px !important;
          }
          .appliance-secondary-more {
            padding: 10px 14px !important;
            font-size: 12px !important;
            gap: 8px !important;
            width: 100%;
            justify-content: center;
          }
          .appliance-secondary-more > span {
            width: 24px !important;
            height: 24px !important;
            background: #ffffff !important;
            color: #5b21b6 !important;
          }
          .appliance-secondary-more > span svg {
            width: 14px !important;
            height: 14px !important;
          }
        }
        @media (max-width: 420px) {
          .appliance-secondary-card {
            min-width: 132px !important;
            max-width: 148px !important;
          }
          .appliance-secondary-card > a {
            height: 100px !important;
          }
        }
        .appliance-light-arrow:hover {
          border-color: rgba(59,222,185,0.5) !important;
          box-shadow: 0 0 24px rgba(59,222,185,0.18) !important;
        }
        .appliance-secondary-more:hover {
          border-color: rgba(59,222,185,0.4) !important;
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(0,0,0,0.45), 0 0 28px rgba(59,222,185,0.12) !important;
        }
        .appliance-secondary-more {
          animation: applianceMoreFloat 2.8s ease-in-out infinite;
        }
        .appliance-secondary-more > span {
          animation: applianceMorePulse 1.8s ease-in-out infinite;
        }
        .appliance-secondary-more:hover > span {
          transform: translateX(2px) scale(1.06);
        }
        @keyframes applianceMoreFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes applianceMorePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91,33,182,0.22); }
          50% { box-shadow: 0 0 0 7px rgba(91,33,182,0); }
        }
        .appliance-banner-group:hover .appliance-banner-img {
          transform: scale(1.1);
        }
        .appliance-banner-kicker,
        [data-theme="light"] .appliance-light-shell .appliance-banner-kicker {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          text-shadow: 0 2px 8px rgba(0,0,0,0.55) !important;
        }
        .appliance-banner-title,
        [data-theme="light"] .appliance-light-shell .appliance-banner-title {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5) !important;
        }
      `}</style>

      <div className="appliance-light-row" style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "stretch" }}>
        <div className="appliance-light-banner" style={{ width: 320, flexShrink: 0 }}>
          <div
            className="appliance-banner-group"
            style={{
              height: "100%",
              minHeight: 420,
              width: "100%",
              position: "relative",
              borderRadius: "2.5rem",
              overflow: "hidden",
              background: "#f8f6f3",
              boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
            }}
          >
            <img
              className="appliance-banner-img"
              src={activeCategory.bannerImg}
              alt="Banner"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              sizes="320px"
              style={{
                height: "100%",
                width: "100%",
                objectFit: "cover",
                opacity: 0.85,
                transition: "transform 0.7s ease",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
              <span
                className="appliance-banner-kicker"
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 1,
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                  textDecorationColor: "#3b82f6",
                  textShadow: "0 2px 8px rgba(0,0,0,0.55)",
                }}
              >
                Promo
              </span>
              <h3
                className="appliance-banner-title"
                style={{
                  color: "#fff",
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  margin: "8px 0 0",
                  lineHeight: 1.2,
                  textShadow: "0 2px 12px rgba(0,0,0,0.35)",
                }}
              >
                {activeCategory.bannerTitle}
              </h3>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 8,
                scrollbarWidth: "none",
                flex: 1,
                minWidth: 0,
              }}
            >
              {APPLIANCE_SHOWCASE_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.api}
                  type="button"
                  className="light_skew_hover"
                  onClick={() => setChipIdx(i)}
                  style={{
                    borderRadius: 999,
                    padding: "8px 20px",
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    cursor: "pointer",
                    border: i === chipIdx
                      ? `1px solid ${isLight ? "rgba(91,33,182,0.4)" : "rgba(255,255,255,0.28)"}`
                      : `1px solid ${isLight ? "rgba(91,33,182,0.15)" : "rgba(255,255,255,0.1)"}`,
                    boxShadow: i === chipIdx ? (isLight ? "0 4px 16px rgba(91,33,182,0.18)" : "0 4px 20px rgba(0,0,0,0.3)") : "none",
                    background: i === chipIdx
                      ? (isLight ? "rgba(91,33,182,0.12)" : "rgba(255,255,255,0.1)")
                      : (isLight ? "rgba(91,33,182,0.04)" : "rgba(255,255,255,0.04)"),
                    color: isLight ? (i === chipIdx ? "#5B21B6" : "rgba(0,0,0,0.6)") : "#fff",
                    transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {cat.chip}
                </button>
              ))}
            </div>
          </div>

          <div style={{ position: "relative" }} className="appliance-light-wrap">
            <button
              type="button"
              className="appliance-light-arrow"
              aria-label="Faire défiler vers la gauche"
              onClick={() => scrollStrip(-320)}
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${T.border}`,
                background: "#000000",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={22} strokeWidth={2.5} color={T.teal} />
            </button>
            <button
              type="button"
              className="appliance-light-arrow"
              aria-label="Faire défiler vers la droite"
              onClick={() => scrollStrip(320)}
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translate(50%, -50%)",
                marginRight: -8,
                zIndex: 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${T.border}`,
                background: "#000000",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={22} strokeWidth={2.5} color={T.teal} />
            </button>

            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 16,
                width: 32,
                background: `linear-gradient(to right, ${T.panelFade}, transparent)`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 16,
                width: 32,
                background: `linear-gradient(to left, ${T.panelFade}, transparent)`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            />

            <div ref={scrollerRef} className="appliance-light-scroll">
              {showcaseLoading ? (
                <div
                  style={{
                    padding: "48px 24px",
                    color: T.muted,
                    fontSize: 14,
                    fontWeight: 600,
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  Chargement…
                </div>
              ) : showcaseProducts.length === 0 ? (
                <div
                  style={{
                    padding: "48px 24px",
                    color: T.muted,
                    fontSize: 14,
                    fontWeight: 600,
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  Aucun produit dans cette catégorie.
                </div>
              ) : (
                showcaseProducts.map((p) => (
                  <LightProductCard key={p.id} p={p} fallbackImg={activeCategory.bannerImg} isLight={isLight} />
                ))
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <a
              className="appliance-secondary-more"
              href={moreHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 999,
                border: `1px solid ${T.cardBorder}`,
                background: "rgba(0,0,0,0.92)",
                padding: "16px 32px",
                fontSize: 16,
                fontWeight: 800,
                color: T.text,
                textDecoration: "none",
                boxShadow: "0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
                transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
              }}
            >
              Voir plus de produits
              <span
                style={{
                  display: "flex",
                  height: 32,
                  width: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: `linear-gradient(90deg, ${T.teal} 0%, ${T.tealMid} 100%)`,
                  color: T.ctaText,
                }}
              >
                <ArrowRight size={18} strokeWidth={2.5} />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
