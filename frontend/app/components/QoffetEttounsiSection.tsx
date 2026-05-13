"use client";

import { useEffect, useState } from "react";

/* ── Palette ─────────────────────────────────────────────────────────── */
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

function makeC(light: boolean) {
  return light
    ? {
        teal: "#5B21B6",
        orange: "#7C3AED",
        red: "#6D28D9",
        bg: "#f0f2ef",
        card: "#ffffff",
        text: "#0a0f0d",
        muted: "rgba(0,0,0,0.45)",
      }
    : {
        teal: "#3BDEB9",
        orange: "#F97316",
        red: "#EF4444",
        bg: "#000000",
        card: "rgba(12,22,18,0.95)",
        text: "#ffffff",
        muted: "rgba(255,255,255,0.45)",
      };
}

type ShopKey = "Carrefour" | "Monoprix" | "GeantDrive";
const SHOPS: { key: ShopKey; color: string; label: string }[] = [
  { key: "Monoprix", color: "#EF4444", label: "Monoprix" },
  { key: "Carrefour", color: "#3B82F6", label: "Carrefour" },
  { key: "GeantDrive", color: "#22C55E", label: "Géant Drive" },
];

type Ingredient = {
  img: string;
  brand: string;
  name: string;
  size: string;
  badge: string;
  prices: { shop: ShopKey; price: number }[];
};

const ingredients: Ingredient[] = [
  {
    img: "/images/huile-vegetale.webp",
    brand: "Nejma",
    name: "Huile Végétale",
    size: "1L",
    badge: "Huiles",
    prices: [
      { shop: "Carrefour", price: 4.69 },
      { shop: "Monoprix", price: 4.85 },
      { shop: "GeantDrive", price: 4.95 },
    ],
  },
  {
    img: "/images/egg.webp",
    brand: "El Mazraa",
    name: "Œufs Frais",
    size: "6 pcs",
    badge: "Produits Frais",
    prices: [
      { shop: "Carrefour", price: 3.59 },
      { shop: "Monoprix", price: 3.75 },
      { shop: "GeantDrive", price: 3.89 },
    ],
  },
  {
    img: "/images/sicam.webp",
    brand: "Sicam",
    name: "Concentré de Tomates",
    size: "400g",
    badge: "Conserves",
    prices: [
      { shop: "Carrefour", price: 1.85 },
      { shop: "Monoprix", price: 1.95 },
      { shop: "GeantDrive", price: 2.1 },
    ],
  },
  {
    img: "/images/harissa.webp",
    brand: "Cap Bon",
    name: "Harissa",
    size: "135g",
    badge: "Épices",
    prices: [
      { shop: "Carrefour", price: 1.35 },
      { shop: "Monoprix", price: 1.45 },
      { shop: "GeantDrive", price: 1.55 },
    ],
  },
  {
    img: "/images/sel.webp",
    brand: "Cotusal",
    name: "Sel de Table",
    size: "500g",
    badge: "Épices",
    prices: [
      { shop: "Carrefour", price: 0.75 },
      { shop: "Monoprix", price: 0.85 },
      { shop: "GeantDrive", price: 0.9 },
    ],
  },
  {
    img: "/images/onion.webp",
    brand: "Locale",
    name: "Oignons Blancs",
    size: "1kg",
    badge: "Légumes",
    prices: [
      { shop: "Carrefour", price: 1.99 },
      { shop: "Monoprix", price: 2.15 },
      { shop: "GeantDrive", price: 2.25 },
    ],
  },
  {
    img: "/images/ail.webp",
    brand: "Locale",
    name: "Ail Frais",
    size: "250g",
    badge: "Légumes",
    prices: [
      { shop: "Carrefour", price: 4.25 },
      { shop: "Monoprix", price: 4.5 },
      { shop: "GeantDrive", price: 4.75 },
    ],
  },
  {
    img: "/images/tomate.webp",
    brand: "Locale",
    name: "Tomates Fraîches",
    size: "1kg",
    badge: "Légumes",
    prices: [
      { shop: "Carrefour", price: 2.99 },
      { shop: "Monoprix", price: 3.25 },
      { shop: "GeantDrive", price: 3.45 },
    ],
  },
];

