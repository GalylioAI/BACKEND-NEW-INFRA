"use client";

import type { ProductPageClientProps } from "./ProductPageClient";
import type { ShopPrice } from "../../lib/api/types";
import { formatPrice, normalizeShopName, shopLogo, sourceLabel } from "../../lib/product-utils";
import PriceEvolutionChart from "./PriceEvolutionChart";
import ProductImageGallery from "./ProductImageGallery";
import RecommendationsCarousel from "./RecommendationsCarousel";

/* ── Light tokens ────────────────────────────────────────────────────── */
const T = {
  bg:            "#f5f3ff",
  bgImage:       "radial-gradient(circle at 8% 10%, rgba(91,33,182,0.12) 0%, rgba(91,33,182,0.04) 36%, transparent 60%), radial-gradient(circle at 92% 14%, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.04) 32%, transparent 58%), radial-gradient(circle at 50% 95%, rgba(167,139,250,0.08) 0%, transparent 50%), linear-gradient(180deg, #f9f8ff 0%, #ede9fe 100%)",
  surface:       "#ffffff",
  border:        "rgba(91,33,182,0.13)",
  borderAccent:  "rgba(91,33,182,0.32)",
  cardShadow:    "0 4px 24px rgba(91,33,182,0.09), 0 1px 4px rgba(0,0,0,0.04)",
  imgBg:         "linear-gradient(135deg, #f0eefe 0%, #ede9fe 100%)",
  imgGlow:       "radial-gradient(circle at 50% 40%, rgba(91,33,182,0.07), transparent 65%)",
  purple:        "#7C3AED",
  purpleDark:    "#5B21B6",
  purpleDim:     "rgba(91,33,182,0.10)",
  grad:          "linear-gradient(135deg,#5B21B6 0%,#7C3AED 55%,#8B5CF6 100%)",
  text:          "#1e1b4b",
  textSoft:      "rgba(30,27,75,0.80)",
  textMuted:     "rgba(30,27,75,0.52)",
  priceOld:      "rgba(30,27,75,0.38)",
  badge:         "#16a34a",
  badgeOos:      "#dc2626",
  statBg:        "rgba(91,33,182,0.04)",
  storeBestBg:   "rgba(91,33,182,0.07)",
  storeBg:       "rgba(91,33,182,0.02)",
  divider:       "rgba(91,33,182,0.10)",
  specEvenBg:    "rgba(91,33,182,0.03)",
  blobA:         "radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.30) 0%, rgba(167,139,250,0.12) 38%, transparent 72%)",
  blobB:         "radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.08) 45%, transparent 72%)",
  blobC:         "radial-gradient(circle, rgba(91,33,182,0.16) 0%, rgba(91,33,182,0.05) 42%, transparent 74%)",
};

