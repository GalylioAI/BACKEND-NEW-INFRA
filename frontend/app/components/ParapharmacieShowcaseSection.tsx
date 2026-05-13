"use client";

import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function useIsLight() {
  const [light, setLight] = useState(false);
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

function makeT(light: boolean) {
  return light
    ? {
        teal: "#5B21B6",
        tealMid: "#7C3AED",
        lime: "#A78BFA",
        bg: "#f0f2ef",
        panel: "#f0f2ef",
        panelFade: "#f0f2ef",
        card: "#ffffff",
        cardBorder: "rgba(91,33,182,0.15)",
        border: "rgba(91,33,182,0.22)",
        muted: "rgba(0,0,0,0.45)",
        text: "#0a0f0d",
        textSoft: "rgba(0,0,0,0.65)",
        price: "#5B21B6",
        ctaText: "#ffffff",
        rowBest: "rgba(91,33,182,0.08)",
        rowBestBorder: "rgba(91,33,182,0.28)",
        rowOther: "rgba(0,0,0,0.03)",
        chipInactiveBg: "rgba(0,0,0,0.04)",
        glow: "rgba(91,33,182,0.08)",
      }
    : {
        teal: "#3BDEB9",
        tealMid: "#77E590",
        lime: "#CCFF9B",
        bg: "#000000",
        panel: "#000000",
        panelFade: "#000000",
        card: "#000000",
        cardBorder: "rgba(59,222,185,0.15)",
        border: "rgba(59,222,185,0.22)",
        muted: "rgba(255,255,255,0.42)",
        text: "#ffffff",
        textSoft: "rgba(255,255,255,0.78)",
        price: "#3BDEB9",
        ctaText: "#0a140f",
        rowBest: "rgba(59,222,185,0.12)",
        rowBestBorder: "rgba(59,222,185,0.35)",
        rowOther: "rgba(255,255,255,0.04)",
        chipInactiveBg: "rgba(255,255,255,0.04)",
        glow: "rgba(59,222,185,0.14)",
      };
}
import { getParaCategories, listParaProducts } from "../lib/demo-data/catalog";
import type { ParaProduct } from "../lib/demo-data/types";
import {
  SHOWCASE_SECTION_GUTTER_PX,
  SHOWCASE_SECTION_MAX_WIDTH,
} from "../lib/showcase-layout";
import {
  formatPrice,
  normalizeShopName,
  productHref,
  safeImageUrl,
  sortedShopPrices,
} from "../lib/product-utils";
import type { TrendingProduct } from "./TrendingSection";

type ShowcaseIntention =
  | "bebe"
  | "solaire"
  | "hygiene"
  | "visage"
  | "hommes"
  | "soins";

function normParaCat(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " et ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveParaTopCategory(
  intention: ShowcaseIntention,
  categories: string[],
): string | undefined {
  const list = categories.map((raw) => ({ raw, key: normParaCat(raw) }));

  if (intention === "bebe") {
    const exactList = list.find(
      ({ raw, key }) => raw.trim() === "Bébé" || key === "bebe",
    );
    if (exactList) return exactList.raw;
    const word = list.find(({ key }) => /\bbebe\b/.test(key));
    if (word) return word.raw;
  }
  if (intention === "solaire") {
    const exact = list.find(
      ({ raw, key }) =>
        raw.trim().toLowerCase() === "solaire" || key === "solaire",
    );
    if (exact) return exact.raw;
    return list.find(({ key }) => key.includes("solaire"))?.raw;
  }
  if (intention === "hygiene") {
    return list.find(
      ({ key }) => key.includes("hygiene") || key.includes("hygi"),
    )?.raw;
  }
  if (intention === "visage") {
    return list.find(({ key }) => key.includes("visage"))?.raw;
  }
  if (intention === "hommes") {
    return list.find(
      ({ key }) => key.includes("homme") || key.includes("homme"),
    )?.raw;
  }
  if (intention === "soins") {
    return list.find(({ key }) => key.includes("soin"))?.raw;
  }
  return undefined;
}

const PARA_SHOWCASE_DEFINITIONS = [
  {
    intention: "bebe" as const,
    apiFallback: "Bébé",
    chip: "Maman & Bébé",
    bannerTitle: "Maman & Bébé",
    bannerImg: "/images/maman.webp",
  },
  {
    intention: "solaire" as const,
    apiFallback: "Solaire",
    chip: "Solaire",
    bannerTitle: "Solaire",
    bannerImg: "/images/para-banner-solaire.webp",
  },
  {
    intention: "hygiene" as const,
    apiFallback: "Hygiène",
    chip: "Hygiène",
    bannerTitle: "Hygiène",
    bannerImg: "/images/para-banner-hygiene.webp",
  },
  {
    intention: "visage" as const,
    apiFallback: "Hydratation et nutrition",
    chip: "Visage",
    bannerTitle: "Soins Visage",
    bannerImg: "/images/para-banner-visage.webp",
    categoryType: "subcategory" as const,
  },
] as const;

/** Second home strip: lead with Solaire so this block opens on sun-care products. */
const PARA_SHOWCASE_DEFINITIONS_2 = [
  {
    intention: "solaire" as const,
    apiFallback: "Solaire",
    chip: "Solaire",
    bannerTitle: "Solaire",
    bannerImg: "/images/para-banner-solaire.webp",
  },
  {
    intention: "soins" as const,
    apiFallback: "Soins",
    chip: "Soins",
    bannerTitle: "Soins",
    bannerImg: "/images/item-cart.png",
  },
  {
    intention: "hommes" as const,
    apiFallback: "Hommes",
    chip: "Hommes",
    bannerTitle: "Hommes",
    bannerImg: "/images/shaving.webp",
  },
  {
    intention: "hygiene" as const,
    apiFallback: "Hygiène",
    chip: "Hygiène",
    bannerTitle: "Hygiène",
    bannerImg: "/images/para-banner-hygiene.webp",
  },
] as const;

type CardProduct = TrendingProduct;

function paraToCard(product: ParaProduct, isLight: boolean): CardProduct {
  const T = makeT(isLight);
  const stores = sortedShopPrices(product).slice(0, 3);
  return {
    id: product.id,
    brand: product.brand || "Produit",
    name: product.name,
    price: formatPrice(product.bestPrice),
    originalPrice:
      product.originalPrice && product.originalPrice > product.bestPrice
        ? formatPrice(product.originalPrice)
        : undefined,
    image: safeImageUrl(product.image),
    inStock: product.inStock,
    href: productHref(product, "para"),
    stores:
      stores.length > 0
        ? stores.map((shop, index) => ({
            name: normalizeShopName(shop.shop),
            dot: index === 0 ? T.teal : "rgba(100,116,139,0.9)",
            price: formatPrice(shop.price),
            best: index === 0,
          }))
        : [
            {
              name: "Meilleur prix",
              dot: T.teal,
              price: formatPrice(product.bestPrice),
              best: true,
            },
          ],
  };
}

function ParaProductCard({
  p,
  fallbackImg,
  isLight,
}: {
  p: CardProduct;
  fallbackImg: string;
  isLight: boolean;
}) {
  const T = makeT(isLight);
  const href = p.href || `/products/${encodeURIComponent(p.id)}?source=para`;
  const stores = p.stores.filter((s) => s.name).slice(0, 3);
  const img = p.image || fallbackImg;

  return (
    <div
      className="para-showcase-card"
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
        boxShadow: isLight
          ? "0 4px 20px rgba(91,33,182,0.10), 0 1px 4px rgba(0,0,0,0.06)"
          : "0 8px 32px rgba(0,0,0,0.45)",
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
          background: isLight
            ? "linear-gradient(180deg,rgba(91,33,182,0.06),rgba(91,33,182,0.02))"
            : "linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))",
          border: isLight
            ? "1px solid rgba(91,33,182,0.15)"
            : "1px solid rgba(255,255,255,0.1)",
          display: "block",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: 10,
            background: "rgba(255,255,255,0.97)",
            overflow: "hidden",
          }}
        >
          <img
            className="showcase-product-img"
            src={img}
            alt={p.name}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 767px) 44vw, (max-width: 1279px) 28vw, 220px"
            referrerPolicy="no-referrer"
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
              background: isLight
                ? "rgba(255,255,255,0.95)"
                : "rgba(0,0,0,0.88)",
              border: `1px solid ${isLight ? "rgba(91,33,182,0.35)" : "rgba(59,222,185,0.45)"}`,
              color: T.teal,
              boxShadow: isLight ? "0 2px 8px rgba(91,33,182,0.15)" : "none",
            }}
          >
            En stock
          </span>
        )}
      </a>

      <div
        style={{ display: "flex", flex: 1, flexDirection: "column", gap: 8 }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: T.teal,
          }}
        >
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
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: T.text,
              whiteSpace: "nowrap",
            }}
          >
            {p.price}
          </span>
          {p.originalPrice && (
            <span
              style={{
                fontSize: 10,
                color: T.muted,
                textDecoration: "line-through",
              }}
            >
              {p.originalPrice}
            </span>
          )}
        </div>

        <div
          style={{
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: T.muted,
            }}
          >
            Comparer les prix
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {stores.map((s, i) => (
              <div
                key={`${s.name}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 8,
                  padding: "6px 8px",
                  background: s.best ? T.rowBest : T.rowOther,
                  border: s.best
                    ? `1px solid ${T.rowBestBorder}`
                    : `1px solid ${isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: s.dot,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: s.best ? T.text : T.textSoft,
                    }}
                  >
                    {s.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: s.best ? T.price : T.textSoft,
                    }}
                  >
                    {s.price}
                  </span>
                  <Check
                    size={12}
                    strokeWidth={3}
                    style={{ color: T.teal }}
                    aria-hidden
                  />
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

type ShowcaseDef = {
  intention: ShowcaseIntention;
  apiFallback: string;
  chip: string;
  bannerTitle: string;
  bannerImg: string;
  categoryType?: "top_category" | "subcategory";
};

function ParapharmacieShowcaseBlock({
  definitions,
  defaultTab = 0,
}: {
  definitions: readonly ShowcaseDef[];
  defaultTab?: number;
}) {
  const isLight = useIsLight();
  const T = makeT(isLight);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [chipIdx, setChipIdx] = useState(defaultTab);
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [paraTopCategories, setParaTopCategories] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getParaCategories("top_category")
      .then((cats) => {
        if (!cancelled) setParaTopCategories(cats || []);
      })
      .catch(() => {
        if (!cancelled) setParaTopCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedRows = useMemo(
    () =>
      definitions.map((def) => ({
        ...def,
        api:
          resolveParaTopCategory(def.intention, paraTopCategories) ??
          def.apiFallback,
      })),
    [paraTopCategories, definitions],
  );

  const activeCategory = resolvedRows[chipIdx] ?? resolvedRows[0];

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const apiCategory = activeCategory.api;

    async function load() {
      setLoading(true);
      const forcedType = activeCategory.categoryType;
      try {
        let res = await listParaProducts(
          {
            category: apiCategory,
            category_type: forcedType ?? "top_category",
            limit: 48,
          },
          { signal: ac.signal },
        );
        if (!res.products?.length && !forcedType) {
          res = await listParaProducts(
            { category: apiCategory, category_type: "subcategory", limit: 48 },
            { signal: ac.signal },
          );
        }
        let raw = res.products || [];
        if (raw.length > 24) raw = raw.slice(0, 24);
        if (!cancelled)
          setProducts(raw.map((product) => paraToCard(product, isLight)));
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [activeCategory]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [chipIdx, products.length]);

  const moreHref = `/parapharmacie`;

  const scrollStrip = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div
      className="para-shell"
      style={{ width: "100%", background: T.bg, padding: "56px 0 64px" }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: SHOWCASE_SECTION_MAX_WIDTH,
          margin: "0 auto",
          padding: `0 ${SHOWCASE_SECTION_GUTTER_PX}px`,
          boxSizing: "border-box",
        }}
      >
        <style>{`
          [data-theme="light"] .para-shell {
            background: #f0f2ef !important;
          }
          [data-theme="light"] .para-shell .para-panel {
            background: #ffffff !important;
            border-color: rgba(0,0,0,0.1) !important;
            box-shadow: 0 14px 42px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.65) !important;
          }
          [data-theme="light"] .para-shell .para-showcase-card {
            background: #ffffff !important;
            border-color: rgba(0,0,0,0.09) !important;
            box-shadow: 0 6px 20px rgba(15,23,42,0.07) !important;
          }
          [data-theme="light"] .para-shell .para-showcase-arrow {
            background: #ffffff !important;
            border-color: rgba(0,0,0,0.12) !important;
          }
          [data-theme="light"] .para-shell .para-showcase-more {
            background: #ffffff !important;
            border-color: rgba(0,0,0,0.12) !important;
            color: #111827 !important;
            box-shadow: 0 10px 30px rgba(15,23,42,0.08) !important;
          }
          .para-showcase-card:hover {
            box-shadow: 0 12px 36px rgba(0,0,0,0.55), 0 0 28px rgba(59,222,185,0.15) !important;
            transform: translateY(-2px);
            border-color: rgba(59,222,185,0.4) !important;
          }
          .para-showcase-scroll {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            scroll-behavior: smooth;
            padding-bottom: 16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .para-showcase-scroll::-webkit-scrollbar { display: none; }
          @media (min-width: 640px) {
            .para-showcase-scroll {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              overflow-x: visible;
            }
          }
          @media (min-width: 1024px) {
            .para-showcase-scroll {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
          @media (min-width: 1280px) {
            .para-showcase-scroll {
              display: flex;
              overflow-x: auto;
            }
          }
          .para-showcase-banner { display: none; }
          @media (min-width: 1024px) {
            .para-showcase-banner { display: block !important; }
            .para-showcase-row { flex-direction: row !important; align-items: stretch !important; }
          }
          .para-showcase-wrap .para-showcase-arrow { display: flex; }
          @media (max-width: 767px) {
            .para-showcase-wrap .para-showcase-arrow {
              width: 34px !important;
              height: 34px !important;
            }
            .para-panel {
              padding: 20px 12px !important;
              border-radius: 16px !important;
            }
            .para-showcase-scroll {
              gap: 8px !important;
            }
            .para-showcase-card {
              width: calc((100% - 8px) / 2) !important;
              max-width: 156px !important;
              min-width: 140px !important;
              padding: 6px !important;
              border-radius: 10px !important;
            }
            .para-showcase-card > a {
              height: 108px !important;
              margin-bottom: 6px !important;
              border-radius: 8px !important;
            }
            .para-showcase-card .showcase-product-img {
              padding: 1px !important;
            }
            .para-showcase-card > div { gap: 4px !important; }
            .para-showcase-card > div > span:first-child { font-size: 8px !important; }
            .para-showcase-card > div > a {
              font-size: 9px !important;
              min-height: 22px !important;
              line-height: 1.2 !important;
            }
            .para-showcase-card > div > div:nth-child(3) span:first-child { font-size: 12px !important; }
            .para-showcase-card > div > div:nth-child(3) span:last-child { font-size: 8px !important; }
            .para-showcase-card > div > div:nth-child(4) > span {
              font-size: 7px !important;
              letter-spacing: 0.04em !important;
            }
            .para-showcase-card > div > div:nth-child(4) > div > div {
              padding: 3px 5px !important;
              border-radius: 6px !important;
            }
            .para-showcase-card > div > div:nth-child(4) > div > div span { font-size: 8px !important; }
            .para-showcase-card > div > div:nth-child(4) > div > div:nth-child(n+3) { display: none !important; }
            .para-showcase-card > div > div:nth-child(4) > div { gap: 3px !important; }
            .para-showcase-card > a > span {
              padding: 1px 6px !important;
              font-size: 8px !important;
              top: 6px !important;
              right: 6px !important;
            }
            .para-showcase-card .showcase-cta {
              padding: 6px 8px !important;
              font-size: 9px !important;
            }
            .para-showcase-card .showcase-cta svg {
              width: 12px !important;
              height: 12px !important;
            }
            .para-showcase-more {
              padding: 10px 14px !important;
              font-size: 12px !important;
              gap: 8px !important;
              width: 100%;
              justify-content: center;
            }
            .para-showcase-more > span {
              width: 24px !important;
              height: 24px !important;
              background: #ffffff !important;
              color: #5b21b6 !important;
            }
            .para-showcase-more > span svg {
              width: 14px !important;
              height: 14px !important;
            }
          }
          @media (max-width: 420px) {
            .para-showcase-card {
              min-width: 132px !important;
              max-width: 148px !important;
            }
            .para-showcase-card > a {
              height: 100px !important;
            }
          }
          .para-showcase-arrow:hover {
            border-color: rgba(59,222,185,0.5) !important;
            box-shadow: 0 0 24px rgba(59,222,185,0.18) !important;
          }
          .para-showcase-more:hover {
            border-color: rgba(59,222,185,0.4) !important;
            transform: translateY(-2px);
            box-shadow: 0 14px 36px rgba(0,0,0,0.45), 0 0 28px rgba(59,222,185,0.12) !important;
          }
        .para-showcase-more {
          animation: paraMoreFloat 2.8s ease-in-out infinite;
        }
        .para-showcase-more > span {
          animation: paraMorePulse 1.8s ease-in-out infinite;
        }
        .para-showcase-more:hover > span {
          transform: translateX(2px) scale(1.06);
        }
        @keyframes paraMoreFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes paraMorePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91,33,182,0.22); }
          50% { box-shadow: 0 0 0 7px rgba(91,33,182,0); }
        }
          .para-banner-group:hover .para-banner-img {
            transform: scale(1.1);
          }
          .para-banner-kicker,
          [data-theme="light"] #parapharmacie-accueil .para-banner-kicker {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            text-shadow: 0 2px 8px rgba(0,0,0,0.55) !important;
          }
          .para-banner-title,
          [data-theme="light"] #parapharmacie-accueil .para-banner-title {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            text-shadow: 0 2px 12px rgba(0,0,0,0.5) !important;
          }
        `}</style>

        <div
          className="para-panel"
          style={{
            background: T.panel,
            borderRadius: 24,
            border: `1px solid ${T.cardBorder}`,
            boxShadow:
              "0 16px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
            padding: "32px 16px",
            boxSizing: "border-box",
          }}
        >
          <div
            className="para-showcase-row"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              alignItems: "stretch",
            }}
          >
            <div
              className="para-showcase-banner"
              style={{ width: 320, flexShrink: 0 }}
            >
              <div
                className="para-banner-group"
                style={{
                  height: "100%",
                  minHeight: 420,
                  width: "100%",
                  position: "relative",
                  borderRadius: "2.5rem",
                  overflow: "hidden",
                  background: "#000000",
                  boxShadow:
                    "0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(59,222,185,0.12)",
                }}
              >
                <img
                  className="para-banner-img"
                  src={activeCategory.bannerImg}
                  alt={`Parapharmacie — ${activeCategory.bannerTitle}`}
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
                    background:
                      "linear-gradient(165deg, rgba(59,222,185,0.18) 0%, rgba(16,185,129,0.12) 42%, rgba(0,0,0,0.28) 100%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 24,
                    left: 24,
                    right: 24,
                  }}
                >
                  <span
                    className="para-banner-kicker"
                    style={{
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      opacity: 1,
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                      textDecorationColor: T.teal,
                      textShadow: "0 2px 8px rgba(0,0,0,0.55)",
                    }}
                  >
                    Para
                  </span>
                  <h3
                    className="para-banner-title"
                    style={{
                      color: "#fff",
                      fontSize: 22,
                      fontWeight: 900,
                      margin: "8px 0 0",
                      textShadow: "0 2px 12px rgba(0,0,0,0.35)",
                    }}
                  >
                    {activeCategory.bannerTitle}
                  </h3>
                </div>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
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
                  {resolvedRows.map((cat, i) => (
                    <button
                      key={`${cat.intention}-${i}`}
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
                        border:
                          i === chipIdx
                            ? `1px solid ${isLight ? "rgba(91,33,182,0.4)" : "rgba(255,255,255,0.28)"}`
                            : `1px solid ${isLight ? "rgba(91,33,182,0.15)" : "rgba(255,255,255,0.1)"}`,
                        boxShadow:
                          i === chipIdx
                            ? isLight
                              ? "0 4px 16px rgba(91,33,182,0.18)"
                              : "0 4px 20px rgba(0,0,0,0.3)"
                            : "none",
                        background:
                          i === chipIdx
                            ? isLight
                              ? "rgba(91,33,182,0.12)"
                              : "rgba(255,255,255,0.1)"
                            : isLight
                              ? "rgba(91,33,182,0.04)"
                              : "rgba(255,255,255,0.04)",
                        color: isLight
                          ? i === chipIdx
                            ? "#5B21B6"
                            : "rgba(0,0,0,0.6)"
                          : "#fff",
                        transition:
                          "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                      }}
                    >
                      {cat.chip}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{ position: "relative" }}
                className="para-showcase-wrap"
              >
                <button
                  type="button"
                  className="para-showcase-arrow"
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
                  className="para-showcase-arrow"
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

                <div ref={scrollerRef} className="para-showcase-scroll">
                  {loading ? (
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
                  ) : products.length === 0 ? (
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
                    products.map((p) => (
                      <ParaProductCard
                        key={p.id}
                        p={p}
                        fallbackImg={activeCategory.bannerImg}
                        isLight={isLight}
                      />
                    ))
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 8,
                }}
              >
                <a
                  className="para-showcase-more"
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
                    boxShadow:
                      "0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
                    transition:
                      "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
                  }}
                >
                  Voir plus de produits parapharmacie
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
                    <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const PARA_SHOWCASE_DEFINITIONS_3 = [
  {
    intention: "bebe" as const,
    apiFallback: "Maman et bébé",
    chip: "Maman & Bébé",
    bannerTitle: "Maman & Bébé",
    bannerImg: "/images/maman.webp",
  },
  {
    intention: "solaire" as const,
    apiFallback: "Solaire",
    chip: "Solaire",
    bannerTitle: "Solaire",
    bannerImg: "/images/para-banner-solaire.webp",
  },
  {
    intention: "hygiene" as const,
    apiFallback: "Hygiène",
    chip: "Hygiène",
    bannerTitle: "Hygiène",
    bannerImg: "/images/para-banner-hygiene.webp",
  },
  {
    intention: "visage" as const,
    apiFallback: "Hydratation et nutrition",
    chip: "Visage",
    bannerTitle: "Soins Visage",
    bannerImg: "/images/para-banner-visage.webp",
    categoryType: "subcategory" as const,
  },
] as const;

export function ParapharmacieShowcaseSection() {
  const isLight = useIsLight();
  const T = makeT(isLight);
  return (
    <div id="parapharmacie-accueil" style={{ width: "100%", background: T.bg }}>
      <style>{`
        #parapharmacie-accueil .para-headline {
          font-weight: 700;
          font-size: clamp(1.75rem, 4.5vw, 3.25rem);
          line-height: 1.2;
          margin: 0 0 12px 0;
          letter-spacing: -0.02em;
        }
        #parapharmacie-accueil .para-headline-teal {
          color: #3bdeb9;
        }
        #parapharmacie-accueil .para-headline .animationtext.letters {
          font-weight: 800 !important;
        }
        #parapharmacie-accueil .para-headline .animationtext.rotate-3 .cd-words-wrapper .item-text,
        #parapharmacie-accueil .para-headline .animationtext.rotate-3 .cd-words-wrapper .item-text i {
          color: #ffffff !important;
          background: none !important;
          -webkit-background-clip: unset !important;
          background-clip: unset !important;
          -webkit-text-fill-color: #ffffff !important;
          -webkit-text-stroke: 0 !important;
        }
        .is_dark #parapharmacie-accueil .para-headline .animationtext.rotate-3 .cd-words-wrapper .item-text,
        .is_dark #parapharmacie-accueil .para-headline .animationtext.rotate-3 .cd-words-wrapper .item-text i {
          color: #ffffff !important;
          background: none !important;
          -webkit-text-fill-color: #ffffff !important;
          -webkit-text-stroke: 0 !important;
        }
        [data-theme="light"] #parapharmacie-accueil .para-headline .animationtext.rotate-3 .cd-words-wrapper .item-text,
        [data-theme="light"] #parapharmacie-accueil .para-headline .animationtext.rotate-3 .cd-words-wrapper .item-text.is-hidden,
        [data-theme="light"] #parapharmacie-accueil .para-headline .animationtext.rotate-3 .cd-words-wrapper .item-text.is-visible,
        [data-theme="light"] #parapharmacie-accueil .para-headline .animationtext.rotate-3 .cd-words-wrapper .item-text i {
          color: #000000 !important;
          background: none !important;
          text-shadow: none !important;
          -webkit-background-clip: initial !important;
          background-clip: initial !important;
          -webkit-text-fill-color: #000000 !important;
          -webkit-text-stroke: 0 !important;
        }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: SHOWCASE_SECTION_MAX_WIDTH,
          margin: "0 auto",
          padding: `40px ${SHOWCASE_SECTION_GUTTER_PX}px 16px`,
          boxSizing: "border-box",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="para-headline wow fadeInUp" data-wow-delay="0.05s">
            <span className="para-headline-teal">Parapharmacie :</span>{" "}
            <span className="fst-italic font-playfair-display animationtext letters rotate-3">
              <span className="cd-words-wrapper">
                <span className="item-text is-visible">Comparez</span>
                <span className="item-text is-hidden">Économisez</span>
                <span className="item-text is-hidden">Trouvez</span>
              </span>
            </span>
          </div>
          <p
            className="wow fadeInUp"
            data-wow-delay="0.1s"
            style={{
              color: "#9ca3af",
              marginTop: 8,
              marginBottom: 0,
              fontSize: "clamp(0.95rem, 2vw, 1rem)",
              lineHeight: 1.5,
            }}
          >
            Trouvez les meilleurs prix parmi Parashop, Pharma Shop et Parafendri
          </p>
        </div>
      </div>
      <ParapharmacieShowcaseBlock definitions={PARA_SHOWCASE_DEFINITIONS} />
      <ParapharmacieShowcaseBlock
        definitions={PARA_SHOWCASE_DEFINITIONS_2}
        defaultTab={0}
      />
      <ParapharmacieShowcaseBlock
        definitions={PARA_SHOWCASE_DEFINITIONS_3}
        defaultTab={3}
      />
    </div>
  );
}