const fmt = (n: number) => n.toFixed(3) + " DT";
const bestPrice = (ing: Ingredient) =>
  Math.min(...ing.prices.map((p) => p.price));
const totalCost = ingredients.reduce((s, i) => s + bestPrice(i), 0);
const shopColor = (k: ShopKey) => SHOPS.find((s) => s.key === k)!.color;

/* ── Ingredient card ─────────────────────────────────────────────────── */
type CType = ReturnType<typeof makeC>;
function IngredientCard({
  ing,
  index,
  C,
}: {
  ing: Ingredient;
  index: number;
  C: CType;
}) {
  const sorted = [...ing.prices].sort((a, b) => a.price - b.price);
  const max = sorted[sorted.length - 1].price;

  return (
    <div className="qoffet-card" style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Top: emoji + badge */}
      <div className="qoffet-card__top">
        <div className="qoffet-card__emoji-wrap">
          <img
            src={ing.img}
            alt={ing.name}
            className="qoffet-card__img"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="72px"
          />
          <div className="qoffet-card__glow" />
        </div>
        <span className="qoffet-card__badge">{ing.badge}</span>
      </div>

      {/* Middle: name + meta */}
      <div className="qoffet-card__mid">
        <span className="qoffet-card__brand">{ing.brand}</span>
        <h3 className="qoffet-card__name">{ing.name}</h3>
        <div className="qoffet-card__meta">
          <span className="qoffet-card__size">{ing.size}</span>
          <span className="qoffet-card__best-price">
            {fmt(sorted[0].price)}
          </span>
        </div>
      </div>

      {/* Bottom: price bars */}
      <div className="qoffet-card__bars">
        {sorted.map((p, i) => {
          const pct = (p.price / max) * 100;
          const col = shopColor(p.shop);
          return (
            <div key={p.shop} className="qoffet-bar">
              <div className="qoffet-bar__label">
                <span className="qoffet-bar__dot" style={{ background: col }} />
                <span className="qoffet-bar__shop">{p.shop}</span>
                <span
                  className="qoffet-bar__price"
                  style={
                    { color: i === 0 ? C.text : C.muted } as React.CSSProperties
                  }
                >
                  {fmt(p.price)}
                </span>
              </div>
              <div className="qoffet-bar__track">
                <div
                  className="qoffet-bar__fill"
                  style={{
                    width: `${pct}%`,
                    background:
                      p.shop === "Carrefour"
                        ? col
                        : i === 0
                          ? `linear-gradient(90deg, ${col}, #4ade80)`
                          : col,
                    opacity: i === 0 ? 1 : 0.38,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const AR_TEXT = "قفة التونسي";

/* ── Section ─────────────────────────────────────────────────────────── */
export default function QoffetEttounsiSection() {
  const isLight = useIsLight();
  const C = makeC(isLight);
  const [page, setPage] = useState(0);
  const [arCount, setArCount] = useState(0);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    if (!erasing) {
      if (arCount < AR_TEXT.length) {
        id = setTimeout(() => setArCount((c) => c + 1), 120);
      } else {
        id = setTimeout(() => setErasing(true), 1800);
      }
    } else if (arCount > 0) {
      id = setTimeout(() => setArCount((c) => c - 1), 65);
    } else {
      id = setTimeout(() => setErasing(false), 350);
    }
    return () => clearTimeout(id);
  }, [arCount, erasing]);
  const PER = 4;
  const totalPages = Math.ceil(ingredients.length / PER);
  const visible = ingredients.slice(page * PER, page * PER + PER);

  return (
    <section className="qoffet-section">
      <style>{`
        @font-face {
          font-family: "RetroBrushArabic";
          src: url("/fonts/RetroBrushArabicPersonalUseOnly-Regular.otf") format("opentype");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        /* ── Section wrapper ── */
        .qoffet-section {
          width: 100%;
          background: ${C.bg};
          padding: 32px 0 80px;
          position: relative;
          overflow: hidden;
        }
        /* Ambient background blobs */
        .qoffet-section::before {
          content: "";
          position: absolute; pointer-events: none;
          width: 700px; height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%);
          top: -200px; left: -200px;
          filter: blur(60px);
        }
        .qoffet-section::after {
          content: "";
          position: absolute; pointer-events: none;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,222,185,0.03) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          filter: blur(60px);
        }

        .qoffet-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 32px;
          position: relative; z-index: 1;
        }

        /* ── Hero header ── */
        .qoffet-hero {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 40px;
          margin-bottom: 56px;
          padding: 40px 44px;
          border-radius: 32px;
          border: 1px solid rgba(249,115,22,0.18);
          background: linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(12,22,18,0.95) 55%, rgba(59,222,185,0.05) 100%);
          box-shadow: 0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
          overflow: hidden;
          position: relative;
        }
        .qoffet-hero::before {
          content: "";
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse at 80% 50%, rgba(249,115,22,0.07) 0%, transparent 60%);
        }

        .qoffet-hero__left { position: relative; z-index: 1; }

        .qoffet-hero__eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.2em;
          text-transform: uppercase; color: #fff;
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.22);
          border-radius: 999px; padding: 5px 14px;
          margin-bottom: 18px;
        }

        .qoffet-hero__title {
          font-size: clamp(2rem, 4vw, 3.4rem);
          font-weight: 900; color: #fff;
          line-height: 1.05; letter-spacing: -0.04em;
          margin: 0 0 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .qoffet-hero__title span {
          background: linear-gradient(90deg, ${C.orange} 0%, #fb923c 50%, ${C.red} 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .qoffet-couffin-img {
          width: clamp(190px, 16vw, 250px);
          height: clamp(190px, 16vw, 250px);
          object-fit: contain;
          display: inline-block;
          vertical-align: middle;
          margin-right: 14px;
          mix-blend-mode: screen;
          filter: drop-shadow(0 10px 22px rgba(249,115,22,0.4));
        }
        .qoffet-hero__title-ar--animated {
          display: inline-block;
          position: relative;
          min-width: 9.2ch;
          white-space: nowrap;
          animation: qoffet-ar-breathe 2.8s ease-in-out infinite;
        }
        .qoffet-hero__title-ar--animated::after {
          content: "";
          position: absolute;
          left: 6%;
          right: 6%;
          bottom: -6px;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, ${C.orange}, #fb923c, ${C.teal}, transparent);
          opacity: 0.7;
          animation: qoffet-ar-line 2.4s linear infinite;
        }
        @keyframes qoffet-ar-breathe {
          0%,100% { transform: translateY(0); text-shadow: 0 2px 18px rgba(255,255,255,0.15); }
          50%     { transform: translateY(-2px); text-shadow: 0 4px 24px rgba(249,115,22,0.32); }
        }
        @keyframes qoffet-ar-line {
          0% { opacity: 0.25; transform: scaleX(0.8); }
          50% { opacity: 0.95; transform: scaleX(1); }
          100% { opacity: 0.25; transform: scaleX(0.8); }
        }
        .qoffet-ar-cursor {
          display: inline-block;
          width: 2px;
          height: 0.9em;
          margin-right: 4px;
          vertical-align: middle;
          background: ${C.orange};
          border-radius: 2px;
          animation: qoffet-cursor-blink .8s step-end infinite;
        }
        @keyframes qoffet-cursor-blink {
          0%,100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .qoffet-hero__title-ar {
          font-family: "RetroBrushArabic", Tahoma, sans-serif;
          font-size: clamp(2.2rem, 4vw, 3.8rem);
          font-weight: normal;
          letter-spacing: 0.02em;
          line-height: 1.1;
          direction: rtl;
          unicode-bidi: plaintext;
          color: #ffffff;
          background: none;
          -webkit-background-clip: unset;
          -webkit-text-fill-color: #ffffff;
          background-clip: unset;
          text-shadow: 0 2px 18px rgba(255,255,255,0.15);
        }

        .qoffet-hero__desc {
          font-size: 15px; color: rgba(255,255,255,0.52);
          line-height: 1.65; max-width: 520px; margin: 0 0 28px;
        }

        .qoffet-hero__legend {
          display: flex; flex-wrap: wrap; gap: 16px;
        }
        .qoffet-hero__legend-item {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6);
        }
        .qoffet-hero__legend-dot {
          width: 10px; height: 10px; border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Stats panel (right side of hero) ── */
        .qoffet-stats {
          display: flex; flex-direction: column; gap: 16px;
          position: relative; z-index: 1; flex-shrink: 0;
        }
        .qoffet-stat {
          min-width: 180px;
          padding: 18px 22px; border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          text-align: center;
        }
        .qoffet-stat--highlight {
          background: rgba(249,115,22,0.1);
          border-color: rgba(249,115,22,0.28);
          box-shadow: 0 8px 32px rgba(249,115,22,0.12);
        }
        .qoffet-stat__value {
          font-size: 28px; font-weight: 900;
          letter-spacing: -0.03em; line-height: 1;
          margin-bottom: 4px;
        }
        .qoffet-stat__label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.14em; color: rgba(255,255,255,0.38);
        }
        .qoffet-stat--highlight .qoffet-stat__value { color: ${C.orange}; }
        .qoffet-stat .qoffet-stat__value { color: #fff; }

        /* ── Card grid ── */
        .qoffet-grid-wrap {
          display: flex; align-items: stretch; gap: 16px;
        }
        .qoffet-grid {
          flex: 1; min-width: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1100px) { .qoffet-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 767px)  { .qoffet-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  {
          .qoffet-grid {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            padding: 2px 2px 8px;
          }
          .qoffet-grid::-webkit-scrollbar { height: 5px; }
          .qoffet-grid::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.22);
            border-radius: 999px;
          }
        }

        /* ── Arrow button ── */
        .qoffet-arrow {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          align-self: center;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(59,222,185,0.18);
          background: rgba(12,22,18,0.9);
          cursor: pointer; transition: all 0.2s;
        }
        .qoffet-arrow:hover:not(:disabled) {
          background: ${C.teal}; border-color: ${C.teal};
        }
        .qoffet-arrow:hover:not(:disabled) svg { stroke: #04080A; }
        .qoffet-arrow:disabled { opacity: 0.25; cursor: not-allowed; }

        /* ── Ingredient card ── */
        @keyframes qoffet-couffin-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%       { transform: translateY(-10px) rotate(3deg); }
        }
        .qoffet-couffin {
          animation: qoffet-couffin-float 3.5s ease-in-out infinite;
          transform-origin: center bottom;
        }
        @keyframes qoffet-card-in {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .qoffet-card {
          display: flex; flex-direction: column;
          border-radius: 24px;
          border: 1px solid rgba(59,222,185,0.12);
          background: ${C.card};
          padding: 20px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          transition: border-color 0.22s, box-shadow 0.22s, transform 0.22s;
          animation: qoffet-card-in 0.45s cubic-bezier(.25,.8,.25,1) both;
          cursor: default;
        }
        .qoffet-card:hover {
          border-color: rgba(249,115,22,0.4);
          box-shadow: 0 12px 40px rgba(249,115,22,0.15);
          transform: translateY(-4px);
        }

        /* Top area */
        .qoffet-card__top {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .qoffet-card__emoji-wrap {
          position: relative;
          width: 88px; height: 88px; border-radius: 22px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(145deg, rgba(249,115,22,0.15), rgba(239,68,68,0.08));
          border: 1px solid rgba(249,115,22,0.18);
          flex-shrink: 0;
          overflow: hidden;
        }
        .qoffet-card__img { width: 72px; height: 72px; object-fit: contain; position: relative; z-index: 1; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.45)); }
        .qoffet-card__glow {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 40% 35%, rgba(249,115,22,0.25), transparent 65%);
        }
        .qoffet-card__badge {
          font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.16em;
          color: ${C.orange};
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.2);
          border-radius: 999px; padding: 3px 10px;
        }

        /* Middle */
        .qoffet-card__mid { flex: 1; margin-bottom: 16px; }
        .qoffet-card__brand {
          display: block; font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.18em;
          color: rgba(255,255,255,0.35); margin-bottom: 4px;
        }
        .qoffet-card__name {
          margin: 0 0 10px; font-size: 16px; font-weight: 800;
          color: #fff; line-height: 1.2; letter-spacing: -0.01em;
        }
        .qoffet-card__meta {
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
        }
        .qoffet-card__size { font-size: 12px; color: rgba(255,255,255,0.38); }
        .qoffet-card__best-price {
          font-size: 18px; font-weight: 900; letter-spacing: -0.02em;
          color: #fff;
        }

        /* Price bars */
        .qoffet-card__bars { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
        .qoffet-bar { display: flex; flex-direction: column; gap: 4px; }
        .qoffet-bar__label {
          display: flex; align-items: center; gap: 6px; font-size: 11px;
        }
        .qoffet-bar__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .qoffet-bar__shop { flex: 1; color: rgba(255,255,255,0.45); }
        .qoffet-bar__price { font-weight: 800; font-size: 11px; }
        .qoffet-bar__track {
          height: 4px; border-radius: 99px;
          background: rgba(255,255,255,0.06); overflow: hidden;
        }
        .qoffet-bar__fill {
          height: 100%; border-radius: 99px;
          transition: width 0.7s cubic-bezier(.34,1.56,.64,1);
        }

        /* ── Dots ── */
        .qoffet-dots { display: flex; justify-content: center; gap: 6px; margin-top: 24px; }
        .qoffet-dot {
          height: 6px; border-radius: 999px; border: none; cursor: pointer;
          transition: all 0.3s; padding: 0;
        }

        /* ── Footer banner ── */
        .qoffet-footer {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center; gap: 32px;
          padding: 28px 36px;
          border-radius: 24px;
          border: 1px solid rgba(249,115,22,0.15);
          background: linear-gradient(135deg, rgba(249,115,22,0.07) 0%, rgba(239,68,68,0.04) 100%);
        }
        .qoffet-footer__text { font-size: 14px; color: rgba(255,255,255,0.58); line-height: 1.7; }
        .qoffet-footer__text strong { color: ${C.orange}; font-weight: 800; }
        .qoffet-footer__cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 22px; border-radius: 999px; text-decoration: none;
          background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.3);
          color: ${C.orange}; font-size: 13px; font-weight: 700;
          white-space: nowrap; flex-shrink: 0;
          transition: background 0.18s, border-color 0.18s;
        }
        .qoffet-footer__cta:hover {
          background: rgba(249,115,22,0.22); border-color: rgba(249,115,22,0.55);
        }

        /* ── Responsive hero ── */
        @media (max-width: 900px) {
          .qoffet-hero { grid-template-columns: 1fr; }
          .qoffet-stats { flex-direction: row; flex-wrap: wrap; }
          .qoffet-stat { min-width: 140px; flex: 1; }
          .qoffet-footer { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .qoffet-section { padding-top: 20px; }
          .qoffet-hero { padding: 28px 22px; }
          .qoffet-inner { padding: 0 16px; }
          .qoffet-stats {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .qoffet-stat {
            min-width: 0;
            padding: 10px 8px;
            border-radius: 12px;
          }
          .qoffet-stat:last-child {
            grid-column: 1 / -1;
            padding: 9px 8px;
          }
          .qoffet-stat__value {
            font-size: 18px;
            margin-bottom: 2px;
          }
          .qoffet-stat__label {
            font-size: 8px;
            letter-spacing: 0.08em;
          }
          .qoffet-grid-wrap { gap: 8px; }
          .qoffet-card {
            width: 200px;
            min-width: 200px;
            flex: 0 0 200px;
            scroll-snap-align: start;
            border-radius: 16px;
            padding: 16px;
          }
          .qoffet-card__top { margin-bottom: 10px; }
          .qoffet-card__emoji-wrap {
            width: 72px;
            height: 72px;
            border-radius: 14px;
          }
          .qoffet-card__img { width: 56px; height: 56px; }
          .qoffet-card__badge {
            font-size: 7px;
            letter-spacing: 0.12em;
            padding: 2px 7px;
          }
          .qoffet-card__mid { margin-bottom: 10px; }
          .qoffet-card__brand { font-size: 8px; }
          .qoffet-card__name { font-size: 15px; margin-bottom: 8px; }
          .qoffet-card__size { font-size: 10px; }
          .qoffet-card__best-price { font-size: 16px; }
          .qoffet-card__bars { gap: 6px; }
          .qoffet-bar__label { font-size: 9px; }
          .qoffet-bar__price { font-size: 9px; }
          .qoffet-arrow {
            width: 34px;
            height: 34px;
          }
          .qoffet-arrow svg {
            width: 14px;
            height: 14px;
          }
          .qoffet-footer {
            margin-top: 24px;
            padding: 14px 12px;
            border-radius: 14px;
            gap: 10px;
          }
          .qoffet-footer__text {
            font-size: 11px;
            line-height: 1.45;
          }
          .qoffet-footer__cta {
            width: 100%;
            justify-content: center;
            padding: 8px 10px;
            font-size: 10px;
            gap: 6px;
          }
          .qoffet-footer__cta svg {
            width: 12px;
            height: 12px;
          }
          .qoffet-couffin-img {
            width: clamp(88px, 26vw, 140px);
            height: clamp(88px, 26vw, 140px);
            margin-right: 0;
          }
          .qoffet-hero__title {
            gap: 8px;
            align-items: center;
          }
          .qoffet-hero__title-ar {
            font-size: clamp(1.65rem, 7vw, 2.3rem);
          }
        }

        /* ── Light mode overrides ── */
        [data-theme="light"] .qoffet-section { background: #f0f2ef !important; }
        [data-theme="light"] .qoffet-section::before { background: radial-gradient(circle, rgba(91,33,182,0.04) 0%, transparent 70%) !important; }
        [data-theme="light"] .qoffet-section::after  { background: radial-gradient(circle, rgba(124,58,237,0.03) 0%, transparent 70%) !important; }
        [data-theme="light"] .qoffet-hero {
          background: linear-gradient(135deg, rgba(91,33,182,0.08) 0%, rgba(255,255,255,0.95) 55%, rgba(124,58,237,0.04) 100%) !important;
          border-color: rgba(91,33,182,0.16) !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8) !important;
        }
        [data-theme="light"] .qoffet-hero__eyebrow { color: #5B21B6 !important; background: rgba(91,33,182,0.08) !important; border-color: rgba(91,33,182,0.2) !important; }
        [data-theme="light"] .qoffet-hero__title { color: #0a0f0d !important; }
        [data-theme="light"] .qoffet-hero__desc { color: rgba(0,0,0,0.55) !important; }
        [data-theme="light"] .qoffet-hero__legend-item { color: rgba(0,0,0,0.55) !important; }
        [data-theme="light"] .qoffet-stat { background: rgba(0,0,0,0.03) !important; border-color: rgba(0,0,0,0.08) !important; }
        [data-theme="light"] .qoffet-stat--highlight { background: rgba(91,33,182,0.07) !important; border-color: rgba(91,33,182,0.2) !important; }
        [data-theme="light"] .qoffet-stat__value { color: #0a0f0d !important; }
        [data-theme="light"] .qoffet-stat--highlight .qoffet-stat__value { color: #5B21B6 !important; }
        [data-theme="light"] .qoffet-stat__label { color: rgba(0,0,0,0.42) !important; }
        [data-theme="light"] .qoffet-card {
          background: #ffffff !important;
          border-color: rgba(0,0,0,0.09) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.07) !important;
        }
        [data-theme="light"] .qoffet-card:hover {
          border-color: rgba(91,33,182,0.3) !important;
          box-shadow: 0 12px 36px rgba(91,33,182,0.12) !important;
        }
        [data-theme="light"] .qoffet-card__brand { color: rgba(0,0,0,0.35) !important; }
        [data-theme="light"] .qoffet-card__name { color: #0a0f0d !important; }
        [data-theme="light"] .qoffet-card__size { color: rgba(0,0,0,0.4) !important; }
        [data-theme="light"] .qoffet-card__best-price { color: #5B21B6 !important; }
        [data-theme="light"] .qoffet-card__badge { color: #7C3AED !important; background: rgba(124,58,237,0.08) !important; border-color: rgba(124,58,237,0.2) !important; }
        [data-theme="light"] .qoffet-bar__shop { color: rgba(0,0,0,0.45) !important; }
        [data-theme="light"] .qoffet-bar__track { background: rgba(0,0,0,0.06) !important; }
        [data-theme="light"] .qoffet-arrow { background: #ffffff !important; border-color: rgba(91,33,182,0.18) !important; }
        [data-theme="light"] .qoffet-arrow svg { stroke: #5B21B6 !important; }
        [data-theme="light"] .qoffet-arrow:hover:not(:disabled) { background: #5B21B6 !important; border-color: #5B21B6 !important; }
        [data-theme="light"] .qoffet-arrow:hover:not(:disabled) svg { stroke: #fff !important; }
        [data-theme="light"] .qoffet-footer {
          background: linear-gradient(135deg, rgba(91,33,182,0.06) 0%, rgba(124,58,237,0.03) 100%) !important;
          border-color: rgba(91,33,182,0.14) !important;
        }
        [data-theme="light"] .qoffet-footer__text { color: rgba(0,0,0,0.58) !important; }
        [data-theme="light"] .qoffet-footer__cta { color: #5B21B6 !important; background: rgba(91,33,182,0.08) !important; border-color: rgba(91,33,182,0.25) !important; }
        [data-theme="light"] .qoffet-footer__cta:hover { background: rgba(91,33,182,0.15) !important; border-color: rgba(91,33,182,0.45) !important; }
      `}</style>

      <div className="qoffet-inner">
        {/* ── Hero header ── */}
        <div className="qoffet-hero">
          <div className="qoffet-hero__left">
            <div className="qoffet-hero__eyebrow">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z" />
                <path d="M6 17h12" />
              </svg>
              Recette tunisienne
            </div>

            <h2 className="qoffet-hero__title">
              <img
                src="/images/couffin.webp"
                alt=""
                className="qoffet-couffin qoffet-couffin-img"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                sizes="(max-width: 600px) 28vw, 220px"
              />
              <span className="qoffet-hero__title-ar qoffet-hero__title-ar--animated">
                {AR_TEXT.slice(0, arCount)}
                <span className="qoffet-ar-cursor" />
              </span>
            </h2>

            <p className="qoffet-hero__desc">
              Comparez les prix des ingrédients pour préparer ce plat
              traditionnel tunisien dans les principales enseignes. Économisez à
              chaque panier.
            </p>

            <div className="qoffet-hero__legend">
              {SHOPS.map((s) => (
                <div key={s.key} className="qoffet-hero__legend-item">
                  <span
                    className="qoffet-hero__legend-dot"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="qoffet-stats">
            <div className="qoffet-stat qoffet-stat--highlight">
              <div className="qoffet-stat__value">{fmt(totalCost)}</div>
              <div className="qoffet-stat__label">
                Coût total · meilleur prix
              </div>
            </div>
            <div className="qoffet-stat">
              <div className="qoffet-stat__value">{ingredients.length}</div>
              <div className="qoffet-stat__label">Ingrédients comparés</div>
            </div>
            <div className="qoffet-stat">
              <div className="qoffet-stat__value">{SHOPS.length}</div>
              <div className="qoffet-stat__label">Enseignes indexées</div>
            </div>
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="qoffet-grid-wrap">
          <button
            className="qoffet-arrow"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Précédent"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="qoffet-grid">
            {visible.map((ing, i) => (
              <IngredientCard key={ing.name} ing={ing} index={i} C={C} />
            ))}
          </div>

          <button
            className="qoffet-arrow"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Suivant"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="qoffet-dots">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="qoffet-dot"
              style={{
                width: i === page ? 24 : 6,
                background: i === page ? C.teal : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>

        {/* ── Footer banner ── */}
        <div className="qoffet-footer">
          <p className="qoffet-footer__text">
            <strong>🍳 9offet Ettounsi :</strong> Plat traditionnel tunisien à
            base de tomates, oignons, ail, huile végétale et œufs pochés.
            Simple, délicieux et économique — comparez pour cuisiner malin !
          </p>
          <a href="/products" className="qoffet-footer__cta">
            Voir tous les produits
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
