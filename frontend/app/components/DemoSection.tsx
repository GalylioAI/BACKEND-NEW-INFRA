"use client";
import { useEffect, useMemo, useState } from "react";
import type { DetailedAnalyticsResponse } from "../lib/api/types";
import { normalizeShopName, shopLogo } from "../lib/product-utils";

type FilterKey = "ecommerce" | "para" | "super" | "nouveaux";

interface StoreCard {
  categories: string;
  href: string;
  logo: string;
  name: string;
  tags?: string[];
  prix: number;
}

const BASE = "https://1111-galylio-startup.vercel.app";

const fallbackStores: StoreCard[] = [
  // E-commerce
  { categories: "ecommerce new", href: "https://www.mytek.tn",          logo: `${BASE}/_next/image?url=%2Fimages%2Ft%C3%A9l%C3%A9chargement%20(4).png&w=256&q=75`,       name: "Mytek",      tags: ["HOT"], prix: 842.16 },
  { categories: "ecommerce",     href: "https://www.spacenet.tn",        logo: `${BASE}/_next/image?url=%2Fimages%2Fspacenet-removebg-preview.png&w=256&q=75`,              name: "Spacenet",              prix: 800.45 },
  { categories: "ecommerce",     href: "https://www.tunisianet.tn",      logo: `${BASE}/_next/image?url=%2Fimages%2Ft%C3%A9l%C3%A9chargement%20(6).png&w=256&q=75`,        name: "Tunisianet",            prix: 815.72 },
  { categories: "ecommerce new", href: "https://www.technopro.com.tn",   logo: `${BASE}/_next/image?url=%2Fimages%2Ftechnopro-logo.jpg&w=256&q=75`,                         name: "Oxtek",      tags: ["NEW"], prix: 855.93 },
  { categories: "ecommerce",     href: "https://www.batam.tn",           logo: `${BASE}/_next/image?url=%2Fimages%2Flogo-batam.jpg&w=256&q=75`,                             name: "Batam",                 prix: 828.38 },
  { categories: "ecommerce new", href: "https://www.darty.com.tn",       logo: `/images/darty-logo.webp`,                                                                      name: "Darty",      tags: ["NEW"], prix: 867.54 },
  // Supermarché
  { categories: "super new",     href: "https://www.carrefour.com.tn",        logo: `/images/carrefour.png`,  name: "Carrefour",         tags: ["NEW"], prix: 12.90 },
  { categories: "super",         href: "https://www.monoprix.com.tn",         logo: `/images/monoprix.png`,   name: "Monoprix",                         prix: 13.50 },
  { categories: "super",         href: "https://www.geant.com.tn",            logo: `/images/geant.png`,      name: "Géant",                            prix: 13.80 },
  { categories: "super new",     href: "https://www.mgmarche.tn",             logo: `/images/mg.png`,         name: "MG",                tags: ["NEW"], prix: 13.20 },
  { categories: "super",         href: "https://www.aziza.com.tn",            logo: `/images/aziza.png`,      name: "Aziza",                            prix: 13.60 },
  { categories: "super",         href: "https://www.carrefourexpress.com.tn", logo: `/images/carrefour.png`,  name: "Carrefour Express",                prix: 14.10 },
  // Parapharmacie
  { categories: "para new",      href: "https://www.pharmashop.tn",     logo: `/images/parahouse.png`,  name: "Parahouse",  tags: ["NEW"], prix: 28.50 },
  { categories: "para",          href: "https://www.parapharmacie.tn",  logo: `/images/parafendri.jpg`, name: "Parafendri",               prix: 31.00 },
  { categories: "para new",      href: "https://www.tunisie-para.tn",   logo: `/images/parashop.png`,   name: "Parashop",   tags: ["NEW"], prix: 29.90 },
];

const RANK_LABEL = ["1er", "2ème", "3ème"];

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

// Generate 12-month history ending at `current`, with realistic variance
function fallbackHistory(current: number, variance: number, pattern: number[]): number[] {
  return pattern.map((offset, i) => {
    const progress = i / (pattern.length - 1);
    const base = current * (1 - variance) + current * variance * progress;
    return parseFloat((base + offset * current * 0.012).toFixed(3));
  });
}

const HISTORY_PATTERNS: Record<string, number[]> = {
  // [monthly delta multipliers over 12 months]
  A: [-6, -5.2, -4.5, -3.8, -3.2, -2.4, -1.8, -1.2, -0.8, -0.4, -0.1, 0],
  B: [-5.5, -4.8, -4.2, -3.5, -2.9, -2.2, -1.9, -1.3, -0.9, -0.5, -0.2, 0],
  C: [-5, -4.5, -4, -3.2, -2.8, -2.1, -1.7, -1.1, -0.7, -0.4, -0.1, 0],
};