/* ── Sub-components ──────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: 1, background: T.divider, margin: 0 }} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 3, height: 18, borderRadius: 99, background: T.grad, flexShrink: 0 }} />
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em" }}>
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
      gap: 8, padding: "10px 12px", borderRadius: 12, flexWrap: "wrap",
      background: isBest ? T.storeBestBg : T.storeBg,
      border: `1px solid ${isBest ? T.borderAccent : T.border}`,
      boxShadow: isBest ? "0 2px 12px rgba(91,33,182,0.08)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", border: "1px solid rgba(91,33,182,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          <img src={shopLogo(shop.shop)} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{name}</span>
          {isBest && <span style={{ fontSize: 9, fontWeight: 800, color: T.purple, letterSpacing: "0.06em", textTransform: "uppercase" }}>Meilleur prix</span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 8px",
          color: available ? T.purple : T.badgeOos,
          background: available ? "rgba(91,33,182,0.08)" : "rgba(220,38,38,0.08)",
          border: `1px solid ${available ? "rgba(91,33,182,0.18)" : "rgba(220,38,38,0.18)"}`,
        }}>
          {available ? "En stock" : "Indisponible"}
        </span>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          {shop.oldPrice && shop.oldPrice > shop.price && (
            <span style={{ fontSize: 10, color: T.priceOld, textDecoration: "line-through", lineHeight: 1 }}>{formatPrice(shop.oldPrice)}</span>
          )}
          <span style={{ fontSize: 14, fontWeight: 800, color: isBest ? T.purpleDark : T.text }}>{formatPrice(shop.price)}</span>
        </div>

        {shop.url ? (
          <a href={shop.url} target="_blank" rel="noreferrer" style={{
            fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "7px 14px",
            textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.2s ease",
            color: "#ffffff",
            background: "linear-gradient(135deg, #5B21B6, #7C3AED)",
            boxShadow: "0 3px 10px rgba(91,33,182,0.25)",
          }}>
            Voir l&apos;offre →
          </a>
        ) : (
          <span style={{ fontSize: 11, color: T.textMuted }}>—</span>
        )}
      </div>
    </div>
  );
}

/* ── Main light interface ─────────────────────────────────────────────── */
export default function ProductPageLight({
  product, source, stores, specs, recommendations, savings,
  productImages, category, chartSeries, chartMonths,
  availableShopsCount, totalShopsCount, bestGap,
}: ProductPageClientProps) {
  return (
    <div style={{
      backgroundColor: T.bg,
      backgroundImage: T.bgImage,
      backgroundSize: "100% 100%",
      minHeight: "100vh",
      color: T.text,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <style>{`
        .product-detail-grid { grid-template-columns: 380px 1fr 1fr; align-items: start; }
        @media (max-width: 1100px) { .product-detail-grid { grid-template-columns: 340px 1fr; } }
        @media (max-width: 900px)  { .product-detail-grid { grid-template-columns: 1fr; } }
        @keyframes pdAmbientA {
          0%,100% { transform: translate3d(0,0,0) scale(1); opacity: 0.7; }
          50%      { transform: translate3d(-16px,12px,0) scale(1.05); opacity: 1; }
        }
        @keyframes pdAmbientB {
          0%,100% { transform: translate3d(0,0,0) scale(1); opacity: 0.6; }
          50%      { transform: translate3d(14px,-12px,0) scale(1.06); opacity: 0.9; }
        }
        @keyframes pdAmbientPulse {
          0%,100% { opacity: 0.3; }
          50%      { opacity: 0.6; }
        }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -160, left: "50%", transform: "translateX(-50%)", width: 1100, height: 600, background: T.blobA, filter: "blur(8px)", animation: "pdAmbientA 20s ease-in-out infinite" }} />
        <div style={{ position: "absolute", right: -140, top: "18%", width: 480, height: 480, borderRadius: "50%", background: T.blobB, filter: "blur(10px)", animation: "pdAmbientB 24s ease-in-out infinite" }} />
        <div style={{ position: "absolute", left: -160, bottom: -140, width: 520, height: 520, borderRadius: "50%", background: T.blobC, filter: "blur(12px)", animation: "pdAmbientA 28s ease-in-out infinite reverse" }} />
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 72px", position: "relative", zIndex: 1 }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexWrap: "wrap" }}>
            <a href="/" style={{ color: T.purpleDark, textDecoration: "none", fontWeight: 700 }}>Accueil</a>
            <span style={{ color: T.textMuted }}>/</span>
            <a href={source === "para" ? "/parapharmacie" : "/products"} style={{ color: T.purpleDark, textDecoration: "none", fontWeight: 700 }}>{sourceLabel(source)}</a>
            <span style={{ color: T.textMuted }}>/</span>
            {category && <>
              <span style={{ color: T.textSoft, fontWeight: 600 }}>{category}</span>
              <span style={{ color: T.textMuted }}>/</span>
            </>}
            <span style={{ color: T.textMuted, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</span>
          </nav>
          <a href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700,
            borderRadius: 999, padding: "8px 16px", textDecoration: "none", whiteSpace: "nowrap",
            color: T.text, background: "#ffffff",
            border: `1px solid ${T.border}`,
            boxShadow: "0 4px 14px rgba(91,33,182,0.10)",
          }}>
            ← Retour à l&apos;accueil
          </a>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gap: 24, alignItems: "start" }} className="product-detail-grid">

          {/* Left: image panel */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", boxShadow: T.cardShadow }}>
              <div style={{ height: 360, background: T.imgBg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: T.imgGlow }} />
                <ProductImageGallery images={productImages} alt={product.name} />
                <div style={{
                  position: "absolute", top: 16, right: 16,
                  background: product.inStock ? T.badge : T.badgeOos,
                  color: "#fff", fontSize: 10, fontWeight: 800,
                  borderRadius: 6, padding: "4px 10px", letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                  {product.inStock ? "EN STOCK" : "INDISPONIBLE"}
                </div>
              </div>
              <Divider />
              <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>Réf: <span style={{ color: T.text, fontWeight: 700 }}>{product.id.slice(-8).toUpperCase()}</span></span>
                <span style={{ fontSize: 11, background: T.purpleDim, borderRadius: 6, padding: "3px 10px", color: T.purpleDark, fontWeight: 700 }}>{category}</span>
              </div>
            </div>
          </div>

          {/* Col 2: product header */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "22px 22px 18px", boxShadow: T.cardShadow, minHeight: 400, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.purple }}>
                {product.brand || sourceLabel(source)}
              </span>
              {savings && (
                <span style={{ fontSize: 10, fontWeight: 800, color: "#ffffff", background: "linear-gradient(135deg,#5B21B6,#7C3AED)", borderRadius: 5, padding: "2px 8px" }}>
                  -{savings}%
                </span>
              )}
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: "1.25rem", fontWeight: 800, color: T.text, lineHeight: 1.3, letterSpacing: "-0.02em" }}>
              {product.name}
            </h1>
            <Divider />
            <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: "2rem", fontWeight: 900, color: T.text, letterSpacing: "-0.03em" }}>
                {formatPrice(product.bestPrice)}
              </span>
              {product.originalPrice && product.originalPrice > product.bestPrice && (
                <span style={{ fontSize: 14, color: T.priceOld, textDecoration: "line-through" }}>
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {stores.length > 0 && (
              <p style={{ margin: "4px 0 0", fontSize: 11, color: T.textMuted }}>
                Prix le plus bas chez <span style={{ color: T.purple, fontWeight: 700 }}>{normalizeShopName(stores[0].shop)}</span>
              </p>
            )}
            <div style={{ height: 1, background: T.divider, margin: "12px 0 0" }} />
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Boutiques actives", value: `${availableShopsCount}/${totalShopsCount}` },
                { label: "Historique prix", value: chartSeries.length > 0 ? "12 mois" : "N/A" },
                { label: "Économie max", value: bestGap ? formatPrice(bestGap) : "—", accent: true },
                { label: "Statut global", value: product.inStock ? "Disponible" : "Rupture", oos: !product.inStock },
              ].map(({ label, value, accent, oos }) => (
                <div key={label} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", background: T.statBg }}>
                  <p style={{ margin: 0, fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 800, color: oos ? T.badgeOos : accent ? T.purpleDark : T.text }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: chart */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "18px 18px 14px", boxShadow: T.cardShadow, display: "flex", flexDirection: "column" }}>
            <SectionTitle>Évolution des prix</SectionTitle>
            <PriceEvolutionChart series={chartSeries} months={chartMonths} bestPrice={product.bestPrice} originalPrice={product.originalPrice} />
          </div>

          {/* Row 2: price comparison */}
          <div style={{ gridColumn: "1 / -1", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "18px 18px 14px", boxShadow: T.cardShadow }}>
            <SectionTitle>Comparer les prix</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 8 }}>
              {stores.length > 0 ? (
                stores.map((shop, i) => <StoreRow key={`${shop.shop}-${shop.price}`} shop={shop} index={i} />)
              ) : (
                <div style={{ padding: 14, borderRadius: 10, background: T.statBg, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, textAlign: "center" }}>
                  Aucun prix boutique disponible.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div style={{ marginTop: 28, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "28px 28px 24px", boxShadow: T.cardShadow }}>
          <SectionTitle>Caractéristiques</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {specs.map((spec, i) => (
              <div key={spec.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
                padding: "12px 16px", borderRadius: 10,
                background: i % 2 === 0 ? T.specEvenBg : "transparent",
                border: `1px solid ${T.border}`,
              }}>
                <span style={{ fontSize: 13, color: T.textMuted, flexShrink: 0 }}>{spec.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text, textAlign: "right" }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 3, height: 22, borderRadius: 99, background: T.grad }} />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Produits similaires</h2>
              </div>
              <a href={source === "para" ? "/parapharmacie" : "/products"} style={{ fontSize: 13, fontWeight: 600, color: T.purple, textDecoration: "none" }}>
                Voir tout →
              </a>
            </div>
            <RecommendationsCarousel
              recommendations={recommendations}
              source={source}
              theme={{ surface: T.surface, border: T.border, text: T.text, textSoft: T.textSoft, teal: T.purple }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
