"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";

type IngredientIconKind =
  | "garlic"
  | "harissa"
  | "eggs"
  | "oliveOil"
  | "onions"
  | "salt"
  | "tomatoPaste"
  | "tomatoes";

const shopStyles = {
  Monoprix: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  Carrefour: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  GeantDrive: { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
} as const;

type ShopName = keyof typeof shopStyles;
type TooltipSide = "top" | "bottom" | "left" | "right";
type ShopPrice = { name: ShopName; price: number };
type Ingredient = {
  accent: string;
  badge: string;
  brand: string;
  delay: string;
  icon: IngredientIconKind;
  left: string;
  name: string;
  shops: ShopPrice[];
  size: string;
  tooltipSide: TooltipSide;
  top: string;
};

const shopLegend: ShopName[] = ["Monoprix", "Carrefour", "GeantDrive"];

/** Prix au rayon = paquet entier ; prix affiché = coût pour la quantité « recette » (proportion du paquet). */
const ingredients: Ingredient[] = [
  {
    name: "Ail Frais",
    brand: "Locale",
    size: "50g",
    badge: "Légumes",
    icon: "garlic",
    accent: "#C7A7FF",
    left: "16%",
    top: "23%",
    delay: "0s",
    tooltipSide: "right",
    shops: [
      { name: "Carrefour", price: 0.85 },
      { name: "Monoprix", price: 0.9 },
      { name: "GeantDrive", price: 0.95 },
    ],
  },
  {
    name: "Oignons Blancs",
    brand: "Locale",
    size: "2 pièces (~200g)",
    badge: "Légumes",
    icon: "onions",
    accent: "#F3C864",
    left: "50%",
    top: "15%",
    delay: "0.35s",
    tooltipSide: "bottom",
    shops: [
      { name: "Carrefour", price: 0.398 },
      { name: "Monoprix", price: 0.43 },
      { name: "GeantDrive", price: 0.45 },
    ],
  },
  {
    name: "Harissa",
    brand: "Cap Bon",
    size: "15g",
    badge: "Épices",
    icon: "harissa",
    accent: "#FF7D54",
    left: "84%",
    top: "23%",
    delay: "0.7s",
    tooltipSide: "left",
    shops: [
      { name: "Carrefour", price: 0.15 },
      { name: "Monoprix", price: 0.161 },
      { name: "GeantDrive", price: 0.172 },
    ],
  },
  {
    name: "Concentré Tomates",
    brand: "Sicam",
    size: "100g",
    badge: "Conserves",
    icon: "tomatoPaste",
    accent: "#FF9075",
    left: "10%",
    top: "56%",
    delay: "1.05s",
    tooltipSide: "right",
    shops: [
      { name: "Carrefour", price: 0.463 },
      { name: "Monoprix", price: 0.488 },
      { name: "GeantDrive", price: 0.525 },
    ],
  },
  {
    name: "Sel de Table",
    brand: "Cotusal",
    size: "10g",
    badge: "Épices",
    icon: "salt",
    accent: "#D8DEE8",
    left: "90%",
    top: "56%",
    delay: "1.4s",
    tooltipSide: "left",
    shops: [
      { name: "Carrefour", price: 0.015 },
      { name: "Monoprix", price: 0.017 },
      { name: "GeantDrive", price: 0.018 },
    ],
  },
  {
    name: "Huile Végétale",
    brand: "Nejma",
    size: "100 ml",
    badge: "Huiles",
    icon: "oliveOil",
    accent: "#F3CA59",
    left: "19%",
    top: "82%",
    delay: "1.75s",
    tooltipSide: "right",
    shops: [
      { name: "Carrefour", price: 0.469 },
      { name: "Monoprix", price: 0.485 },
      { name: "GeantDrive", price: 0.495 },
    ],
  },
  {
    name: "Tomates Fraîches",
    brand: "Locale",
    size: "100g",
    badge: "Légumes",
    icon: "tomatoes",
    accent: "#FF6F61",
    left: "50%",
    top: "88%",
    delay: "2.1s",
    tooltipSide: "top",
    shops: [
      { name: "Carrefour", price: 0.299 },
      { name: "Monoprix", price: 0.325 },
      { name: "GeantDrive", price: 0.345 },
    ],
  },
  {
    name: "Œufs Frais",
    brand: "El Mazraa",
    size: "4 pièces",
    badge: "Frais",
    icon: "eggs",
    accent: "#F5D783",
    left: "81%",
    top: "84%",
    delay: "2.45s",
    tooltipSide: "left",
    shops: [
      { name: "Carrefour", price: 1.5 },
      { name: "Monoprix", price: 1.75 },
      { name: "GeantDrive", price: 1.6 },
    ],
  },
];

const fmtNum = (p: number) => p.toFixed(3);

/** Total panier par enseigne (somme des prix recette pour chaque ingrédient). */
function computeCouffinStats(ings: Ingredient[]) {
  const byShop = {} as Record<ShopName, number>;
  for (const name of shopLegend) {
    byShop[name] = ings.reduce((sum, ing) => {
      const row = ing.shops.find((s) => s.name === name);
      return sum + (row?.price ?? 0);
    }, 0);
  }
  const totals = shopLegend.map((n) => byShop[n]);
  const best = Math.min(...totals);
  const worst = Math.max(...totals);
  const carrefour = byShop.Carrefour;
  return { byShop, best, worst, carrefour };
}

function PriceWithDT({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={
        className ? `ojja-price-with-dt ${className}` : "ojja-price-with-dt"
      }
    >
      <span className="ojja-price-with-dt__value">{fmtNum(value)}</span>
      <span className="ojja-price-with-dt__unit">DT</span>
    </span>
  );
}

const sortShops = (s: ShopPrice[]) => [...s].sort((a, b) => a.price - b.price);

function IngredientIcon({ kind }: { kind: IngredientIconKind }) {
  const icons: Record<IngredientIconKind, ReactElement> = {
    garlic: (
      <img
        src="/images/ail.webp"
        alt="Ail"
        loading="lazy"
        decoding="async"
        style={{ width: 62, height: 62, objectFit: "contain" }}
      />
    ),
    harissa: (
      <img
        src="/images/harissa.webp"
        alt="Harissa"
        loading="lazy"
        decoding="async"
        style={{ width: 62, height: 62, objectFit: "contain" }}
      />
    ),
    eggs: (
      <img
        src="/images/egg.webp"
        alt="Oeufs"
        loading="lazy"
        decoding="async"
        style={{ width: 62, height: 62, objectFit: "contain" }}
      />
    ),
    oliveOil: (
      <img
        src="/images/huile-vegetale.webp"
        alt="Huile vegetale"
        loading="lazy"
        decoding="async"
        style={{ width: 62, height: 62, objectFit: "contain" }}
      />
    ),
    onions: (
      <img
        src="/images/onion.webp"
        alt="Oignons"
        loading="lazy"
        decoding="async"
        style={{ width: 62, height: 62, objectFit: "contain" }}
      />
    ),
    salt: (
      <img
        src="/images/sel.webp"
        alt="Sel"
        loading="lazy"
        decoding="async"
        style={{ width: 62, height: 62, objectFit: "contain" }}
      />
    ),
    tomatoPaste: (
      <img
        src="/images/sicam.webp"
        alt="Sicam"
        loading="lazy"
        decoding="async"
        style={{ width: 62, height: 62, objectFit: "contain" }}
      />
    ),
    tomatoes: (
      <img
        src="/images/tomate.webp"
        alt="Tomates"
        loading="lazy"
        decoding="async"
        style={{ width: 62, height: 62, objectFit: "contain" }}
      />
    ),
  };
  return icons[kind];
}

function OjjaDishArtwork({
  onToggle,
}: {
  stats: ReturnType<typeof computeCouffinStats>;
  onToggle?: () => void;
}) {
  return (
    <div
      className="ojja-dish-hover"
      tabIndex={0}
      aria-label="Voir le total couffin Carrefour pour un plat d'ojja"
      onClick={onToggle}
      onKeyDown={(event) => {
        if (!onToggle) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <img
        src="/images/ojja-tunisienne.webp"
        alt="Ojja tunisienne"
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.03)",
          filter: "saturate(1.06) contrast(1.02)",
        }}
      />
    </div>
  );
}