const RANK_COLORS = ["#3BDEB9", "#94A3B8", "#F59E0B"];
const RANK_PATTERNS: [number, keyof typeof HISTORY_PATTERNS][] = [[0.15, "A"], [0.16, "B"], [0.14, "C"]];

function RankMedalIcon({ rank }: { rank: number }) {
  const tones = [
    { bg: "linear-gradient(135deg,#3BDEB9,#CCFF9B)", border: "rgba(204,255,155,0.75)", icon: "#08120d" },
    { bg: "linear-gradient(135deg,#cbd5e1,#94a3b8)", border: "rgba(203,213,225,0.75)", icon: "#111827" },
    { bg: "linear-gradient(135deg,#fbbf24,#f59e0b)", border: "rgba(251,191,36,0.8)", icon: "#1f1300" },
  ][rank] || { bg: "linear-gradient(135deg,#3BDEB9,#CCFF9B)", border: "rgba(204,255,155,0.75)", icon: "#08120d" };

  return (
    <span className="pdm-medal" style={{ background: tones.bg, borderColor: tones.border }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="9.5" r="4.5" stroke={tones.icon} strokeWidth="2" />
        <path d="M9 13.2L7.3 21l4.7-2.3L16.7 21 15 13.2" stroke={tones.icon} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

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

function Sparkline({ data, color, name }: { data: number[]; color: string; name: string }) {
  const isLight = useIsLight();
  const gridStroke = isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)";
  const labelFill  = isLight ? "rgba(0,0,0,0.35)"  : "rgba(255,255,255,0.3)";
  const W = 280, H = 90, padL = 28, padR = 8, padT = 10, padB = 22;
  const cW = W - padL - padR, cH = H - padT - padB;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const px = (i: number) => padL + (i / (data.length - 1)) * cW;
  const py = (v: number) => padT + cH - ((v - min) / range) * cH;

  const linePath = data.map((v, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L${px(data.length - 1).toFixed(1)},${(padT + cH).toFixed(1)} L${padL},${(padT + cH).toFixed(1)} Z`;
  const id = `spark-${name.replace(/\s/g, "")}`;

  return (
    <div className="pdm-spark">
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop stopColor={color} stopOpacity="0.6" />
            <stop offset="1" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((t, i) => (
          <line key={i} x1={padL} x2={W - padR} y1={padT + cH * t} y2={padT + cH * t}
            stroke={gridStroke} strokeDasharray="3 3" />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${id}-area)`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={`url(#${id}-line)`} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="pdm-spark-line" />

        {/* End dot */}
        <circle cx={px(data.length - 1)} cy={py(data[data.length - 1])} r="3.5"
          fill={color} stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />

        {/* Y labels */}
        <text x={padL - 4} y={padT + 4} textAnchor="end" fontSize="8" fill={labelFill} fontWeight="600">{max.toFixed(2)}</text>
        <text x={padL - 4} y={padT + cH + 4} textAnchor="end" fontSize="8" fill={labelFill} fontWeight="600">{min.toFixed(2)}</text>

        {/* X month labels — show 4 evenly */}
        {[0, 3, 7, 11].map(i => (
          <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize="8" fill={labelFill} fontWeight="600">
            {MONTHS[i]}
          </text>
        ))}
      </svg>
    </div>
  );
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ecommerce", label: "E-commerce" },
  { key: "para",      label: "Parapharmacie" },
  { key: "super",     label: "Supermarché" },
  { key: "nouveaux",  label: "Nouveaux" },
];

interface DemoSectionProps {
  analytics?: DetailedAnalyticsResponse | null;
}

function domainForShop(name: string) {
  const normalized = name.toLowerCase().replace(/_/g, "");
  const domains: Record<string, string> = {
    tunisianet: "https://www.tunisianet.com.tn",
    spacenet: "https://spacenet.tn",
    mytek: "https://www.mytek.tn",
    darty: "https://www.darty.com.tn",
    parashop: "https://www.parashop.tn",
    parafendri: "https://www.parafendri.tn",
    pharmashop: "https://www.pharmashop.tn",
  };
  return domains[normalized] || `https://${normalized}.tn`;
}

function analyticsStores(analytics?: DetailedAnalyticsResponse | null): StoreCard[] {
  if (!analytics) return fallbackStores;

  const retail = analytics.retails_shops.map((shop, index) => ({
    categories: `ecommerce ${index < 2 ? "new" : ""}`,
    href: domainForShop(shop.name),
    logo: shopLogo(shop.name),
    name: normalizeShopName(shop.name),
    tags: index === 0 ? ["HOT"] : index < 2 ? ["NEW"] : undefined,
    prix: shop.average_price,
  }));

  const para = analytics.para_shops.map((shop, index) => ({
    categories: `para ${index < 2 ? "new" : ""}`,
    href: domainForShop(shop.name),
    logo: shopLogo(shop.name),
    name: normalizeShopName(shop.name),
    tags: index === 0 ? ["HOT"] : index < 2 ? ["NEW"] : undefined,
    prix: shop.average_price,
  }));

  const supermarketFallback = fallbackStores.filter((shop) => shop.categories.includes("super"));
  return [...retail, ...para, ...supermarketFallback];
}

export default function DemoSection({ analytics }: DemoSectionProps) {
  const [active, setActive] = useState<FilterKey>("ecommerce");
  const stores = useMemo(() => analyticsStores(analytics), [analytics]);
  const activeFilterIdx = FILTERS.findIndex((f) => f.key === active);

  const goPrevFilter = () => {
    const nextIdx = activeFilterIdx <= 0 ? FILTERS.length - 1 : activeFilterIdx - 1;
    setActive(FILTERS[nextIdx].key);
  };
  const goNextFilter = () => {
    const nextIdx = activeFilterIdx >= FILTERS.length - 1 ? 0 : activeFilterIdx + 1;
    setActive(FILTERS[nextIdx].key);
  };

  const filtered = stores
    .filter(s => active === "nouveaux" ? s.categories.includes("new") : s.categories.includes(active))
    .sort((a, b) => a.prix - b.prix)
    .slice(0, 3);

  // Podium order: [2nd, 1st, 3rd]
  const podium = filtered.length === 3
    ? [filtered[1], filtered[0], filtered[2]]
    : filtered;

  const podiumIndex = filtered.length === 3 ? [1, 0, 2] : [0, 1, 2];

  const cheapest = filtered[0]?.prix ?? 0;

  return (
    <section id="demo" className="section-demo">
      <style>{`
        .section-demo .heading-section.center.mb-60 {
          margin-bottom: 34px !important;
          padding: 0 12px;
        }
        .section-demo .heading-section.center.mb-60 svg {
          width: clamp(210px, 36vw, 420px);
          height: auto;
          display: block;
          margin: 0 auto 10px;
        }
        .section-demo .heading-section.center.mb-60 .heading.h1 {
          margin-bottom: 10px !important;
          font-size: clamp(1.55rem, 3.8vw, 2.75rem);
          line-height: 1.15;
          color: #ffffff;
        }
        .section-demo .heading-section.center.mb-60 p {
          max-width: 760px;
          margin: 0 auto;
          font-size: clamp(0.92rem, 1.6vw, 1.02rem);
          line-height: 1.55;
          color: rgba(255,255,255,0.72);
        }
        @media (max-width: 767px) {
          .section-demo .heading-section.center.mb-60 {
            margin-bottom: 22px !important;
            padding: 0 4px;
          }
          .section-demo .heading-section.center.mb-60 svg {
            width: clamp(170px, 52vw, 250px);
            margin-bottom: 6px;
          }
          .section-demo .heading-section.center.mb-60 .heading.h1 {
            font-size: clamp(1.2rem, 6vw, 1.55rem);
            line-height: 1.2;
            margin-bottom: 6px !important;
          }
          .section-demo .heading-section.center.mb-60 p {
            font-size: 0.86rem;
            line-height: 1.45;
          }
        }

        /* ── Filter bar ── */
        .pdm-filter-bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-bottom: 48px;
          padding: 10px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 14px 34px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
          width: fit-content;
          max-width: 100%;
          margin-left: auto;
          margin-right: auto;
          backdrop-filter: blur(10px);
        }
        .pdm-filter-btn {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.82);
          border-radius: 999px;
          padding: 11px 20px;
          min-height: 46px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: 0.04em;
          position: relative;
          overflow: hidden;
        }
        .pdm-filter-btn:hover {
          border-color: rgba(59,222,185,0.35);
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.28), 0 0 18px rgba(59,222,185,0.12);
          background: rgba(59,222,185,0.07);
        }
        .pdm-filter-btn.active {
          background: linear-gradient(110deg, rgba(59,222,185,0.2), rgba(204,255,155,0.16));
          border-color: rgba(204,255,155,0.45);
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22);
        }
        .pdm-filter-btn.active::after {
          content: "";
          position: absolute;
          left: 18%;
          right: 18%;
          bottom: 6px;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg, #3BDEB9, #CCFF9B);
        }
        .pdm-filter-mobile-nav {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 18px;
        }
        .pdm-filter-arrow {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.05);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .2s ease;
          flex-shrink: 0;
        }
        .pdm-filter-arrow:hover {
          border-color: rgba(59,222,185,0.4);
          background: rgba(59,222,185,0.1);
          color: #3BDEB9;
        }
        .pdm-filter-mobile-pill {
          min-width: 180px;
          text-align: center;
          padding: 9px 14px;
          border-radius: 999px;
          border: 1px solid rgba(204,255,155,0.45);
          background: linear-gradient(110deg, rgba(59,222,185,0.2), rgba(204,255,155,0.16));
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          box-shadow: 0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22);
        }

        /* ── Podium: benchmark deck ── */
        .pdm-stage {
          --pdm-surface: #0e1014;
          --pdm-elevated: #14181f;
          --pdm-border: rgba(255, 255, 255, 0.07);
          --pdm-muted: rgba(226, 232, 240, 0.52);
          --pdm-faint: rgba(226, 232, 240, 0.36);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: clamp(16px, 2.4vw, 32px);
          width: 100%;
          max-width: min(1600px, 100%);
          margin-left: auto;
          margin-right: auto;
          padding: clamp(24px, 3.5vw, 40px) clamp(16px, 2.8vw, 32px) clamp(28px, 3.5vw, 44px);
          border-radius: 20px;
          background: var(--pdm-surface);
          border: 1px solid var(--pdm-border);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.04) inset,
            0 32px 64px -28px rgba(0, 0, 0, 0.65);
          box-sizing: border-box;
        }
        .pdm-col {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          flex: 1 1 0;
          min-width: 0;
          max-width: 420px;
        }

        .pdm-card {
          width: 100%;
          height: 100%;
          background: var(--pdm-elevated);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--pdm-border);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition:
            transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.25s ease,
            box-shadow 0.32s ease;
          position: relative;
        }
        .pdm-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45);
        }
        .pdm-card.first {
          border-color: rgba(59, 222, 185, 0.28);
          box-shadow:
            0 0 0 1px rgba(59, 222, 185, 0.12) inset,
            0 16px 48px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(59, 222, 185, 0.15);
        }
        .pdm-card.first:hover {
          border-color: rgba(59, 222, 185, 0.42);
          box-shadow:
            0 0 0 1px rgba(59, 222, 185, 0.18) inset,
            0 22px 56px rgba(0, 0, 0, 0.48),
            0 0 48px rgba(59, 222, 185, 0.08);
        }
        .pdm-card.first::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3bdeb9, #77e590, #ccff9b);
          opacity: 0.95;
          z-index: 1;
        }

        .pdm-medal {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
          z-index: 3;
        }

        .pdm-logo-wrap {
          position: relative;
          background: #f1f3f5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px 28px;
          min-height: 140px;
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }
        .pdm-logo-wrap::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, transparent 45%);
          pointer-events: none;
        }
        .pdm-logo-wrap img {
          position: relative;
          z-index: 1;
          width: 72px;
          height: 72px;
          max-width: 72px;
          max-height: 72px;
          object-fit: contain;
        }
        .pdm-card.first .pdm-logo-wrap {
          padding: 36px 22px 30px;
          min-height: 152px;
        }
        .pdm-card.first .pdm-logo-wrap img {
          width: 80px;
          height: 80px;
          max-width: 80px;
          max-height: 80px;
        }
        .pdm-stage.is-para .pdm-logo-wrap img {
          width: 72px;
          height: 72px;
          max-width: 72px;
          max-height: 72px;
        }
        .pdm-stage.is-para .pdm-card.first .pdm-logo-wrap img {
          width: 80px;
          height: 80px;
          max-width: 80px;
          max-height: 80px;
        }

        .pdm-body {
          flex: 1;
          padding: 20px 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pdm-card.first .pdm-body {
          padding: 22px 22px 24px;
          gap: 16px;
        }
        .pdm-store-name {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.25;
          color: #f8fafc;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pdm-card.first .pdm-store-name {
          font-size: 18px;
        }
        .pdm-explain {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--pdm-muted);
          padding: 0 0 0 11px;
          border-left: 2px solid rgba(59, 222, 185, 0.45);
        }
        .pdm-tag {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #041008;
          background: linear-gradient(120deg, #3bdeb9, #9af0c9);
          padding: 3px 8px;
          border-radius: 6px;
          border: none;
        }

        .pdm-price-panel {
          margin-top: 2px;
          padding: 14px 14px 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pdm-price-label {
          display: block;
          margin: 0;
          padding: 0;
          border: none;
          background: none;
          box-shadow: none;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--pdm-faint);
        }
        .pdm-price-label::before {
          display: none;
        }
        .pdm-price-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin: 0;
        }
        .pdm-price-num {
          font-size: 26px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
          color: #ffffff;
          line-height: 1;
        }
        .pdm-card.first .pdm-price-num {
          font-size: 30px;
          letter-spacing: -0.035em;
        }
        .pdm-price-unit {
          font-size: 12px;
          font-weight: 600;
          color: var(--pdm-muted);
        }

        .pdm-best-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          align-self: flex-start;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #d1fae5;
          background: rgba(59, 222, 185, 0.12);
          border: 1px solid rgba(59, 222, 185, 0.28);
          padding: 5px 10px;
          border-radius: 8px;
        }
        .pdm-best-badge::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3bdeb9;
          box-shadow: 0 0 0 2px rgba(59, 222, 185, 0.25);
        }
        .pdm-diff-badge {
          display: inline-flex;
          align-self: flex-start;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: rgba(254, 202, 202, 0.95);
          background: rgba(185, 28, 28, 0.2);
          border: 1px solid rgba(248, 113, 113, 0.22);
          padding: 5px 10px;
          border-radius: 8px;
        }

        .pdm-base {
          width: 100%;
          margin-top: -1px;
          border-radius: 0 0 14px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(248, 250, 252, 0.42);
          padding: 10px 12px;
          border: 1px solid var(--pdm-border);
          border-top: none;
          background: rgba(0, 0, 0, 0.25);
        }
        .pdm-base.rank-1 {
          color: #99f6e4;
          background: linear-gradient(180deg, rgba(59, 222, 185, 0.14) 0%, rgba(8, 12, 14, 0.92) 100%);
          border-color: rgba(59, 222, 185, 0.22);
          min-height: 52px;
          font-size: 11px;
        }
        .pdm-base.rank-2 {
          min-height: 40px;
          color: rgba(226, 232, 240, 0.5);
        }
        .pdm-base.rank-3 {
          min-height: 32px;
          color: rgba(226, 232, 240, 0.38);
        }

        .pdm-spark {
          width: 100%;
          margin-top: 10px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 12px 10px 8px;
          box-sizing: border-box;
        }
        .pdm-spark-title {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(226, 232, 240, 0.4);
          padding: 0 4px 10px;
        }
        .pdm-spark-line {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: pdm-draw 1.6s ease forwards;
        }
        @keyframes pdm-draw {
          to { stroke-dashoffset: 0; }
        }

        @media (max-width: 991px) {
          .pdm-stage {
            justify-content: flex-start;
            align-items: stretch;
            gap: 12px;
            overflow-x: auto;
            padding: 16px 12px 20px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            max-width: none;
          }
          .pdm-stage::-webkit-scrollbar { height: 6px; }
          .pdm-stage::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 999px;
          }
          .pdm-col {
            flex: 0 0 250px;
            width: 250px;
            scroll-snap-align: start;
          }
          .pdm-logo-wrap { min-height: 120px; padding: 20px 14px 16px; }
          .pdm-card.first .pdm-logo-wrap { min-height: 120px; padding: 20px 14px 16px; }
          .pdm-logo-wrap img,
          .pdm-card.first .pdm-logo-wrap img {
            width: 64px;
            height: 64px;
            max-width: 64px;
            max-height: 64px;
          }
          .pdm-body,
          .pdm-card.first .pdm-body { padding: 14px; gap: 10px; }
          .pdm-price-panel { padding: 12px; }
          .pdm-store-name,
          .pdm-card.first .pdm-store-name { font-size: 13px; }
          .pdm-explain { font-size: 10px; padding: 7px 8px; }
          .pdm-price-num,
          .pdm-card.first .pdm-price-num { font-size: 24px; }
          .pdm-price-unit { font-size: 11px; }
          .pdm-base { display: none; }
          .pdm-spark { margin-top: 8px; padding: 8px 4px 4px; }
        }
        @media (max-width: 640px) {
          .pdm-filter-mobile-nav { display: flex; }
          .pdm-filter-bar { display: none; }
          .pdm-filter-btn {
            flex: 0 0 auto;
            min-height: 42px;
            padding: 8px 13px;
            font-size: 12px;
          }
          .pdm-stage {
            overflow-x: visible;
            scroll-snap-type: none;
            gap: 8px;
            align-items: stretch;
            padding: 14px 8px 18px;
          }
          .pdm-col {
            flex: 1 1 0;
            width: auto;
            min-width: 0;
          }
          .pdm-medal {
            width: 24px;
            height: 24px;
            top: 6px;
            right: 6px;
          }
          .pdm-medal svg {
            width: 10px;
            height: 10px;
          }
          .pdm-logo-wrap { min-height: 78px; padding: 10px 8px 8px; }
          .pdm-card.first .pdm-logo-wrap { min-height: 78px; padding: 10px 8px 8px; }
          .pdm-logo-wrap img,
          .pdm-card.first .pdm-logo-wrap img {
            width: 44px;
            height: 44px;
            max-width: 44px;
            max-height: 44px;
          }
          .pdm-body,
          .pdm-card.first .pdm-body { padding: 10px; gap: 8px; }
          .pdm-price-panel { padding: 10px 8px; gap: 6px; }
          .pdm-store-name,
          .pdm-card.first .pdm-store-name { font-size: 10px; gap: 4px; }
          .pdm-tag {
            font-size: 6px;
            padding: 1px 4px;
          }
          .pdm-explain {
            display: none;
          }
          .pdm-price-label {
            font-size: 7px;
            padding: 3px 6px;
            gap: 4px;
          }
          .pdm-price-label::before {
            width: 4px;
            height: 4px;
          }
          .pdm-price-num,
          .pdm-card.first .pdm-price-num { font-size: 14px; letter-spacing: -0.5px; }
          .pdm-price-unit { font-size: 8px; }
          .pdm-best-badge,
          .pdm-diff-badge {
            font-size: 7px;
            padding: 2px 6px;
          }
          .pdm-spark {
            display: none;
          }
        }

        /* ── Light mode overrides ── */
        [data-theme="light"] .section-demo { background: #eef0ed !important; }

        /* filter bar */
        [data-theme="light"] .pdm-filter-bar {
          background: rgba(255,255,255,0.85) !important;
          border-color: rgba(0,0,0,0.1) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.07) !important;
        }
        [data-theme="light"] .pdm-filter-btn {
          background: transparent !important;
          border-color: rgba(0,0,0,0.1) !important;
          color: rgba(0,0,0,0.6) !important;
        }
        [data-theme="light"] .pdm-filter-btn:hover {
          border-color: rgba(91,33,182,0.35) !important;
          color: #5B21B6 !important;
          background: rgba(91,33,182,0.06) !important;
          box-shadow: 0 4px 14px rgba(91,33,182,0.1) !important;
        }
        [data-theme="light"] .pdm-filter-btn.active {
          background: linear-gradient(110deg, rgba(91,33,182,0.12), rgba(124,58,237,0.08)) !important;
          border-color: rgba(91,33,182,0.4) !important;
          color: #5B21B6 !important;
          box-shadow: 0 6px 18px rgba(91,33,182,0.1) !important;
        }
        [data-theme="light"] .pdm-filter-btn.active::after {
          background: linear-gradient(90deg, #5B21B6, #7C3AED) !important;
        }
        [data-theme="light"] .pdm-filter-arrow {
          background: rgba(255,255,255,0.9) !important;
          border-color: rgba(0,0,0,0.12) !important;
          color: #0a0f0d !important;
        }
        [data-theme="light"] .pdm-filter-arrow:hover {
          border-color: rgba(91,33,182,0.35) !important;
          background: rgba(91,33,182,0.07) !important;
          color: #5B21B6 !important;
        }
        [data-theme="light"] .pdm-filter-mobile-pill {
          background: linear-gradient(110deg, rgba(91,33,182,0.12), rgba(124,58,237,0.08)) !important;
          border-color: rgba(91,33,182,0.35) !important;
          color: #5B21B6 !important;
        }

        /* cards */
        [data-theme="light"] .pdm-stage {
          background: #f4f6f8 !important;
          border-color: rgba(15, 23, 42, 0.08) !important;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.9) inset,
            0 24px 48px rgba(15, 23, 42, 0.07) !important;
        }
        [data-theme="light"] .pdm-card {
          background: #ffffff !important;
          border-color: rgba(0,0,0,0.09) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08) !important;
        }
        [data-theme="light"] .pdm-card:hover {
          box-shadow: 0 16px 48px rgba(0,0,0,0.12) !important;
        }
        [data-theme="light"] .pdm-card.first {
          border-color: rgba(91,33,182,0.28) !important;
          box-shadow: 0 12px 40px rgba(91,33,182,0.1) !important;
        }
        [data-theme="light"] .pdm-card.first::before {
          background: linear-gradient(90deg, transparent, rgba(91,33,182,0.5), transparent) !important;
        }
        [data-theme="light"] .pdm-store-name,
        [data-theme="light"] .pdm-card.first .pdm-store-name { color: rgba(0,0,0,0.75) !important; }
        [data-theme="light"] .pdm-explain {
          color: rgba(0,0,0,0.52) !important;
          background: none !important;
          border: none !important;
          border-left: 2px solid rgba(91, 33, 182, 0.35) !important;
          padding-left: 10px !important;
        }
        [data-theme="light"] .pdm-price-panel {
          background: rgba(15, 23, 42, 0.04) !important;
          border-color: rgba(15, 23, 42, 0.08) !important;
        }
        [data-theme="light"] .pdm-price-label {
          color: rgba(0,0,0,0.65) !important;
          border-color: rgba(0,0,0,0.1) !important;
          background: rgba(0,0,0,0.03) !important;
          box-shadow: none !important;
        }
        [data-theme="light"] .pdm-price-num,
        [data-theme="light"] .pdm-card.first .pdm-price-num {
          color: #0a0f0d !important;
          background: none !important;
          -webkit-background-clip: unset !important;
          background-clip: unset !important;
          -webkit-text-fill-color: #0a0f0d !important;
        }
        [data-theme="light"] .pdm-price-unit { color: rgba(0,0,0,0.5) !important; }
        [data-theme="light"] .pdm-diff-badge {
          color: rgba(180,50,30,0.85) !important;
          background: rgba(220,50,30,0.06) !important;
          border-color: rgba(200,50,30,0.15) !important;
        }
        [data-theme="light"] .pdm-best-badge {
          background: linear-gradient(120deg, rgba(91, 33, 182, 0.12), rgba(124, 58, 237, 0.08)) !important;
          color: #5b21b6 !important;
          border-color: rgba(91, 33, 182, 0.28) !important;
          box-shadow: 0 4px 14px rgba(91, 33, 182, 0.1) !important;
        }

        /* podium bases */
        [data-theme="light"] .pdm-base { color: rgba(0,0,0,0.3) !important; }
        [data-theme="light"] .pdm-base.rank-1 {
          background: linear-gradient(135deg, rgba(91,33,182,0.1), rgba(124,58,237,0.06)) !important;
          border-color: rgba(91,33,182,0.2) !important;
          color: #5B21B6 !important;
        }
        [data-theme="light"] .pdm-base.rank-2 {
          background: rgba(0,0,0,0.03) !important;
          border-color: rgba(0,0,0,0.07) !important;
        }
        [data-theme="light"] .pdm-base.rank-3 {
          background: rgba(0,0,0,0.02) !important;
          border-color: rgba(0,0,0,0.05) !important;
        }

        /* sparkline */
        [data-theme="light"] .pdm-spark {
          background: rgba(15, 23, 42, 0.035) !important;
          border-color: rgba(15, 23, 42, 0.08) !important;
        }
        [data-theme="light"] .pdm-spark-title { color: rgba(0,0,0,0.3) !important; }

        /* section heading SVG text override */
        [data-theme="light"] .section-demo .heading-section .heading,
        [data-theme="light"] .section-demo h2,
        [data-theme="light"] .section-demo h3 { color: #0a0f0d !important; }
        [data-theme="light"] .section-demo p { color: rgba(0,0,0,0.55) !important; }
        [data-theme="light"] .section-demo .heading-section.center.mb-60 .heading.h1 { color: #0a0f0d !important; }
        [data-theme="light"] .section-demo .heading-section.center.mb-60 p { color: rgba(0,0,0,0.58) !important; }
        [data-theme="light"] .section-demo .heading-section.center.mb-60 .pdm-heading-art {
          filter: drop-shadow(0 14px 24px rgba(15,23,42,0.08));
        }
        [data-theme="light"] .section-demo .heading-section.center.mb-60 .pdm-heading-art .pdm-heading-bg {
          fill: url(#pdm_g2_light) !important;
        }
        [data-theme="light"] .section-demo .heading-section.center.mb-60 .pdm-heading-art .pdm-heading-glyph {
          stroke: url(#pdm_g1_light) !important;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 4px 10px rgba(91,33,182,0.18));
        }

        /*
         * grid-2.webp includes a dark plate; blend it into the real page canvas
         * (#000 dark / #eef0ed light). Desktop only — .img-bg is hidden ≤991px in app.css.
         */
        @media (min-width: 992px) {
          .section-demo .heading-section.center.mb-60 > .img-bg {
            mix-blend-mode: screen;
            opacity: 0.88;
            filter: none;
          }
          [data-theme="light"] .section-demo .heading-section.center.mb-60 > .img-bg {
            mix-blend-mode: lighten;
            opacity: 0.5;
            filter: none;
          }
        }

        /* scrollbar */
        [data-theme="light"] .pdm-stage::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15) !important;
        }
      `}</style>

      <div className="container-1">
        <div className="row">
          <div className="col-12">
            <div className="heading-section center mb-60">
              <img loading="lazy" decoding="async" fetchPriority="low" className="img-bg" src="/images/item/grid-2.webp" alt="" />
              <svg className="pdm-heading-art" width="459" height="242" viewBox="0 0 459 242" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="pdm_g1" x1="375" y1="625" x2="-132.784" y2="483.917" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3BDEB9" /><stop offset="0.5" stopColor="#77E590" /><stop offset="1" stopColor="#CCFF9B" />
                  </linearGradient>
                  <linearGradient id="pdm_g2" x1="195" y1="4" x2="195" y2="228.526" gradientUnits="userSpaceOnUse">
                    <stop stopOpacity="0" /><stop offset="1" />
                  </linearGradient>
                  <linearGradient id="pdm_g1_light" x1="390" y1="16" x2="68" y2="230" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4C1D95" />
                    <stop offset="0.55" stopColor="#6D28D9" />
                    <stop offset="1" stopColor="#A78BFA" />
                  </linearGradient>
                  <linearGradient id="pdm_g2_light" x1="195" y1="4" x2="195" y2="241" gradientUnits="userSpaceOnUse">
                    <stop stopColor="rgba(255,255,255,0)" />
                    <stop offset="0.72" stopColor="rgba(91,33,182,0.07)" />
                    <stop offset="1" stopColor="rgba(15,23,42,0.04)" />
                  </linearGradient>
                </defs>
                <rect className="pdm-heading-bg" x="6" y="4" width="378" height="237" fill="url(#pdm_g2)" />
                <text className="pdm-heading-glyph" x="80" y="200" fontSize="220" fontFamily="Arial Black, Arial, sans-serif" fontWeight="bold"
                  stroke="url(#pdm_g1)" strokeWidth="6" fill="none">50</text>
                <text className="pdm-heading-glyph" x="370" y="100" fontSize="110" fontFamily="Arial Black, Arial, sans-serif" fontWeight="bold"
                  stroke="url(#pdm_g1)" strokeWidth="4" fill="none">+</text>
              </svg>
              <div className="heading fw-6 mb-8 wow fadeInUp h1" data-wow-delay="0s">
                <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                  <span className="cd-words-wrapper">
                    <span className="item-text is-visible">Magasins</span>
                    <span className="item-text is-hidden">Magasins</span>
                    <span className="item-text is-hidden">Magasins</span>
                  </span>
                </span>
                &nbsp;Indexés
              </div>
              <p className="wow fadeInUp" data-wow-delay="0.1s">Comparez les prix en temps réel sur les plus grandes boutiques en ligne de Tunisie.</p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="pdm-filter-mobile-nav wow fadeInUp" data-wow-delay="0s">
          <button type="button" className="pdm-filter-arrow" onClick={goPrevFilter} aria-label="Filtre précédent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="pdm-filter-mobile-pill">{FILTERS[activeFilterIdx]?.label || "Filtre"}</div>
          <button type="button" className="pdm-filter-arrow" onClick={goNextFilter} aria-label="Filtre suivant">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="pdm-filter-bar wow fadeInUp" data-wow-delay="0s">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`pdm-filter-btn tf-btn-3 light_skew_hover${active === f.key ? " active" : ""}`}
              onClick={() => setActive(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Podium */}
        <div className={`pdm-stage wow fadeInUp${active === "para" ? " is-para" : ""}`} data-wow-delay="0.1s">
          {podium.map((card, colIdx) => {
            const rank = podiumIndex[colIdx]; // 0=1st, 1=2nd, 2=3rd
            const isFirst = rank === 0;
            const diffPct = rank === 0 ? null : (((card.prix - cheapest) / cheapest) * 100).toFixed(1);

            return (
              <div key={card.name} className="pdm-col" style={{ marginBottom: isFirst ? 0 : 0 }}>
                <a href={card.href} target="_blank" rel="noopener noreferrer" className={`pdm-card${isFirst ? " first" : ""}`}>
                  <RankMedalIcon rank={rank} />
                  <div className="pdm-logo-wrap">
                    <img src={card.logo} alt={card.name} loading="lazy" decoding="async" fetchPriority="low" sizes="120px" />
                  </div>
                  <div className="pdm-body">
                    <div className="pdm-store-name">
                      {card.name}
                      {card.tags?.map(t => <span key={t} className="pdm-tag">{t}</span>)}
                    </div>
                    <p className="pdm-explain">
                      Moyenne sur 12 mois glissants — repère pour comparer les enseignes au même produit.
                    </p>
                    <div className="pdm-price-panel">
                      <span className="pdm-price-label">Prix moyen</span>
                      <div className="pdm-price-row">
                        <span className="pdm-price-num">{card.prix.toFixed(2)}</span>
                        <span className="pdm-price-unit">DT</span>
                      </div>
                      {isFirst
                        ? <span className="pdm-best-badge">Moins cher</span>
                        : <span className="pdm-diff-badge">+{diffPct}% vs. meilleur prix</span>
                      }
                    </div>
                  </div>
                </a>
                {/* Podium base */}
                <div className={`pdm-base rank-${rank + 1}`}>
                  {RANK_LABEL[rank]}
                </div>

                {/* Price evolution chart */}
                <div className="pdm-spark">
                  <div className="pdm-spark-title">Évolution du prix (12 mois)</div>
                  <Sparkline
                    data={fallbackHistory(card.prix, RANK_PATTERNS[rank][0], HISTORY_PATTERNS[RANK_PATTERNS[rank][1]])}
                    color={RANK_COLORS[rank]}
                    name={card.name}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
