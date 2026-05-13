"use client";

import { useEffect, useState } from "react";
import type { CatalogProduct, CatalogSource, ShopPrice } from "../../lib/api/types";
import type { ShopSeries } from "./PriceEvolutionChart";
import PriceEvolutionChart from "./PriceEvolutionChart";
import ProductImageGallery from "./ProductImageGallery";
import RecommendationsCarousel from "./RecommendationsCarousel";
import { formatPrice, normalizeShopName, shopLogo, sourceLabel } from "../../lib/product-utils";
import ProductPageLight from "./ProductPageLight";

/* ── Shared props type (exported so page.tsx and ProductPageLight can import it) ── */
export interface ProductPageClientProps {
  product: CatalogProduct;
  source: CatalogSource;
  stores: ShopPrice[];
  specs: { label: string; value: string }[];
  recommendations: CatalogProduct[];
  savings: number | null;
  productImages: string[];
  category: string;
  chartSeries: ShopSeries[];
  chartMonths: string[];
  availableShopsCount: number;
  totalShopsCount: number;
  bestGap: number | null;
}

/* ── useIsLight ──────────────────────────────────────────────────────── */
function useIsLight() {
  const [light, setLight] = useState(
    typeof document !== "undefined" && document.documentElement.dataset.theme === "light"
  );
  useEffect(() => {
    const check = () => setLight(document.documentElement.dataset.theme === "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return light;
}

/* ── Dark design tokens ──────────────────────────────────────────────── */
const D = {
  bg:          "#0f1421",
  bgImage:     "radial-gradient(circle at 12% 10%, rgba(59,222,185,0.05) 0%, rgba(59,222,185,0.012) 36%, transparent 62%), radial-gradient(circle at 86% 16%, rgba(86,180,233,0.04) 0%, rgba(86,180,233,0.01) 34%, transparent 60%), linear-gradient(180deg, #0f1421 0%, #0a0f1a 100%)",
  surface:     "#171f31",
  border:      "rgba(255,255,255,0.16)",
  borderAccent:"rgba(59,222,185,0.25)",
  cardShadow:  "0 8px 32px rgba(0,0,0,0.3)",
  imgBg:       "linear-gradient(135deg, #16161f 0%, #1a1a28 100%)",
  imgGlow:     "radial-gradient(circle at 50% 40%, rgba(59,222,185,0.05), transparent 65%)",
  teal:        "#3BDEB9",
  tealDim:     "rgba(59,222,185,0.15)",
  grad:        "linear-gradient(135deg,#3BDEB9 0%,#77E590 60%,#CCFF9B 100%)",
  text:        "#f0f0f5",
  textSoft:    "rgba(240,240,245,0.9)",
  textMuted:   "rgba(240,240,245,0.72)",
  priceOld:    "rgba(240,240,245,0.38)",
  badge:       "#22c55e",
  badgeOos:    "#ef4444",
  statBg:      "rgba(255,255,255,0.02)",
  storeBestBg: "rgba(59,222,185,0.07)",
  storeBg:     "rgba(255,255,255,0.025)",
  divider:     "rgba(255,255,255,0.16)",
  specEvenBg:  "rgba(255,255,255,0.02)",
  blobA:       "radial-gradient(ellipse at 50% 0%, rgba(147,197,253,0.14) 0%, rgba(147,197,253,0.06) 35%, transparent 72%)",
  blobB:       "radial-gradient(circle, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 45%, transparent 72%)",
  blobC:       "radial-gradient(circle, rgba(148,163,184,0.10) 0%, rgba(148,163,184,0.03) 42%, transparent 74%)",
};

/* ── Dark sub-components ─────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: 1, background: D.divider, margin: 0 }} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 3, height: 18, borderRadius: 99, background: D.grad, flexShrink: 0 }} />
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: D.text, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em" }}>
        {children}
      </h2>
    </div>
  );
}

function StoreRow({ shop, index }: { shop: ShopPrice; index: number }) {
  const available = shop.available ?? true;
  const name = normalizeShopName(shop.shop);
  const isBest = index === 0;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 8, padding: "9px 11px", borderRadius: 10, flexWrap: "wrap",
      background: isBest ? D.storeBestBg : D.storeBg,
      border: `1px solid ${isBest ? D.borderAccent : D.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          <img src={shopLogo(shop.shop)} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{name}</span>
          {isBest && <span style={{ fontSize: 9, fontWeight: 800, color: D.teal, letterSpacing: "0.06em", textTransform: "uppercase" }}>Meilleur prix</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 6px",
          color: available ? D.teal : D.badgeOos,
          background: available ? "rgba(59,222,185,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${available ? "rgba(59,222,185,0.2)" : "rgba(239,68,68,0.2)"}`,
        }}>
          {available ? "En stock" : "Indisponible"}
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {shop.oldPrice && shop.oldPrice > shop.price && (
            <span style={{ fontSize: 10, color: D.priceOld, textDecoration: "line-through", lineHeight: 1 }}>{formatPrice(shop.oldPrice)}</span>
          )}
          <span style={{ fontSize: 14, fontWeight: 800, color: isBest ? D.teal : D.textSoft }}>{formatPrice(shop.price)}</span>
        </div>
        {shop.url ? (
          <a href={shop.url} target="_blank" rel="noreferrer" style={{
            fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "8px 14px",
            textDecoration: "none", whiteSpace: "nowrap",
            color: "#ffffff", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          }}>
            Voir l&apos;offre →
          </a>
        ) : (
          <span style={{ fontSize: 11, color: D.textMuted }}>—</span>
        )}
      </div>
    </div>
  );
}

/* ── Dark page ───────────────────────────────────────────────────────── */
function ProductPageDark({
  product, source, stores, specs, recommendations, savings,
  productImages, category, chartSeries, chartMonths,
  availableShopsCount, totalShopsCount, bestGap,
}: ProductPageClientProps) {
  return (
    <div style={{ backgroundColor: D.bg, backgroundImage: D.bgImage, backgroundSize: "100% 100%", minHeight: "100vh", color: D.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        .product-detail-grid { grid-template-columns: 380px 1fr 1fr; align-items: start; }
        @media (max-width: 1100px) { .product-detail-grid { grid-template-columns: 340px 1fr; } }
        @media (max-width: 900px)  { .product-detail-grid { grid-template-columns: 1fr; } }
        @keyframes pdAmbientA { 0%,100%{transform:translate3d(0,0,0) scale(1);opacity:0.14} 50%{transform:translate3d(-14px,10px,0) scale(1.04);opacity:0.2} }
        @keyframes pdAmbientB { 0%,100%{transform:translate3d(0,0,0) scale(1);opacity:0.12} 50%{transform:translate3d(12px,-10px,0) scale(1.05);opacity:0.18} }
        @keyframes pdAmbientPulse { 0%,100%{opacity:0.05} 50%{opacity:0.09} }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 980, height: 520, background: D.blobA, filter: "blur(10px)", animation: "pdAmbientA 22s ease-in-out infinite" }} />
        <div style={{ position: "absolute", right: -120, top: "22%", width: 420, height: 420, borderRadius: "50%", background: D.blobB, filter: "blur(12px)", animation: "pdAmbientB 26s ease-in-out infinite" }} />
        <div style={{ position: "absolute", left: -140, bottom: -120, width: 460, height: 460, borderRadius: "50%", background: D.blobC, filter: "blur(14px)", animation: "pdAmbientA 30s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.05), transparent 58%)", animation: "pdAmbientPulse 12s ease-in-out infinite" }} />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 72px", position: "relative", zIndex: 1 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: D.textSoft, flexWrap: "wrap" }}>
            <a href="/" style={{ color: "#ffffff", textDecoration: "none", fontWeight: 600 }}>Accueil</a>
            <span style={{ color: D.textSoft }}>/</span>
            <a href={source === "para" ? "/parapharmacie" : "/products"} style={{ color: "#ffffff", textDecoration: "none", fontWeight: 600 }}>{sourceLabel(source)}</a>
            <span style={{ color: D.textSoft }}>/</span>
            {category && <><span style={{ color: "#ffffff" }}>{category}</span><span style={{ color: D.textSoft }}>/</span></>}
            <span style={{ color: D.textMuted, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</span>
          </nav>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#ffffff", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "8px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>
            ← Retour à l&apos;accueil
          </a>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gap: 24, alignItems: "start" }} className="product-detail-grid">

          {/* Left: image */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ height: 360, background: D.imgBg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: D.imgGlow }} />
                <ProductImageGallery images={productImages} alt={product.name} />
                <div style={{ position: "absolute", top: 16, right: 16, background: product.inStock ? D.badge : D.badgeOos, color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 6, padding: "4px 10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {product.inStock ? "EN STOCK" : "INDISPONIBLE"}
                </div>
              </div>
              <Divider />
              <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 11, color: D.textMuted }}>Réf: <span style={{ color: D.textSoft, fontWeight: 600 }}>{product.id.slice(-8).toUpperCase()}</span></span>
                <span style={{ fontSize: 11, background: D.tealDim, borderRadius: 6, padding: "3px 8px", color: "#ffffff", fontWeight: 700 }}>{category}</span>
              </div>
            </div>
          </div>

          {/* Col 2: header */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 20, padding: "22px 22px 18px", boxShadow: D.cardShadow, minHeight: 400, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: D.teal }}>{product.brand || sourceLabel(source)}</span>
              {savings && <span style={{ fontSize: 10, fontWeight: 800, color: "#0a140f", background: D.grad, borderRadius: 5, padding: "2px 8px" }}>-{savings}%</span>}
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: "1.25rem", fontWeight: 800, color: D.text, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{product.name}</h1>
            <Divider />
            <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" }}>{formatPrice(product.bestPrice)}</span>
              {product.originalPrice && product.originalPrice > product.bestPrice && (
                <span style={{ fontSize: 14, color: D.priceOld, textDecoration: "line-through" }}>{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            {stores.length > 0 && (
              <p style={{ margin: "4px 0 0", fontSize: 11, color: D.textMuted }}>
                Prix le plus bas chez <span style={{ color: D.teal, fontWeight: 700 }}>{normalizeShopName(stores[0].shop)}</span>
              </p>
            )}
            <div style={{ height: 1, background: D.divider, margin: "12px 0 0" }} />
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Boutiques actives", value: `${availableShopsCount}/${totalShopsCount}` },
                { label: "Historique prix", value: chartSeries.length > 0 ? "12 mois" : "N/A" },
                { label: "Économie max", value: bestGap ? formatPrice(bestGap) : "—", accent: true },
                { label: "Statut global", value: product.inStock ? "Disponible" : "Rupture", oos: !product.inStock },
              ].map(({ label, value, accent, oos }) => (
                <div key={label} style={{ border: `1px solid ${D.border}`, borderRadius: 10, padding: "10px 12px", background: D.statBg }}>
                  <p style={{ margin: 0, fontSize: 10, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 800, color: oos ? D.badgeOos : accent ? "#ffffff" : D.text }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: chart */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 20, padding: "18px 18px 14px", boxShadow: D.cardShadow, display: "flex", flexDirection: "column" }}>
            <SectionTitle>Évolution des prix</SectionTitle>
            <PriceEvolutionChart series={chartSeries} months={chartMonths} bestPrice={product.bestPrice} originalPrice={product.originalPrice} />
          </div>

          {/* Row 2: prices */}
          <div style={{ gridColumn: "1 / -1", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 20, padding: "18px 18px 14px", boxShadow: D.cardShadow }}>
            <SectionTitle>Comparer les prix</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 8 }}>
              {stores.length > 0 ? stores.map((shop, i) => <StoreRow key={`${shop.shop}-${shop.price}`} shop={shop} index={i} />) : (
                <div style={{ padding: 14, borderRadius: 10, background: D.statBg, border: `1px solid ${D.border}`, color: D.textMuted, fontSize: 13, textAlign: "center" }}>Aucun prix boutique disponible.</div>
              )}
            </div>
          </div>
        </div>

        {/* Specs */}
        <div style={{ marginTop: 28, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 20, padding: "28px 28px 24px", boxShadow: D.cardShadow }}>
          <SectionTitle>Caractéristiques</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {specs.map((spec, i) => (
              <div key={spec.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 10, background: i % 2 === 0 ? D.specEvenBg : "transparent", border: `1px solid ${D.border}` }}>
                <span style={{ fontSize: 13, color: D.textMuted, flexShrink: 0 }}>{spec.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: D.text, textAlign: "right" }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 3, height: 22, borderRadius: 99, background: D.grad }} />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: D.text }}>Produits similaires</h2>
              </div>
              <a href={source === "para" ? "/parapharmacie" : "/products"} style={{ fontSize: 13, fontWeight: 600, color: D.teal, textDecoration: "none" }}>Voir tout →</a>
            </div>
            <RecommendationsCarousel recommendations={recommendations} source={source} theme={{ surface: D.surface, border: D.border, text: D.text, textSoft: D.textSoft, teal: D.teal }} />
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Switcher ─────────────────────────────────────────────────────────── */
export default function ProductPageClient(props: ProductPageClientProps) {
  const isLight = useIsLight();
  return isLight ? <ProductPageLight {...props} /> : <ProductPageDark {...props} />;
}
