"use client";

import { ArrowRight, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getParaCategories, listParaProducts } from "../lib/demo-data/catalog";
import type { ParaProduct } from "../lib/demo-data/types";
import {
  SHOWCASE_SECTION_GUTTER_PX,
  SHOWCASE_SECTION_MAX_WIDTH,
} from "../lib/showcase-layout";
import {
  formatPrice,
  normalizeShopName,
  safeImageUrl,
  sortedShopPrices,
} from "../lib/product-utils";

const L = {
  bg: "#f8fafc",
  foreground: "#0f172a",
  muted: "#64748b",
  card: "#ffffff",
  border: "#e2e8f0",
  orange: "#ea580c",
  orangeSoftBg: "#fff7ed",
  orangeSoftBorder: "#fed7aa",
  mutedRow: "#f1f5f9",
};

const DOTS = ["#06b6d4", "#14b8a6", "#9ca3af"];

type ShowcaseIntention = "bebe" | "solaire" | "hygiene" | "visage";

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
    bannerLocal: "/images/para-banner-solaire.webp",
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
    apiFallback: "Visage",
    chip: "Visage",
    bannerTitle: "Visage",
    bannerImg: "/images/item-cart.png",
  },
] as const;

type LightStore = {
  name: string;
  price: string;
  best: boolean;
  dot: string;
  ok: boolean;
};
type LightCard = {
  id: string;
  brand: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  inStock: boolean;
  stores: LightStore[];
};

function paraToLightCard(product: ParaProduct): LightCard {
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
    stores:
      stores.length > 0
        ? stores.map((shop, index) => ({
            name: normalizeShopName(shop.shop),
            dot: DOTS[index % DOTS.length] ?? "#06b6d4",
            price: formatPrice(shop.price),
            best: index === 0,
            ok: shop.available !== false,
          }))
        : [
            {
              name: "Meilleur prix",
              dot: DOTS[0] ?? "#06b6d4",
              price: formatPrice(product.bestPrice),
              best: true,
              ok: true,
            },
          ],
  };
}

function productParaHref(id: string) {
  return `/para/${encodeURIComponent(id)}`;
}

function bannerSrcForRow(row: { bannerImg: string; bannerLocal?: string }) {
  return row.bannerLocal || row.bannerImg;
}