function OjjaDishCompareContent({
  stats,
}: {
  stats: ReturnType<typeof computeCouffinStats>;
}) {
  const others = shopLegend.filter((n) => n !== "Carrefour");
  const carrefourIsCheapest = Math.abs(stats.carrefour - stats.best) < 0.0005;

  return (
    <div className="ojja-dish-hover__panel">
      <span className="ojja-dish-hover__eyebrow">
        Couffin tunisien · {ingredients.length} ingrédients
      </span>
      <p className="ojja-dish-hover__title">Total Carrefour</p>
      <p className="ojja-dish-hover__subtitle">
        Somme des prix recette ingrédient par ingrédient chez Carrefour
        {carrefourIsCheapest
          ? " — panier le plus avantageux sur ce comparatif"
          : ""}
      </p>
      <div className="ojja-dish-hover__hero ojja-dish-hover__hero--carrefour">
        <span className="ojja-dish-hover__hero-label">
          <span
            className="ojja-dish-hover__dot"
            style={{ background: shopStyles.Carrefour.color }}
          />
          Carrefour
        </span>
        <PriceWithDT
          value={stats.carrefour}
          className="ojja-dish-hover__hero-price"
        />
      </div>
      <div className="ojja-dish-hover__stores ojja-dish-hover__stores--secondary">
        <span className="ojja-dish-hover__stores-caption">
          Autres enseignes (même recette)
        </span>
        {others.map((name) => {
          const st = shopStyles[name];
          const extra = stats.byShop[name] - stats.carrefour;
          return (
            <div key={name} className="ojja-dish-hover__store-row">
              <span className="ojja-dish-hover__store-name">
                <span
                  className="ojja-dish-hover__dot"
                  style={{ background: st.color }}
                />
                {name === "GeantDrive" ? "Géant Drive" : name}
              </span>
              <span className="ojja-dish-hover__store-pill">
                <PriceWithDT value={stats.byShop[name]} />
                {extra > 0.0005 ? (
                  <span className="ojja-dish-hover__delta">
                    +{fmtNum(extra)} DT
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
      <p className="ojja-dish-hover__hint">
        Écart max. comparatif&nbsp;:{" "}
        <PriceWithDT value={stats.worst - stats.best} /> (meilleur panier vs le
        plus cher)
      </p>
    </div>
  );
}

function PriceBar({ shops }: { shops: ShopPrice[] }) {
  const sorted = sortShops(shops);
  const max = Math.max(...sorted.map((s) => s.price));
  const min = sorted[0].price;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {sorted.map((shop, i) => {
        const pct = (shop.price / max) * 100;
        const style = shopStyles[shop.name];
        const isBest = i === 0;
        const saving = shop.price - min;
        return (
          <div
            key={shop.name}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              padding: "8px 10px",
              borderRadius: "10px",
              background: isBest ? `${style.bg}` : "rgba(255,255,255,0.03)",
              border: `1px solid ${isBest ? style.color + "44" : "rgba(255,255,255,0.05)"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: style.color,
                    flexShrink: 0,
                    boxShadow: isBest ? `0 0 6px ${style.color}` : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: isBest ? 700 : 500,
                    color: isBest ? "#fff" : "rgba(255,255,255,0.55)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {shop.name === "GeantDrive" ? "Géant Drive" : shop.name}
                </span>
                {isBest && (
                  <span
                    style={{
                      fontSize: "8px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: style.color,
                      opacity: 0.9,
                    }}
                  >
                    ✓ Meilleur
                  </span>
                )}
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: isBest ? style.color : "rgba(255,255,255,0.6)",
                  fontFeatureSettings: '"tnum"',
                  letterSpacing: "-0.02em",
                }}
              >
                <PriceWithDT value={shop.price} />
              </span>
            </div>
            <div
              style={{
                height: "3px",
                borderRadius: "99px",
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "99px",
                  width: `${pct}%`,
                  background: isBest
                    ? `linear-gradient(90deg, ${style.color}, ${style.color}cc)`
                    : style.color,
                  opacity: isBest ? 1 : 0.35,
                  transition: "width 0.55s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
            </div>
            {!isBest && saving > 0 && (
              <span
                style={{
                  fontSize: "9px",
                  color: "rgba(255,255,255,0.28)",
                  letterSpacing: "0.02em",
                }}
              >
                +{saving.toFixed(3)} DT vs meilleur prix
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IngredientCard({
  ingredient,
  onToggle,
}: {
  ingredient: Ingredient;
  onToggle?: () => void;
}) {
  const sorted = sortShops(ingredient.shops);
  const best = sorted[0];
  return (
    <article
      className="ojja-card"
      data-side={ingredient.tooltipSide}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (!onToggle) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      style={
        {
          animationDelay: ingredient.delay,
          "--accent": ingredient.accent,
        } as React.CSSProperties
      }
    >
      <div className="ojja-card__shine" />
      <div
        className="ojja-card__icon"
        style={{ "--accent": ingredient.accent } as React.CSSProperties}
      >
        <IngredientIcon kind={ingredient.icon} />
      </div>
      <div className="ojja-card__brand">{ingredient.brand}</div>
      <div className="ojja-card__name">{ingredient.name}</div>
      <div className="ojja-card__meta">
        <span>{ingredient.size}</span>
        <span className="ojja-card__badge">{ingredient.badge}</span>
      </div>
      <div className="ojja-card__best">
        <span
          className="ojja-dot"
          style={{ background: shopStyles[best.name].color }}
        />
        <PriceWithDT value={best.price} />
        <span className="ojja-card__best-label">meilleur prix</span>
      </div>

      <div className="ojja-tooltip">
        <div className="ojja-tooltip__header">
          <span className="ojja-tooltip__title">Comparaison</span>
          <span className="ojja-tooltip__badge">{ingredient.name}</span>
        </div>
        <div className="ojja-tooltip__body">
          <PriceBar shops={ingredient.shops} />
        </div>
        <div className="ojja-tooltip__saving">
          Économie max{" "}
          <PriceWithDT
            value={sorted[sorted.length - 1].price - sorted[0].price}
          />{" "}
          en choisissant le moins cher
        </div>
      </div>
    </article>
  );
}

function IngredientCompareContent({ ingredient }: { ingredient: Ingredient }) {
  const sorted = sortShops(ingredient.shops);
  return (
    <div
      className="ojja-tooltip"
      style={{
        position: "static",
        opacity: 1,
        pointerEvents: "auto",
        width: "100%",
        transform: "none",
        display: "block",
      }}
    >
      <div className="ojja-tooltip__header">
        <span className="ojja-tooltip__title">Comparaison</span>
        <span className="ojja-tooltip__badge">{ingredient.name}</span>
      </div>
      <div className="ojja-tooltip__body">
        <PriceBar shops={ingredient.shops} />
      </div>
      <div className="ojja-tooltip__saving">
        Économie max{" "}
        <PriceWithDT
          value={sorted[sorted.length - 1].price - sorted[0].price}
        />{" "}
        en choisissant le moins cher
      </div>
    </div>
  );
}

export default function OjjaSection() {
  const couffinStats = useMemo(() => computeCouffinStats(ingredients), []);
  const [openIngredient, setOpenIngredient] = useState<string | null>(null);
  const [openDish, setOpenDish] = useState(false);
  const activeIngredient = openIngredient
    ? ingredients.find((item) => item.name === openIngredient) || null
    : null;
  const totalSaving = ingredients.reduce((acc, ing) => {
    const s = sortShops(ing.shops);
    return acc + (s[s.length - 1].price - s[0].price);
  }, 0);

  return (
    <section className="ojja-section">
      <style>{`
        /* ── Background ── */
        .ojja-section {
          position: relative;
          overflow: hidden;
          margin-top: 96px;
          padding: 108px 0 36px;
          background: linear-gradient(180deg, #000000 0%, #030303 50%, #000000 100%);
          isolation: isolate;
        }

        /* Animated orbs */
        .ojja-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          will-change: transform, opacity;
        }
        .ojja-orb--green {
          width: 560px; height: 560px;
          top: -80px; left: -140px;
          background: radial-gradient(circle, rgba(59,222,185,0.22) 0%, transparent 70%);
          animation: ojja-orb-drift 14s ease-in-out infinite;
        }
        .ojja-orb--orange {
          width: 480px; height: 480px;
          bottom: -60px; right: -100px;
          background: radial-gradient(circle, rgba(255,117,74,0.2) 0%, transparent 70%);
          animation: ojja-orb-drift 18s ease-in-out infinite reverse;
        }
        .ojja-orb--blue {
          width: 340px; height: 340px;
          top: 40%; left: 60%;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          animation: ojja-orb-drift 22s ease-in-out infinite 4s;
        }
        @keyframes ojja-orb-drift {
          0%,100% { transform: translate(0,0) scale(1); opacity: 0.8; }
          33%      { transform: translate(40px,-30px) scale(1.08); opacity: 1; }
          66%      { transform: translate(-24px,20px) scale(0.95); opacity: 0.7; }
        }

        /* Grid dots background */
        .ojja-grid {
          position: absolute; inset: 0; z-index: 0;
          background-color: #000;
          background-image: radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%);
        }
        [data-theme="light"] .ojja-grid {
          background-color: #f3f5f2 !important;
          background-image:
            radial-gradient(circle, rgba(91,33,182,0.12) 1px, transparent 1px),
            linear-gradient(180deg, rgba(124,58,237,0.06), rgba(255,255,255,0));
          background-size: 36px 36px, 100% 100%;
          mask-image: radial-gradient(ellipse 72% 62% at 50% 50%, black 34%, transparent 100%);
          opacity: 0.95;
        }

        /* ── Heading ── */
        .ojja-section__intro {
          position: relative; z-index: 2;
          max-width: 860px; margin: 0 auto 64px;
          text-align: center;
        }
        .ojja-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 9px 20px; margin-bottom: 22px; border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 0 4px rgba(59,222,185,0.06), inset 0 1px 0 rgba(255,255,255,0.06);
          color: #c8f7e8; font-size: 11px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          animation: ojja-fade-up 0.7s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .ojja-eyebrow-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, #3BDEB9, #CCFF9B);
          box-shadow: 0 0 0 0 rgba(59,222,185,0.6);
          animation: ojja-pulse 2s ease-in-out infinite;
        }
        @keyframes ojja-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,222,185,0.6); }
          50%      { box-shadow: 0 0 0 8px rgba(59,222,185,0); }
        }
        .ojja-legend {
          display: flex; justify-content: center; gap: 20px;
          flex-wrap: wrap; margin-bottom: 24px;
          animation: ojja-fade-up 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s both;
        }
        .ojja-legend-item {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 999px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600;
          transition: border-color 0.2s, background 0.2s;
        }
        .ojja-legend-item:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
        .ojja-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* ── Stage ── */
        .ojja-stage {
          position: relative; z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
        }
        /* Rings background layer — centered on stage */
        .ojja-rings-bg {
          position: absolute; inset: 0;
          pointer-events: none; overflow: hidden; z-index: 0;
        }
        .ojja-canvas {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          align-items: center;
          justify-items: center;
          padding: 48px 0;
          position: relative; z-index: 1;
        }

        /* Rings */
        .ojja-ring {
          position: absolute; left: 50%; top: 50%;
          border-radius: 50%; will-change: transform;
          pointer-events: none;
        }
        .ojja-ring--outer {
          width: min(60vw, 560px); aspect-ratio: 1;
          border: 1px dashed rgba(255,255,255,0.07);
          transform: translate(-50%,-50%);
          animation: ojja-spin 80s linear infinite;
          transform-origin: center;
        }
        .ojja-ring--outer::before {
          content: "";
          position: absolute; inset: -1px; border-radius: 50%;
          background: conic-gradient(from 0deg, transparent 0deg, rgba(59,222,185,0.3) 60deg, transparent 120deg);
          animation: ojja-spin 8s linear infinite;
        }
        .ojja-ring--mid {
          width: min(44vw, 400px); aspect-ratio: 1;
          border: 1px solid rgba(59,222,185,0.1);
          transform: translate(-50%,-50%);
          animation: ojja-spin-rev 60s linear infinite;
        }
        .ojja-ring--inner {
          width: min(30vw, 280px); aspect-ratio: 1;
          border: 1px dotted rgba(255,127,76,0.12);
          transform: translate(-50%,-50%);
          animation: ojja-spin 40s linear infinite;
        }

        /* Orbit dots */
        .ojja-orbit-dot {
          position: absolute; left: 50%; top: 50%;
          width: 6px; height: 6px; border-radius: 50%; margin: -3px;
          background: linear-gradient(135deg, #3BDEB9, #CCFF9B);
          box-shadow: 0 0 10px rgba(59,222,185,0.8);
          animation: ojja-orbit 12s linear infinite;
          will-change: transform;
        }
        .ojja-orbit-dot:nth-child(2) { animation-duration: 18s; animation-delay: -6s; background: linear-gradient(135deg, #FF7D54, #FFBE72); box-shadow: 0 0 10px rgba(255,125,84,0.8); }
        .ojja-orbit-dot:nth-child(3) { animation-duration: 24s; animation-delay: -12s; background: linear-gradient(135deg, #C7A7FF, #F3C864); box-shadow: 0 0 10px rgba(199,167,255,0.8); }

        @keyframes ojja-spin     { from { transform: translate(-50%,-50%) rotate(0deg);   } to { transform: translate(-50%,-50%) rotate(360deg);  } }
        @keyframes ojja-spin-rev { from { transform: translate(-50%,-50%) rotate(0deg);   } to { transform: translate(-50%,-50%) rotate(-360deg); } }
        @keyframes ojja-orbit    { from { transform: rotate(0deg) translateX(min(28vw,280px)) rotate(0deg); } to { transform: rotate(360deg) translateX(min(28vw,280px)) rotate(-360deg); } }

        /* Plate */
        .ojja-plate-wrap {
          position: relative;
          width: min(30vw, 360px); aspect-ratio: 1;
          animation: ojja-float-plate 7s ease-in-out infinite;
          will-change: transform;
          z-index: 2;
        }
        .ojja-plate-glow {
          position: absolute; inset: -50px; border-radius: 50%;
          background: radial-gradient(circle, rgba(238,106,52,0.45), rgba(59,222,185,0.15) 50%, transparent 72%);
          filter: blur(32px); animation: ojja-glow-breathe 5s ease-in-out infinite; z-index: -1;
        }
        .ojja-plate-shell {
          width: 100%; height: 100%; border-radius: 50%; padding: 12px;
          background: linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04));
          box-shadow: 0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.14);
          backdrop-filter: blur(12px);
        }
        .ojja-plate-surface {
          width: 100%; height: 100%; border-radius: 50%; padding: 12px;
          background: linear-gradient(145deg, #5A3C28 0%, #1C1009 55%, #6E4F36 100%);
          box-shadow: inset 0 4px 8px rgba(255,255,255,0.06), inset 0 -4px 12px rgba(0,0,0,0.4);
        }
        .ojja-plate-core {
          width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
          background: radial-gradient(circle at 38% 30%, rgba(255,255,255,0.4) 0%, transparent 30%), linear-gradient(160deg, #FFF8EE, #F0E4D0);
          box-shadow: inset 0 14px 28px rgba(255,255,255,0.45), inset 0 -8px 16px rgba(0,0,0,0.12);
        }

        .ojja-dish-hover {
          position: relative;
          width: 100%; height: 100%;
          border-radius: 50%;
          outline: none;
          cursor: pointer;
        }
        .ojja-dish-hover:focus-visible {
          box-shadow: 0 0 0 3px rgba(59,222,185,0.55), 0 0 24px rgba(59,222,185,0.25);
        }
        .ojja-dish-hover__overlay {
          position: absolute; inset: 0;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          padding: 12px 10px;
          background: linear-gradient(165deg, rgba(8,14,18,0.94) 0%, rgba(10,26,30,0.9) 50%, rgba(8,16,20,0.93) 100%);
          border: 1px solid rgba(59,222,185,0.38);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          opacity: 0;
          transform: scale(0.96);
          transition: opacity 0.32s ease, transform 0.32s cubic-bezier(0.34, 1.15, 0.64, 1);
          pointer-events: none;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .ojja-dish-hover:hover .ojja-dish-hover__overlay,
        .ojja-dish-hover:focus-within .ojja-dish-hover__overlay {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }
        .ojja-dish-hover__panel {
          text-align: center;
          max-width: 100%;
          display: flex; flex-direction: column; align-items: center;
          gap: 4px;
        }
        .ojja-dish-hover__eyebrow {
          font-size: 7px; font-weight: 800;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(200,247,232,0.88);
        }
        .ojja-dish-hover__title {
          margin: 0;
          font-size: 12px; font-weight: 800; color: #fff;
          letter-spacing: -0.02em; line-height: 1.15;
        }
        .ojja-dish-hover__subtitle {
          margin: 0;
          font-size: 8px; font-weight: 600;
          color: rgba(255,255,255,0.48);
          line-height: 1.3;
          max-width: 200px;
        }
        .ojja-dish-hover__hero {
          margin: 2px 0 0;
          padding: 8px 14px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(59,222,185,0.2), rgba(255,117,74,0.12));
          border: 1px solid rgba(59,222,185,0.35);
        }
        .ojja-dish-hover__hero--carrefour {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 10px 14px;
          background: linear-gradient(145deg, rgba(59,130,246,0.22), rgba(59,222,185,0.1));
          border: 1px solid rgba(96,165,250,0.45);
          box-shadow: 0 0 28px rgba(59,130,246,0.12);
        }
        .ojja-dish-hover__hero-label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: rgba(191,219,254,0.95);
        }
        .ojja-dish-hover__hero--carrefour .ojja-dish-hover__hero-price .ojja-price-with-dt__value {
          font-size: 22px; font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(95deg, #BFDBFE, #60A5FA);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .ojja-dish-hover__hero--carrefour .ojja-dish-hover__hero-price .ojja-price-with-dt__unit {
          font-size: 10px; font-weight: 700;
          color: rgba(191,219,254,0.85);
          opacity: 1;
        }
        .ojja-dish-hover__stores {
          width: 100%;
          display: flex; flex-direction: column; gap: 3px;
          margin-top: 3px;
        }
        .ojja-dish-hover__stores--secondary {
          margin-top: 5px;
          padding-top: 4px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .ojja-dish-hover__stores-caption {
          font-size: 6px; font-weight: 800;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          margin-bottom: 1px;
        }
        .ojja-dish-hover__store-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 6px;
          padding: 3px 7px;
          border-radius: 9px;
          background: rgba(255,255,255,0.05);
        }
        .ojja-dish-hover__store-name {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 9px; font-weight: 700;
          color: rgba(255,255,255,0.82);
        }
        .ojja-dish-hover__dot {
          width: 5px; height: 5px;
          border-radius: 50%; flex-shrink: 0;
        }
        .ojja-dish-hover__store-pill {
          display: inline-flex; align-items: baseline; flex-wrap: wrap;
          justify-content: flex-end; gap: 5px;
          font-size: 10px; font-weight: 800;
          color: #C8F7E8;
        }
        .ojja-dish-hover__delta {
          font-size: 8px; font-weight: 700;
          color: rgba(255,255,255,0.42);
          letter-spacing: 0.02em;
        }
        .ojja-dish-hover__store-pill--best { color: #A8FFD3; }
        .ojja-dish-hover__hint {
          margin: 4px 0 0;
          font-size: 7px; font-weight: 600;
          color: rgba(255,255,255,0.4);
          line-height: 1.35;
        }
        .ojja-dish-modal {
          position: fixed;
          inset: 0;
          z-index: 120;
          display: grid;
          place-items: center;
          background: rgba(0,0,0,0.66);
          backdrop-filter: blur(4px);
          padding: 16px;
        }
        .ojja-dish-modal__card {
          width: min(92vw, 360px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.14);
          background: linear-gradient(165deg, rgba(8,14,18,0.98) 0%, rgba(10,26,30,0.96) 50%, rgba(8,16,20,0.98) 100%);
          box-shadow: 0 30px 70px rgba(0,0,0,0.55);
          padding: 12px;
          position: relative;
        }
        .ojja-dish-modal__close {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 30px;
          height: 30px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
        }
        [data-theme="light"] .ojja-dish-modal {
          background: rgba(15,23,42,0.32) !important;
          backdrop-filter: blur(6px);
        }
        [data-theme="light"] .ojja-dish-modal__card {
          border: 1px solid rgba(15,23,42,0.14) !important;
          background: linear-gradient(165deg, #ffffff 0%, #f8fafc 52%, #f3f4f6 100%) !important;
          box-shadow: 0 24px 54px rgba(15,23,42,0.2) !important;
        }
        [data-theme="light"] .ojja-dish-modal__close {
          border-color: rgba(15,23,42,0.18) !important;
          background: rgba(15,23,42,0.04) !important;
          color: #0f172a !important;
        }
        [data-theme="light"] .ojja-dish-hover__eyebrow {
          color: rgba(91,33,182,0.82) !important;
        }
        [data-theme="light"] .ojja-dish-hover__title {
          color: #0f172a !important;
        }
        [data-theme="light"] .ojja-dish-hover__subtitle {
          color: rgba(15,23,42,0.66) !important;
        }
        [data-theme="light"] .ojja-dish-hover__hero--carrefour {
          background: linear-gradient(145deg, rgba(59,130,246,0.12), rgba(91,33,182,0.08)) !important;
          border-color: rgba(91,33,182,0.24) !important;
          box-shadow: 0 0 20px rgba(91,33,182,0.08) !important;
        }
        [data-theme="light"] .ojja-dish-hover__hero-label {
          color: rgba(30,64,175,0.9) !important;
        }
        [data-theme="light"] .ojja-dish-hover__hero--carrefour .ojja-dish-hover__hero-price .ojja-price-with-dt__value {
          background: none !important;
          color: #1d4ed8 !important;
          -webkit-text-fill-color: #1d4ed8 !important;
          text-shadow: none !important;
        }
        [data-theme="light"] .ojja-dish-hover__hero--carrefour .ojja-dish-hover__hero-price .ojja-price-with-dt__unit {
          color: rgba(37,99,235,0.82) !important;
        }
        [data-theme="light"] .ojja-dish-hover__stores--secondary {
          border-top-color: rgba(15,23,42,0.09) !important;
        }
        [data-theme="light"] .ojja-dish-hover__stores-caption {
          color: rgba(15,23,42,0.52) !important;
        }
        [data-theme="light"] .ojja-dish-hover__store-row {
          background: rgba(15,23,42,0.04) !important;
        }
        [data-theme="light"] .ojja-dish-hover__store-name {
          color: rgba(15,23,42,0.86) !important;
        }
        [data-theme="light"] .ojja-dish-hover__store-pill {
          color: #0f172a !important;
        }
        [data-theme="light"] .ojja-dish-hover__delta {
          color: rgba(15,23,42,0.58) !important;
        }
        [data-theme="light"] .ojja-dish-hover__hint {
          color: rgba(15,23,42,0.62) !important;
        }

        @keyframes ojja-float-plate { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes ojja-glow-breathe { 0%,100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }

        /* ── Cards ── */
        .ojja-card {
          position: relative;
          width: 100%; max-width: 200px;
          padding: 14px 12px 12px;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          border-radius: 20px;
          background: linear-gradient(160deg, rgba(16,26,32,0.95) 0%, rgba(8,14,18,0.92) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(28px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.06) inset,
            0 16px 40px rgba(0,0,0,0.45);
          animation: ojja-card-enter 0.7s cubic-bezier(0.34,1.56,0.64,1) both, ojja-card-float 7s ease-in-out infinite;
          outline: none; z-index: 2;
          transition: box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease;
          overflow: visible;
        }
        /* accent top-edge line */
        .ojja-card::before {
          content: "";
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 1px;
          border-radius: 1px;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 70%, transparent), transparent);
          opacity: 0.7;
          transition: opacity 0.3s;
        }
        .ojja-card:hover::before,
        .ojja-card:focus-visible::before { opacity: 1; left: 10%; right: 10%; }
        .ojja-card__shine {
          position: absolute; inset: 0; border-radius: inherit; pointer-events: none; overflow: hidden;
        }
        .ojja-card__shine::before {
          content: "";
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%);
          animation: ojja-shimmer 5s ease-in-out infinite;
        }
        .ojja-card:hover, .ojja-card:focus-visible {
          animation-play-state: paused, paused;
          transform: translateY(-8px) scale(1.03) !important;
          z-index: 30;
          border-color: color-mix(in srgb, var(--accent) 50%, transparent);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.08) inset,
            0 24px 56px rgba(0,0,0,0.55),
            0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent),
            0 0 28px color-mix(in srgb, var(--accent) 12%, transparent);
        }
        .ojja-card__icon {
          width: 72px; height: 72px;
          display: grid; place-items: center;
          border-radius: 18px;
          background: linear-gradient(145deg,
            color-mix(in srgb, var(--accent) 18%, rgba(12,20,24,0.9)),
            rgba(8,14,18,0.95));
          border: 1px solid color-mix(in srgb, var(--accent) 28%, rgba(255,255,255,0.05));
          box-shadow:
            0 8px 20px rgba(0,0,0,0.35),
            0 0 16px color-mix(in srgb, var(--accent) 10%, transparent);
          position: relative; z-index: 1;
          transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease;
        }
        .ojja-card:hover .ojja-card__icon {
          transform: scale(1.08) rotate(-4deg);
          box-shadow:
            0 12px 28px rgba(0,0,0,0.42),
            0 0 24px color-mix(in srgb, var(--accent) 22%, transparent);
        }
        .ojja-card__brand {
          display: none;
        }
        .ojja-card__name {
          color: #fff; font-size: 12px; font-weight: 700;
          line-height: 1.25; text-align: center; letter-spacing: -0.01em;
        }
        .ojja-card__meta {
          display: flex; align-items: center; gap: 5px; flex-wrap: wrap; justify-content: center;
        }
        .ojja-card__badge {
          padding: 2px 8px; border-radius: 999px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 24%, transparent);
          color: color-mix(in srgb, var(--accent) 88%, #fff);
          font-size: 8px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .ojja-card__best {
          display: inline-flex; align-items: baseline; gap: 4px;
          padding: 6px 10px; border-radius: 10px;
          background: color-mix(in srgb, var(--accent) 10%, rgba(0,0,0,0.3));
          border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
          color: color-mix(in srgb, var(--accent) 90%, #fff);
          font-size: 13px; font-weight: 800; line-height: 1;
          transition: background 0.2s, box-shadow 0.2s;
          width: 100%;
          justify-content: center;
        }
        .ojja-card:hover .ojja-card__best {
          background: color-mix(in srgb, var(--accent) 18%, rgba(0,0,0,0.25));
          box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 18%, transparent);
        }
        .ojja-card__best-label {
          font-size: 8px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em;
          color: color-mix(in srgb, var(--accent) 55%, rgba(255,255,255,0.3));
        }
        .ojja-price-with-dt {
          display: inline-flex; align-items: baseline; gap: 0.22em;
          white-space: nowrap;
        }
        .ojja-price-with-dt__unit {
          font-size: 0.72em; font-weight: 800; opacity: 0.85; letter-spacing: 0.04em;
        }

        /* Tooltip */
        .ojja-tooltip {
          position: absolute; z-index: 40;
          width: 240px; padding: 0;
          border-radius: 18px;
          background: linear-gradient(160deg, rgba(10,18,22,0.98) 0%, rgba(6,12,16,0.97) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.04) inset,
            0 28px 56px rgba(0,0,0,0.6),
            0 8px 16px rgba(0,0,0,0.3);
          backdrop-filter: blur(28px);
          overflow: hidden;
          opacity: 0; pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .ojja-card[data-side="bottom"] .ojja-tooltip { top: calc(100% + 14px); left: 50%; transform: translate(-50%, 8px); }
        .ojja-card[data-side="top"]    .ojja-tooltip { bottom: calc(100% + 14px); left: 50%; transform: translate(-50%, -8px); }
        .ojja-card[data-side="left"]   .ojja-tooltip { right: calc(100% + 14px); top: 50%; transform: translate(-8px, -50%); }
        .ojja-card[data-side="right"]  .ojja-tooltip { left: calc(100% + 14px); top: 50%; transform: translate(8px, -50%); }
        .ojja-card:hover .ojja-tooltip, .ojja-card:focus-visible .ojja-tooltip { opacity: 1; pointer-events: auto; }
        .ojja-card[data-side="bottom"]:hover .ojja-tooltip,
        .ojja-card[data-side="bottom"]:focus-visible .ojja-tooltip { transform: translate(-50%, 0); }
        .ojja-card[data-side="top"]:hover .ojja-tooltip,
        .ojja-card[data-side="top"]:focus-visible .ojja-tooltip    { transform: translate(-50%, 0); }
        .ojja-card[data-side="left"]:hover .ojja-tooltip,
        .ojja-card[data-side="left"]:focus-visible .ojja-tooltip   { transform: translate(0, -50%); }
        .ojja-card[data-side="right"]:hover .ojja-tooltip,
        .ojja-card[data-side="right"]:focus-visible .ojja-tooltip  { transform: translate(0, -50%); }

        /* Tooltip inner layout */
        .ojja-tooltip__header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 0;
        }
        .ojja-tooltip__title {
          font-size: 9px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.2em; color: rgba(255,255,255,0.35);
        }
        .ojja-tooltip__badge {
          font-size: 9px; font-weight: 700;
          padding: 3px 9px; border-radius: 999px;
          background: rgba(59,222,185,0.12);
          color: #7eecd6;
          border: 1px solid rgba(59,222,185,0.22);
          max-width: 120px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ojja-tooltip__body { padding: 12px 14px; }
        .ojja-tooltip__saving {
          margin: 0 14px 12px;
          padding: 9px 12px; border-radius: 10px;
          background: rgba(59,222,185,0.06);
          border: 1px solid rgba(59,222,185,0.14);
          color: rgba(168,255,211,0.75);
          font-size: 10px; font-weight: 600; line-height: 1.5; text-align: center;
        }

        /* Keyframes */
        @keyframes ojja-card-enter {
          from { opacity: 0; transform: scale(0.72) translateY(14px); filter: blur(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0);       filter: blur(0); }
        }
        @keyframes ojja-card-float {
          0%,100% { transform: translateY(0);   }
          50%      { transform: translateY(-8px); }
        }
        @keyframes ojja-shimmer {
          0%   { left: -100%; opacity: 0; }
          20%  { opacity: 1; }
          100% { left: 160%;  opacity: 0; }
        }
        @keyframes ojja-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        [data-theme="light"] .ojja-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92)) !important;
          border: 1.5px solid rgba(15,23,42,0.22) !important;
          box-shadow:
            0 0 0 1px rgba(15,23,42,0.08),
            0 14px 34px rgba(15,23,42,0.1),
            inset 0 1px 0 rgba(255,255,255,0.7) !important;
        }
        [data-theme="light"] .ojja-card:hover,
        [data-theme="light"] .ojja-card:focus-visible {
          border-color: color-mix(in srgb, var(--accent) 52%, rgba(15,23,42,0.2)) !important;
          box-shadow: 0 22px 48px rgba(15,23,42,0.16), 0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent) !important;
        }
        [data-theme="light"] .ojja-card__icon {
          background: radial-gradient(circle at 30% 28%, color-mix(in srgb, var(--accent) 30%, #ffffff), #f8fafc) !important;
          border: 1px solid color-mix(in srgb, var(--accent) 35%, rgba(15,23,42,0.15)) !important;
          box-shadow: 0 10px 22px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.65) inset !important;
        }
        [data-theme="light"] .ojja-card__brand {
          color: color-mix(in srgb, var(--accent) 78%, #1f2937) !important;
        }
        [data-theme="light"] .ojja-card__name {
          color: #0f172a !important;
        }
        [data-theme="light"] .ojja-card__meta {
          color: rgba(15,23,42,0.65) !important;
        }
        [data-theme="light"] .ojja-card__badge {
          background: color-mix(in srgb, var(--accent) 14%, rgba(255,255,255,0.8)) !important;
          border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important;
          color: color-mix(in srgb, var(--accent) 80%, #0f172a) !important;
        }
        [data-theme="light"] .ojja-card__best {
          background: color-mix(in srgb, var(--accent) 12%, rgba(255,255,255,0.7)) !important;
          border-color: color-mix(in srgb, var(--accent) 32%, transparent) !important;
          color: color-mix(in srgb, var(--accent) 75%, #0f172a) !important;
        }
        [data-theme="light"] .ojja-card__best-label {
          color: color-mix(in srgb, var(--accent) 50%, rgba(15,23,42,0.5)) !important;
        }
        [data-theme="light"] .ojja-eyebrow {
          background: linear-gradient(120deg, rgba(91,33,182,0.14), rgba(124,58,237,0.1)) !important;
          border: 1px solid rgba(91,33,182,0.36) !important;
          box-shadow: 0 0 0 4px rgba(91,33,182,0.08), 0 10px 24px rgba(15,23,42,0.12) !important;
          color: #4c1d95 !important;
        }
        [data-theme="light"] .ojja-eyebrow-pulse {
          background: linear-gradient(135deg, #5B21B6, #7C3AED) !important;
          box-shadow: 0 0 0 0 rgba(91,33,182,0.55) !important;
        }
        [data-theme="light"] .ojja-tooltip {
          background: linear-gradient(160deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96)) !important;
          border: 1px solid rgba(15,23,42,0.14) !important;
          box-shadow: 0 24px 50px rgba(15,23,42,0.16), 0 0 0 1px rgba(255,255,255,0.65) inset !important;
        }
        [data-theme="light"] .ojja-tooltip__title {
          color: rgba(15,23,42,0.58) !important;
        }
        [data-theme="light"] .ojja-tooltip__badge {
          background: rgba(91,33,182,0.08) !important;
          border-color: rgba(91,33,182,0.22) !important;
          color: #5b21b6 !important;
        }
        [data-theme="light"] .ojja-pricebar__head span {
          color: rgba(15,23,42,0.86) !important;
        }
        [data-theme="light"] .ojja-pricebar__track {
          background: rgba(15,23,42,0.08) !important;
        }
        [data-theme="light"] .ojja-tooltip__saving {
          background: rgba(91,33,182,0.06) !important;
          border-color: rgba(91,33,182,0.18) !important;
          color: rgba(15,23,42,0.78) !important;
        }

        /* Footer */
        .ojja-footer {
          position: relative; z-index: 2; margin-top: 10px;
          display: grid; grid-template-columns: 1fr auto;
          align-items: center; gap: 24px;
          padding: 22px 28px; border-radius: 28px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 20px 48px rgba(0,0,0,0.25);
          backdrop-filter: blur(12px);
          animation: ojja-fade-up 0.7s ease 0.5s both;
        }
        .ojja-footer__stats { display: flex; gap: 32px; flex-wrap: wrap; }
        .ojja-footer__stat { display: flex; flex-direction: column; gap: 2px; }
        .ojja-footer__stat-value { font-size: 22px; font-weight: 900; color: #fff; }
        .ojja-footer__stat-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.12em; }
        .ojja-footer__cta {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 14px 24px; border-radius: 999px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.28);
          color: #fff; font-size: 14px; font-weight: 800; line-height: 1;
          white-space: nowrap; text-decoration: none;
          box-shadow: 0 12px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        .ojja-footer__cta:hover {
          transform: translateY(-2px) scale(1.03);
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.46);
          box-shadow: 0 18px 36px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .ojja-footer__cta svg { transition: transform 0.25s ease; }
        .ojja-footer__cta:hover svg { transform: translateX(4px); }

        /* Tablet */
        @media (max-width: 900px) {
          .ojja-canvas { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .ojja-rings-bg { display: none; }
        }
        /* Mobile */
        @media (max-width: 600px) {
          .ojja-section { padding: 64px 0 24px; }
          .ojja-stage {
            max-width: 370px;
            margin: 0 auto;
            z-index: 4;
            overflow: visible;
          }
          .ojja-rings-bg { display: block; }
          .ojja-ring--outer { width: min(84vw, 340px); }
          .ojja-ring--mid { width: min(62vw, 240px); }
          .ojja-ring--inner { width: min(44vw, 170px); }
          .ojja-orbit-dot { animation-duration: 16s; }
          .ojja-canvas {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            padding: 10px 0 56px;
            align-items: center;
            justify-items: center;
          }
          .ojja-dish-hover__overlay { display: none !important; }
          .ojja-card {
            width: 100%;
            max-width: 110px;
            min-height: 110px;
            padding: 8px 6px;
            gap: 5px;
            border-radius: 18px;
            transform: none !important;
            animation: none !important;
          }
          .ojja-card:hover { transform: translateY(-2px) !important; }
          .ojja-card__icon {
            width: 54px;
            height: 54px;
            border-radius: 14px;
          }
          .ojja-card__icon img {
            width: 38px !important;
            height: 38px !important;
          }
          .ojja-card__brand,
          .ojja-tooltip { display: none; }
          .ojja-card__name {
            font-size: 10px;
            line-height: 1.2;
            font-weight: 700;
          }
          .ojja-card__meta {
            display: inline-flex;
            justify-content: center;
            gap: 4px;
            flex-wrap: nowrap;
            font-size: 8px;
            color: rgba(255,255,255,0.62);
            margin-top: -1px;
          }
          .ojja-card__badge {
            display: none;
          }
          .ojja-card__best {
            display: inline-flex;
            padding: 4px 8px;
            gap: 4px;
            border-radius: 8px;
            font-size: 9px;
            line-height: 1;
            width: 100%;
            justify-content: center;
          }
          .ojja-card__best-label {
            display: none;
          }
          .ojja-card__best .ojja-dot {
            display: none;
          }
          .ojja-card__best .ojja-price-with-dt__value {
            font-size: 9px;
            font-weight: 800;
          }
          .ojja-card__best .ojja-price-with-dt__unit {
            font-size: 7px;
            opacity: 0.8;
          }
          .ojja-card.mobile-open {
            max-width: 110px;
            min-height: 110px;
            z-index: 60;
          }
          .ojja-card.mobile-open .ojja-tooltip {
            display: block;
            position: absolute;
            width: 132px;
            left: 50%;
            top: calc(100% + 4px);
            transform: translateX(-50%) !important;
            margin-top: 0;
            opacity: 1;
            pointer-events: auto;
            padding: 6px;
            border-radius: 9px;
          }
          .ojja-card.mobile-open .ojja-tooltip__header { margin-bottom: 5px; }
          .ojja-card.mobile-open .ojja-tooltip__header { padding: 6px 8px 5px; }
          .ojja-card.mobile-open .ojja-tooltip__title { font-size: 7px; letter-spacing: 0.1em; }
          .ojja-card.mobile-open .ojja-tooltip__badge { font-size: 7px; padding: 1px 5px; max-width: 80px; }
          .ojja-card.mobile-open .ojja-tooltip__body { padding: 5px 6px; display: flex; flex-direction: column; gap: 3px; }
          .ojja-card.mobile-open .ojja-tooltip__body > div > div { gap: 2px !important; padding: 4px 6px !important; border-radius: 7px !important; }
          .ojja-card.mobile-open .ojja-tooltip__body > div > div > div:first-child span { font-size: 8px !important; }
          .ojja-card.mobile-open .ojja-tooltip__body > div > div > div:first-child span:last-child { font-size: 10px !important; }
          .ojja-card.mobile-open .ojja-tooltip__body > div > div > div:last-child { display: none; }
          .ojja-card.mobile-open .ojja-tooltip__saving {
            margin: 0 6px 5px;
            padding: 4px 6px;
            font-size: 7px;
            border-radius: 7px;
          }
          .ojja-plate-wrap {
            width: min(36vw, 132px);
            grid-column: 2;
            grid-row: 2;
            animation: none;
          }
          .ojja-plate-glow { animation: none; }
          .ojja-footer { grid-template-columns: 1fr; border-radius: 24px; }
          .ojja-footer {
            margin-top: -12px;
            position: relative;
            z-index: 1;
            padding: 12px 10px;
            gap: 10px;
          }
          .ojja-footer__stats {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
          }
          .ojja-footer__stat {
            gap: 1px;
            align-items: center;
            text-align: center;
          }
          .ojja-footer__stat-value {
            font-size: 13px;
            line-height: 1.05;
          }
          .ojja-footer__stat-label {
            font-size: 7px;
            letter-spacing: 0.07em;
            line-height: 1.15;
          }
          .ojja-footer__cta {
            width: 100%;
            justify-content: center;
            padding: 9px 10px;
            font-size: 10px;
            gap: 6px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ojja-plate-wrap,.ojja-card,.ojja-ring--outer,.ojja-ring--mid,.ojja-ring--inner,.ojja-orbit-dot,.ojja-orb,.ojja-card__shine::before { animation: none !important; }
          .ojja-tooltip { transition: opacity 0.15s ease !important; }
        }
      `}</style>

      {/* Background */}
      <div className="ojja-grid" />
      <div className="ojja-orb ojja-orb--green" />
      <div className="ojja-orb ojja-orb--orange" />
      <div className="ojja-orb ojja-orb--blue" />

      <div className="container-1">
        {/* Heading */}
        <div className="ojja-section__intro">
          <div className="ojja-eyebrow">
            <span className="ojja-eyebrow-pulse" />
            Panier du quotidien · Couffin Tounsi
          </div>

          <div className="ojja-legend">
            {shopLegend.map((shop) => (
              <span key={shop} className="ojja-legend-item">
                <span
                  className="ojja-dot"
                  style={{ background: shopStyles[shop].color }}
                />
                {shop}
              </span>
            ))}
          </div>

          <div className="heading fw-6 h1 wow fadeInUp" data-wow-delay="0.1s">
            Comparez une{" "}
            <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
              <span className="cd-words-wrapper">
                <span className="item-text is-visible">
                  <i className="in">o</i>
                  <i className="in">j</i>
                  <i className="in">j</i>
                  <i className="in">a</i>
                </span>
                <span className="item-text is-hidden">
                  <i className="out">o</i>
                  <i className="out">j</i>
                  <i className="out">j</i>
                  <i className="out">a</i>
                </span>
                <span className="item-text is-hidden">
                  <i className="in">o</i>
                  <i className="in">j</i>
                  <i className="in">j</i>
                  <i className="in">a</i>
                </span>
              </span>
            </span>{" "}
            ingrédient par ingrédient
          </div>

          <p className="wow fadeInUp" data-wow-delay="0.2s">
            Survolez chaque ingrédient pour voir instantanément le classement
            des prix entre Monoprix, Carrefour et Géant Drive.
          </p>
        </div>

        {/* Stage */}
        <div className="ojja-stage">
          {/* Decorative rings — background layer */}
          <div className="ojja-rings-bg" aria-hidden="true">
            <div className="ojja-ring ojja-ring--outer" />
            <div className="ojja-ring ojja-ring--mid" />
            <div className="ojja-ring ojja-ring--inner" />
            <div className="ojja-orbit-dot" />
            <div className="ojja-orbit-dot" />
            <div className="ojja-orbit-dot" />
          </div>

          {/* 3×3 grid: 4 cards · plate · 4 cards */}
          <div className="ojja-canvas">
            {ingredients.slice(0, 4).map((ing) => (
              <IngredientCard
                key={ing.name}
                ingredient={ing}
                onToggle={() => setOpenIngredient(ing.name)}
              />
            ))}

            <div className="ojja-plate-wrap">
              <div className="ojja-plate-glow" />
              <div className="ojja-plate-shell">
                <div className="ojja-plate-surface">
                  <div className="ojja-plate-core">
                    <OjjaDishArtwork
                      stats={couffinStats}
                      onToggle={() => setOpenDish((prev) => !prev)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {ingredients.slice(4).map((ing) => (
              <IngredientCard
                key={ing.name}
                ingredient={ing}
                onToggle={() => setOpenIngredient(ing.name)}
              />
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="ojja-footer">
          <div className="ojja-footer__stats">
            <div className="ojja-footer__stat">
              <span className="ojja-footer__stat-value">
                {ingredients.length}
              </span>
              <span className="ojja-footer__stat-label">
                Ingrédients comparés
              </span>
            </div>
            <div className="ojja-footer__stat">
              <span className="ojja-footer__stat-value">3</span>
              <span className="ojja-footer__stat-label">
                Boutiques analysées
              </span>
            </div>
            <div className="ojja-footer__stat">
              <span className="ojja-footer__stat-value">
                <PriceWithDT value={totalSaving} />
              </span>
              <span className="ojja-footer__stat-label">
                Économie totale possible
              </span>
            </div>
          </div>
          <a href="#demo" className="ojja-footer__cta">
            Explorer le panier
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
      {openDish && (
        <div
          className="ojja-dish-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Comparaison couffin tunisien"
          onClick={() => setOpenDish(false)}
        >
          <div
            className="ojja-dish-modal__card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="ojja-dish-modal__close"
              onClick={() => setOpenDish(false)}
              aria-label="Fermer la popup"
            >
              ×
            </button>
            <OjjaDishCompareContent stats={couffinStats} />
          </div>
        </div>
      )}
      {activeIngredient && (
        <div
          className="ojja-dish-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Comparaison ingrédient"
          onClick={() => setOpenIngredient(null)}
        >
          <div
            className="ojja-dish-modal__card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="ojja-dish-modal__close"
              onClick={() => setOpenIngredient(null)}
              aria-label="Fermer la popup"
            >
              ×
            </button>
            <IngredientCompareContent ingredient={activeIngredient} />
          </div>
        </div>
      )}
    </section>
  );
}