function LightProductCard({
  p,
  fallbackImg,
}: {
  p: LightCard;
  fallbackImg: string;
}) {
  const href = productParaHref(p.id);
  const stores = p.stores.filter((s) => s.name).slice(0, 3);
  const img = p.image || fallbackImg;

  return (
    <div
      className="para-light-card"
      style={{
        display: "flex",
        width: "100%",
        maxWidth: 280,
        flexShrink: 0,
        flexDirection: "column",
        borderRadius: 16,
        border: `1px solid ${L.border}`,
        background: L.card,
        padding: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
    >
      <a
        href={href}
        style={{
          position: "relative",
          marginBottom: 12,
          height: 128,
          width: "100%",
          overflow: "hidden",
          borderRadius: 12,
          background: "rgba(241,245,249,0.85)",
          display: "block",
        }}
      >
        <img
          className="para-light-product-img"
          src={img}
          alt={p.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: 8,
          }}
        />
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
              background: "#22c55e",
              color: "#fff",
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
            letterSpacing: "0.06em",
            color: L.orange,
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
            color: L.foreground,
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
              color: L.orange,
              whiteSpace: "nowrap",
            }}
          >
            {p.price}
          </span>
          {p.originalPrice && (
            <span
              style={{
                fontSize: 10,
                color: L.muted,
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
              color: L.muted,
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
                  background: s.best ? "#f0fdf4" : L.mutedRow,
                  border: s.best
                    ? "1px solid #bbf7d0"
                    : "1px solid transparent",
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
                      color: L.foreground,
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
                      color: s.best ? "#16a34a" : L.foreground,
                    }}
                  >
                    {s.price}
                  </span>
                  {s.ok ? (
                    <Check
                      size={12}
                      strokeWidth={3}
                      style={{ color: "#22c55e" }}
                      aria-hidden
                    />
                  ) : (
                    <X
                      size={12}
                      strokeWidth={3}
                      style={{ color: "#f87171" }}
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <a
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
            color: "#fff",
            background: L.orange,
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

export function ParapharmacieShowcaseLightSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [chipIdx, setChipIdx] = useState(0);
  const [products, setProducts] = useState<LightCard[]>([]);
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
      PARA_SHOWCASE_DEFINITIONS.map((def) => ({
        ...def,
        api:
          resolveParaTopCategory(def.intention, paraTopCategories) ??
          def.apiFallback,
      })),
    [paraTopCategories],
  );

  const activeCategory = resolvedRows[chipIdx] ?? resolvedRows[0];
  const bannerDisplay = bannerSrcForRow(activeCategory);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const apiCategory = activeCategory.api;

    async function load() {
      setLoading(true);
      try {
        let res = await listParaProducts(
          { category: apiCategory, category_type: "top_category", limit: 48 },
          { signal: ac.signal },
        );
        if (!res.products?.length) {
          res = await listParaProducts(
            { category: apiCategory, category_type: "subcategory", limit: 48 },
            { signal: ac.signal },
          );
        }
        let raw = res.products || [];
        if (raw.length > 24) raw = raw.slice(0, 24);
        if (!cancelled) setProducts(raw.map(paraToLightCard));
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
  }, [activeCategory.api]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [chipIdx, products.length]);

  const moreHref = `/products?source=para&category=${encodeURIComponent(activeCategory.api)}&category_type=top_category`;

  const scrollStrip = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section
      id="parapharmacie-accueil"
      style={{
        width: "100%",
        maxWidth: SHOWCASE_SECTION_MAX_WIDTH,
        margin: "0 auto",
        padding: `32px ${SHOWCASE_SECTION_GUTTER_PX}px`,
        boxSizing: "border-box",
        background: L.bg,
      }}
    >
      <style>{`
        .para-light-card:hover {
          box-shadow: 0 10px 28px rgba(15,23,42,0.12) !important;
        }
        .para-light-card:hover .para-light-product-img {
          transform: scale(1.05);
        }
        .para-light-product-img {
          transition: transform 0.3s ease;
        }
        .para-light-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 16px;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .para-light-scroll::-webkit-scrollbar { display: none; }
        .para-light-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: stretch;
        }
        .para-light-banner-col {
          display: none;
          width: 280px;
          flex-shrink: 0;
        }
        .para-light-arrow {
          display: none;
          align-items: center;
          justify-content: center;
        }
        @media (min-width: 1024px) {
          .para-light-layout {
            flex-direction: row;
            align-items: stretch;
          }
          .para-light-banner-col {
            display: block;
          }
          .para-light-arrow {
            display: flex !important;
          }
        }
        @keyframes para-light-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.25); }
          50% { box-shadow: 0 0 0 6px rgba(234, 88, 12, 0.08); }
        }
        .para-light-arrow-btn {
          animation: para-light-pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 900,
            color: L.foreground,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Produits Parapharmacie
        </h2>
        <p
          style={{
            fontSize: 14,
            color: L.muted,
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          Comparez les prix des parapharmacies tunisiennes
        </p>
      </div>

      <div className="para-light-layout">
        <div className="para-light-banner-col">
          <div
            style={{
              height: "100%",
              minHeight: 400,
              width: "100%",
              position: "relative",
              borderRadius: "2.5rem",
              overflow: "hidden",
              background: "linear-gradient(to bottom right, #2dd4bf, #10b981)",
            }}
          >
            <img
              src={bannerDisplay}
              alt="Banner"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const el = e.currentTarget;
                if (el.src !== activeCategory.bannerImg)
                  el.src = activeCategory.bannerImg;
              }}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.75,
                transition: "transform 0.7s ease, opacity 0.3s",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  opacity: 0.85,
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                  textDecorationColor: "#fff",
                }}
              >
                Para
              </span>
              <h3
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 900,
                  margin: "6px 0 0",
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
              gap: 8,
              overflowX: "auto",
              paddingBottom: 8,
              scrollbarWidth: "none",
            }}
          >
            {resolvedRows.map((cat, i) => (
              <button
                key={cat.intention}
                type="button"
                onClick={() => setChipIdx(i)}
                style={{
                  borderRadius: 999,
                  padding: "8px 20px",
                  fontSize: 14,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  cursor: "pointer",
                  border:
                    i === chipIdx
                      ? `1px solid ${L.orange}`
                      : `1px solid ${L.border}`,
                  boxShadow:
                    i === chipIdx
                      ? "0 2px 8px rgba(234,88,12,0.2)"
                      : "0 1px 2px rgba(0,0,0,0.05)",
                  background: i === chipIdx ? L.orange : L.card,
                  color: i === chipIdx ? "#fff" : L.muted,
                }}
              >
                {cat.chip}
              </button>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="para-light-arrow para-light-arrow-btn"
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
                border: `2px solid ${L.orangeSoftBorder}`,
                background: L.card,
                cursor: "pointer",
                color: L.orange,
              }}
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="para-light-arrow para-light-arrow-btn"
              aria-label="Faire défiler vers la droite"
              onClick={() => scrollStrip(320)}
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translate(50%, -50%)",
                zIndex: 20,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: `2px solid ${L.orangeSoftBorder}`,
                background: L.card,
                cursor: "pointer",
                color: L.orange,
              }}
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>

            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 16,
                width: 32,
                background: `linear-gradient(to right, ${L.bg}, transparent)`,
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
                background: `linear-gradient(to left, ${L.bg}, transparent)`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            />

            <div ref={scrollerRef} className="para-light-scroll">
              {loading ? (
                <div
                  style={{
                    padding: "48px 24px",
                    color: L.muted,
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
                    color: L.muted,
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
                  <LightProductCard
                    key={p.id}
                    p={p}
                    fallbackImg={activeCategory.bannerImg}
                  />
                ))
              )}
            </div>
          </div>

          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
          >
            <a
              href={moreHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 999,
                border: `1px solid ${L.orangeSoftBorder}`,
                background: L.orangeSoftBg,
                padding: "16px 32px",
                fontSize: 16,
                fontWeight: 800,
                color: "#c2410c",
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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
                  background: L.orange,
                  color: "#fff",
                }}
              >
                <ArrowRight size={18} strokeWidth={2.5} aria-hidden />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
