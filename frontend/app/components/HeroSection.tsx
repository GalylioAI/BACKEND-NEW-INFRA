"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type {
  BlogArticle,
  CatalogProduct,
  CatalogSource,
  ProductSearchResult,
} from "../lib/demo-data/types";
import {
  formatPrice,
  productCategory,
  sortedShopPrices,
} from "../lib/product-utils";
import { searchParaProducts, searchProducts } from "../lib/demo-data/catalog";
import { articles } from "../lib/articles";

type SearchHit = ProductSearchResult & { source: CatalogSource };

const SparkleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15.5001 11.1518L14.5786 11.6126C14.3018 11.7502 14.0778 11.9742 13.9402 12.251L13.4794 13.1726C13.4138 13.3054 13.225 13.3054 13.1594 13.1726L12.6986 12.251C12.561 11.9742 12.337 11.7502 12.0602 11.6126L11.1387 11.1518C11.0059 11.0862 11.0059 10.8974 11.1387 10.8318L12.0602 10.371C12.337 10.2335 12.561 10.0095 12.6986 9.73266L13.1594 8.81109C13.225 8.67829 13.4138 8.67829 13.4794 8.81109L13.9402 9.73266C14.0778 10.0095 14.3018 10.2335 14.5786 10.371L15.5001 10.8318C15.6329 10.8974 15.6329 11.0862 15.5001 11.1518Z"
      fill="url(#spark0)"
    />
    <path
      d="M10.8092 8.37279L8.65888 9.44796C8.01409 9.77116 7.49091 10.2943 7.16772 10.9391L6.09255 13.0895C5.93895 13.3967 5.50057 13.3967 5.34697 13.0895L4.2718 10.9391C3.94861 10.2943 3.42542 9.77116 2.78064 9.44796L0.630294 8.37279C0.323105 8.2192 0.323105 7.78081 0.630294 7.62721L2.78064 6.55204C3.42542 6.22885 3.94861 5.70566 4.2718 5.06088L5.34697 2.91054C5.50057 2.60334 5.93895 2.60334 6.09255 2.91054L7.16772 5.06088C7.49091 5.70566 8.01409 6.22885 8.65888 6.55204L10.8092 7.62721C11.1164 7.78081 11.1164 8.2192 10.8092 8.37279Z"
      fill="url(#spark1)"
    />
    <path
      d="M11.1151 3.83366L11.5706 3.60595C11.7074 3.53795 11.8181 3.42725 11.8861 3.29046L12.1138 2.83503C12.1462 2.7694 12.2395 2.7694 12.2719 2.83503L12.4996 3.29046C12.5676 3.42725 12.6783 3.53795 12.8151 3.60595L13.2706 3.83366C13.3362 3.86608 13.3362 3.95938 13.2706 3.9918L12.8151 4.21952C12.6783 4.28752 12.5676 4.39821 12.4996 4.535L12.2719 4.99044C12.2395 5.05527 12.1462 5.05527 12.1138 4.99044L11.8861 4.535C11.8181 4.39821 11.7074 4.28752 11.5706 4.21952L11.1151 3.9918C11.0495 3.95938 11.0495 3.86608 11.1151 3.83366Z"
      fill="url(#spark2)"
    />
    <defs>
      <linearGradient
        id="spark0"
        x1="15.5997"
        y1="13.2722"
        x2="10.1035"
        y2="10.7515"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#3BDEB9" />
        <stop offset="0.5" stopColor="#77E590" />
        <stop offset="1" stopColor="#CCFF9B" />
      </linearGradient>
      <linearGradient
        id="spark1"
        x1="11.0396"
        y1="13.3199"
        x2="-1.78273"
        y2="7.43927"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#3BDEB9" />
        <stop offset="0.5" stopColor="#77E590" />
        <stop offset="1" stopColor="#CCFF9B" />
      </linearGradient>
      <linearGradient
        id="spark2"
        x1="13.3198"
        y1="5.03906"
        x2="10.6038"
        y2="3.79314"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#3BDEB9" />
        <stop offset="0.5" stopColor="#77E590" />
        <stop offset="1" stopColor="#CCFF9B" />
      </linearGradient>
    </defs>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12H19M19 12L12 5M19 12L12 19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrophyIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <path
      d="M8 21h8M12 17v4M5 3H3a2 2 0 000 4h2M19 3h2a2 2 0 010 4h-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M5 3v8a7 7 0 0014 0V3H5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const fallbackHeroProducts = [
  {
    name: "Samsung Galaxy S24",
    spec: "256 Go · Snapdragon 8 Gen 3",
    category: "Smartphones",
    tag: "TENDANCE",
    savings: "101 DT",
    stores: [
      { name: "Mytek", price: "1 249", unit: "DT", best: true, pct: 68 },
      { name: "Tunisianet", price: "1 289", unit: "DT", best: false, pct: 78 },
      { name: "Spacenet", price: "1 319", unit: "DT", best: false, pct: 88 },
      { name: "TechnoPro", price: "1 350", unit: "DT", best: false, pct: 100 },
    ],
  },
  {
    name: 'LG OLED C3 55"',
    spec: "4K · 120Hz · HDR10+ · WebOS",
    category: "Télévisions",
    tag: "POPULAIRE",
    savings: "210 DT",
    stores: [
      { name: "Mytek", price: "3 190", unit: "DT", best: true, pct: 64 },
      { name: "Géant", price: "3 290", unit: "DT", best: false, pct: 72 },
      { name: "Tunisianet", price: "3 350", unit: "DT", best: false, pct: 85 },
      { name: "TechnoPro", price: "3 400", unit: "DT", best: false, pct: 100 },
    ],
  },
  {
    name: "HP LaserJet Pro M404",
    spec: "38 ppm · Recto-verso · Réseau",
    category: "Imprimantes",
    tag: "PRO",
    savings: "85 DT",
    stores: [
      { name: "Tunisianet", price: "890", unit: "DT", best: true, pct: 70 },
      { name: "Mytek", price: "930", unit: "DT", best: false, pct: 82 },
      { name: "Spacenet", price: "950", unit: "DT", best: false, pct: 90 },
      { name: "TechnoPro", price: "975", unit: "DT", best: false, pct: 100 },
    ],
  },
  {
    name: "Dyson V15 Detect",
    spec: "Laser · 60 min · 240 AW",
    category: "Electroménager",
    tag: "TOP VENTE",
    savings: "175 DT",
    stores: [
      { name: "Géant", price: "1 850", unit: "DT", best: true, pct: 60 },
      { name: "Carrefour", price: "1 950", unit: "DT", best: false, pct: 75 },
      { name: "Mytek", price: "1 990", unit: "DT", best: false, pct: 88 },
      { name: "TechnoPro", price: "2 025", unit: "DT", best: false, pct: 100 },
    ],
  },
];

const fallbackHeroStats = [
  { value: "50K+", label: "Produits comparés" },
  { value: "10+", label: "Magasins indexés" },
  { value: "40%", label: "Économies possibles" },
];

const DURATION = 4500;

type HeroStore = {
  id?: string;
  name: string;
  meta?: string;
  price: string;
  unit: string;
  best: boolean;
  current?: boolean;
  pct: number;
};
type HeroProduct = {
  id?: string;
  name: string;
  spec: string;
  category: string;
  tag: string;
  savings: string;
  stores: HeroStore[];
  href?: string;
  ctaLabel?: string;
  backgroundImage?: string;
};

interface HeroSectionProps {
  products?: CatalogProduct[];
  stats?: Array<{ value: string; label: string }>;
  latestBlog?: BlogArticle | null;
}

function splitPrice(value: number) {
  const formatted = formatPrice(value);
  return { price: formatted.replace(" DT", ""), unit: "DT" };
}

function cleanText(value?: string | null) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function comparableText(value?: string | null) {
  return cleanText(value).toLowerCase();
}

function productSpec(product: CatalogProduct) {
  const description = cleanText(product.description);
  if (
    description &&
    comparableText(description) !== comparableText(product.name)
  )
    return description;
  return (
    [product.brand, productCategory(product)].filter(Boolean).join(" - ") ||
    "Produit compare depuis les donnees demo"
  );
}

function toHeroProduct(
  product: CatalogProduct,
  productPool: CatalogProduct[],
): HeroProduct {
  const currentPrice =
    product.bestPrice || sortedShopPrices(product)[0]?.price || 0;
  const alternatives = productPool
    .filter((item) => item.id !== product.id)
    .filter((item) => item.bestPrice > 0)
    .slice(0, 3);
  const comparisonProducts = [product, ...alternatives].slice(0, 4);
  const prices = comparisonProducts
    .map((item) => item.bestPrice || sortedShopPrices(item)[0]?.price || 0)
    .filter((price) => price > 0);
  const maxPrice = Math.max(...prices, currentPrice, 1);
  const minPrice = Math.min(...prices, currentPrice || maxPrice);
  const saving = Math.max(0, currentPrice - minPrice);

  return {
    id: product.id,
    name: product.name,
    spec: productSpec(product),
    category: productCategory(product),
    tag: product.inStock ? "EN STOCK" : "A SUIVRE",
    savings: formatPrice(saving),
    stores: comparisonProducts.map((item) => {
      const price = item.bestPrice || sortedShopPrices(item)[0]?.price || 0;
      const parts = splitPrice(price);
      return {
        id: item.id,
        name: item.name,
        meta: [item.brand, productCategory(item)].filter(Boolean).join(" - "),
        price: parts.price,
        unit: parts.unit,
        best: price === minPrice,
        current: item.id === product.id,
        pct:
          maxPrice > 0
            ? Math.max(28, Math.round((price / maxPrice) * 100))
            : 100,
      };
    }),
  };
}

function createHeroBlogCard(latestBlog?: BlogArticle | null): HeroProduct {
  const latestArticle = latestBlog || {
    ...articles[0],
    sections:
      articles[0]?.sections.map((section) => ({
        type: section.type,
        text: section.text ?? null,
        items: section.items ?? [],
      })) || [],
  };

  return {
    id: "hero-blog",
    name: latestArticle?.title || "Nouveau blog 1111.tn",
    spec:
      latestArticle?.desc ||
      "Guides, comparatifs et conseils pour acheter plus malin en Tunisie.",
    category: latestArticle?.category || "Blog",
    tag: "NOUVEAU",
    savings: "",
    href: "/blogs",
    ctaLabel: "Ouvrir le blog",
    backgroundImage: latestArticle?.img,
    stores: [
      {
        id: "blog-guide-1",
        name: latestArticle?.category || "Guides d'achat et comparatifs",
        meta: latestArticle?.date
          ? `${latestArticle.date} · ${latestArticle.read}`
          : "Retrouvez les meilleurs conseils du moment",
        price: "Voir",
        unit: "",
        best: true,
        current: true,
        pct: 100,
      },
    ],
  };
}

export default function HeroSection({
  products: apiProducts = [],
  stats,
  latestBlog = null,
}: HeroSectionProps) {
  const products = useMemo<HeroProduct[]>(
    () => [
      ...(apiProducts.length > 0
        ? apiProducts.map((product) => toHeroProduct(product, apiProducts))
        : fallbackHeroProducts),
      createHeroBlogCard(latestBlog),
    ],
    [apiProducts, latestBlog],
  );
  const heroStats = stats?.length ? stats : fallbackHeroStats;
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (current >= products.length) setCurrent(0);
  }, [current, products.length]);

  const goTo = (idx: number) => {
    setFading(true);
    setProgress(0);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 340);
  };

  useEffect(() => {
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    const step = 50;
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (step / DURATION) * 100, 100));
    }, step);

    timerRef.current = setTimeout(() => {
      goTo((current + 1) % products.length);
    }, DURATION);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current]);

  const p = products[current];

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(0);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const handle = setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const [retail, para] = await Promise.allSettled([
        searchProducts(q, 6, undefined, { signal: controller.signal }),
        searchParaProducts(q, 6, undefined, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      const merged: SearchHit[] = [];
      if (retail.status === "fulfilled") {
        merged.push(
          ...retail.value.map((r) => ({
            ...r,
            source: "retail" as CatalogSource,
          })),
        );
      }
      if (para.status === "fulfilled") {
        merged.push(
          ...para.value.map((r) => ({ ...r, source: "para" as CatalogSource })),
        );
      }
      merged.sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));
      setSearchResults(merged.slice(0, 8));
      setSearchHighlight(0);
      setSearchLoading(false);
    }, 280);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goToProduct = (hit: SearchHit) => {
    setSearchOpen(false);
    router.push(`/products/${encodeURIComponent(hit.id)}?source=${hit.source}`);
  };

  const openHeroCard = () => {
    if (!p.href) return;
    router.push(p.href);
  };

  const submitSearch = () => {
    if (searchResults.length > 0) {
      goToProduct(
        searchResults[Math.min(searchHighlight, searchResults.length - 1)],
      );
    }
  };

  return (
    <section className="slider" style={{ overflow: "hidden" }}>
      <style>{`
        .slider {
          position: relative;
          isolation: isolate;
        }
        .slider-inner {
          position: relative;
          z-index: 2;
        }
        .slider .title {
          font-size: clamp(2rem, 4vw, 3rem) !important;
          line-height: 1.15 !important;
        }
        .hero-ambient {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }
        .hero-ambient-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse at center, black 28%, transparent 78%);
          animation: hero-grid-drift 26s linear infinite;
        }
        .hero-ambient-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(46px);
          opacity: 0.48;
          will-change: transform, opacity;
        }
        .hero-ambient-blob.b1 {
          width: 380px;
          height: 380px;
          top: -120px;
          left: -90px;
          background: radial-gradient(circle, rgba(59,222,185,0.22) 0%, transparent 68%);
          animation: hero-blob-float-1 14s ease-in-out infinite;
        }
        .hero-ambient-blob.b2 {
          width: 320px;
          height: 320px;
          top: 16%;
          right: -70px;
          background: radial-gradient(circle, rgba(204,255,155,0.2) 0%, transparent 68%);
          animation: hero-blob-float-2 18s ease-in-out infinite;
        }
        .hero-ambient-blob.b3 {
          width: 300px;
          height: 300px;
          bottom: -120px;
          left: 40%;
          background: radial-gradient(circle, rgba(59,222,185,0.16) 0%, transparent 70%);
          animation: hero-blob-float-3 20s ease-in-out infinite;
        }
        [data-theme="light"] .hero-ambient-grid {
          background-image:
            linear-gradient(rgba(91,33,182,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91,33,182,0.1) 1px, transparent 1px);
          opacity: 0.68;
          mask-image: radial-gradient(ellipse at center, black 50%, transparent 85%);
        }
        [data-theme="light"] .hero-ambient-blob.b1 {
          width: 540px;
          height: 540px;
          top: -180px;
          left: -140px;
          background: radial-gradient(circle, rgba(91,33,182,0.34) 0%, rgba(124,58,237,0.18) 40%, transparent 68%);
          opacity: 0.74;
          filter: blur(62px);
        }
        [data-theme="light"] .hero-ambient-blob.b2 {
          width: 500px;
          height: 500px;
          top: 5%;
          right: -100px;
          background: radial-gradient(circle, rgba(167,139,250,0.38) 0%, rgba(124,58,237,0.2) 40%, transparent 68%);
          opacity: 0.7;
          filter: blur(58px);
        }
        [data-theme="light"] .hero-ambient-blob.b3 {
          width: 430px;
          height: 430px;
          bottom: -160px;
          left: 35%;
          background: radial-gradient(circle, rgba(109,40,217,0.28) 0%, rgba(91,33,182,0.16) 45%, transparent 70%);
          opacity: 0.66;
          filter: blur(64px);
        }
        /* Extra sparkle orb for light mode only */
        [data-theme="light"] .hero-ambient::after {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          top: 25%;
          left: 28%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,181,253,0.5) 0%, rgba(167,139,250,0.22) 50%, transparent 70%);
          filter: blur(60px);
          animation: hero-blob-float-2 22s ease-in-out infinite reverse;
          pointer-events: none;
        }
        @keyframes hero-grid-drift {
          0% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(-10px, -14px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes hero-blob-float-1 {
          0%,100% { transform: translate(0,0) scale(1); opacity: .45; }
          50% { transform: translate(24px, -12px) scale(1.08); opacity: .6; }
        }
        @keyframes hero-blob-float-2 {
          0%,100% { transform: translate(0,0) scale(1); opacity: .42; }
          50% { transform: translate(-26px, 16px) scale(1.1); opacity: .58; }
        }
        @keyframes hero-blob-float-3 {
          0%,100% { transform: translate(0,0) scale(1); opacity: .38; }
          50% { transform: translate(14px, -20px) scale(1.06); opacity: .54; }
        }
        @keyframes card-float {
          0%,100% { transform: translateY(0px);   }
          50%      { transform: translateY(-8px); }
        }
        .hero-price-card {
          background:
            radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%),
            linear-gradient(180deg, #0e1218 0%, #090c11 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          width: 420px;
          height: 540px;
          animation: card-float 7s ease-in-out infinite;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 1px 0 rgba(255,255,255,0.05) inset,
            0 30px 60px -20px rgba(0,0,0,0.75),
            0 0 0 1px rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
        }
        .hero-price-card.with-cover {
          background:
            linear-gradient(180deg, rgba(6,10,14,0.34) 0%, rgba(7,10,14,0.72) 40%, rgba(8,12,17,0.96) 100%),
            radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%),
            linear-gradient(180deg, #0e1218 0%, #090c11 100%);
          background-size: cover;
          background-position: center;
        }
        .hero-price-card.is-clickable {
          cursor: pointer;
        }
        .hero-price-card.is-clickable:hover {
          border-color: rgba(59,222,185,0.22);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.05) inset,
            0 34px 70px -22px rgba(0,0,0,0.8),
            0 0 0 1px rgba(59,222,185,0.08);
        }
        .hero-price-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
        }
        .hero-price-card::after {
          content: '';
          position: absolute;
          top: -140px; right: -120px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,222,185,0.05) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ── Card top bar ── */
        .hpc-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 0;
        }
        .hpc-live-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 5px 11px;
        }
        .hpc-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #3BDEB9;
          box-shadow: 0 0 6px rgba(59,222,185,0.6);
          animation: live-pulse 1.8s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes live-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.7); }
        }
        .hpc-live-text {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
        }
        .hpc-nav-dots {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .hpc-nav-dot {
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.12);
          cursor: pointer;
          border: none;
          padding: 0;
          transition: all 0.4s cubic-bezier(.4,0,.2,1);
          width: 14px;
        }
        .hpc-nav-dot.active {
          background: rgba(255,255,255,0.85);
          width: 22px;
        }

        /* ── Progress bar ── */
        .hpc-progress-track {
          margin: 14px 20px 0;
          height: 1px;
          border-radius: 1px;
          background: rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .hpc-progress-fill {
          height: 100%;
          border-radius: 1px;
          background: rgba(255,255,255,0.5);
          transition: width 0.05s linear;
        }

        /* ── Product header ── */
        .hpc-product-section {
          padding: 22px 20px 6px;
          transition: opacity 0.34s ease;
          opacity: 1;
        }
        .hpc-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .hpc-category-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
        }
        .hpc-tag {
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          padding: 3px 8px;
          border-radius: 3px;
        }
        .hpc-product-name {
          font-size: 21px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.4px;
          line-height: 1.25;
          margin-bottom: 4px;
        }
        .hpc-product-spec {
          display: none;
        }
        .hpc-product-spec.is-visible {
          display: block;
          margin-top: 8px;
          color: rgba(255,255,255,0.52);
          font-size: 12px;
          line-height: 1.7;
          max-width: 320px;
        }

        /* ── Divider ── */
        .hpc-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 18px 20px 16px;
        }

        /* ── Store rows ── */
        .hpc-stores {
          padding: 0 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          justify-content: flex-start;
          min-height: 220px;
          opacity: 1;
        }
        .hpc-store-row {
          position: relative;
          border-radius: 10px;
          padding: 14px 16px;
          min-height: 64px;
          overflow: hidden;
          transition: background 0.2s ease, border-color 0.2s ease;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .hpc-store-row:hover {
          background: rgba(255,255,255,0.035);
          border-color: rgba(255,255,255,0.09);
        }
        .hpc-store-row.best {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(59,222,185,0.22);
        }
        .hpc-store-row.best::after {
          content: '';
          position: absolute;
          left: 0; top: 14px; bottom: 14px;
          width: 2px;
          border-radius: 2px;
          background: #3BDEB9;
          box-shadow: 0 0 12px rgba(59,222,185,0.5);
        }
        .hpc-bar-bg { display: none; }
        .hpc-row-inner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
        }
        .hpc-rank { display: none; }
        .hpc-store-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          min-width: 0;
        }
        .hpc-store-name {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          min-width: 0;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.1px;
        }
        .hpc-store-row.best .hpc-store-name { color: #fff; font-weight: 600; }
        .hpc-product-meta { display: none; }
        .hpc-product-meta.is-visible {
          display: block;
          font-size: 10px;
          color: rgba(255,255,255,0.34);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .hpc-best-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          padding: 0;
          font-size: 9px;
          font-weight: 600;
          color: #3BDEB9;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .hpc-rank-badge.rank-2,
        .hpc-rank-badge.rank-3 {
          color: rgba(255,255,255,0.35);
          background: transparent;
          border: none;
          padding: 0;
        }
        .hpc-diff { display: none; }
        .hpc-price-group {
          display: flex;
          align-items: baseline;
          gap: 3px;
          flex-shrink: 0;
          min-width: 96px;
          justify-content: flex-end;
          text-align: right;
        }
        .hpc-price-num {
          font-size: 20px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: -0.7px;
          font-feature-settings: "tnum";
        }
        .hpc-price-unit {
          font-size: 10px;
          font-weight: 500;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.05em;
        }
        .hpc-store-row.best .hpc-price-num {
          color: #fff;
          font-weight: 700;
          font-size: 22px;
        }
        .hpc-store-row.best .hpc-price-unit {
          color: rgba(255,255,255,0.5);
        }
        .hpc-card-cta {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 18px;
          border-radius: 999px;
          border: 1px solid rgba(59,222,185,0.22);
          background: rgba(59,222,185,0.08);
          color: #d7ffeb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }
        .hero-price-card.is-clickable:hover .hpc-card-cta {
          background: rgba(59,222,185,0.14);
          border-color: rgba(59,222,185,0.38);
          color: #ffffff;
        }

        /* ─── Left panel ─── */
        .hero-stat-pill {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 14px 22px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 14px;
          gap: 2px;
        }
        .hero-stat-pill .stat-val {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
        }
        .hero-stat-pill .stat-lbl {
          font-size: 11px;
          color: rgba(255,255,255,0.50);
          white-space: nowrap;
        }
        .hero-trust-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
        }
        .hero-trust-row .check { color: #3BDEB9; }
        .hero-search-wrap {
          position: relative;
          margin-top: 28px;
          max-width: 480px;
        }
        .hero-search-bar {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 50px;
          padding: 6px 6px 6px 20px;
          max-width: 480px;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .hero-search-bar:focus-within {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.22);
        }
        .hero-search-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          right: 0;
          background: linear-gradient(180deg, #0e1218 0%, #090c11 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          box-shadow: 0 30px 60px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04);
          padding: 8px;
          max-height: 420px;
          overflow-y: auto;
          z-index: 60;
          animation: hsd-fadein 0.18s ease-out;
        }
        @keyframes hsd-fadein {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hsd-status {
          padding: 18px 16px;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          text-align: center;
          letter-spacing: 0.01em;
        }
        .hsd-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
          text-align: left;
          font-family: inherit;
          color: inherit;
        }
        .hsd-item.active,
        .hsd-item:hover {
          background: rgba(255,255,255,0.045);
          border-color: rgba(255,255,255,0.08);
        }
        .hsd-thumb {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .hsd-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
        }
        .hsd-thumb-fallback {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: rgba(255,255,255,0.1);
        }
        .hsd-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .hsd-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.1px;
        }
        .hsd-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hsd-source {
          font-weight: 600;
          letter-spacing: 0.04em;
        }
        .hsd-source-retail { color: rgba(255,255,255,0.6); }
        .hsd-source-para { color: #3BDEB9; }
        .hsd-out { color: #f97316; }
        .hsd-price {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.88);
          font-feature-settings: "tnum";
          flex-shrink: 0;
          letter-spacing: -0.2px;
        }
        .hero-search-bar input {
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 14px;
          flex: 1;
        }
        .hero-search-bar input::placeholder { color: rgba(255,255,255,0.35); }
        .hero-search-bar button {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50px;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          padding: 14px 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: all 0.22s ease;
        }
        .hero-compare-btn {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          animation: hero-compare-idle 2.8s ease-in-out infinite;
        }
        .hero-compare-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(115deg, rgba(59,222,185,0.2), rgba(204,255,155,0.15), rgba(59,222,185,0.2));
          opacity: 0;
          transform: scale(0.96);
          transition: opacity 0.28s ease, transform 0.28s ease;
          z-index: -1;
        }
        .hero-compare-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: -130%;
          width: 58%;
          height: 100%;
          background: linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.34) 50%, transparent 100%);
          transform: skewX(-20deg);
          pointer-events: none;
        }
        .hero-search-bar button:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 16px 30px rgba(0,0,0,0.34), 0 0 24px rgba(59,222,185,0.18);
          border-color: rgba(204,255,155,0.45);
        }
        @keyframes hero-compare-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-0.5px); }
        }
        /* ── Light mode: section background → pure white ── */
        [data-theme="light"] .slider {
          background: #ffffff !important;
        }
        [data-theme="light"] .item-1,
        [data-theme="light"] .item-circle-1,
        [data-theme="light"] .item-circle-2,
        [data-theme="light"] .item-circle-3 {
          opacity: 0 !important;
        }

        /* ── Light mode: left panel text ── */
        [data-theme="light"] .slider .title,
        [data-theme="light"] .slider h1,
        [data-theme="light"] .slider h2 { color: #0f172a !important; }
        [data-theme="light"] .slider p.text { color: rgba(15,23,42,0.65) !important; }
        [data-theme="light"] .slider .box-tag {
          background: rgba(255,255,255,0.96) !important;
          border: 1px solid rgba(91,33,182,0.3) !important;
          box-shadow: 0 8px 20px rgba(91,33,182,0.16) !important;
        }
        [data-theme="light"] .slider .box-tag::before {
          background: linear-gradient(294.64deg, #5B21B6 0%, #7C3AED 50%, #A78BFA 100%) !important;
          opacity: 0.95;
        }
        [data-theme="light"] .slider .box-tag::after {
          background: #ffffff !important;
        }
        [data-theme="light"] .slider .box-tag .text-gradient.style-2 {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          background: none !important;
          -webkit-background-clip: initial !important;
          background-clip: initial !important;
          font-weight: 800 !important;
        }
        [data-theme="light"] .slider .box-tag svg path {
          fill: #000000 !important;
        }
        [data-theme="light"] .slider .box-tag .eff::after {
          background-image: linear-gradient(90deg, transparent, rgba(0,0,0,0.75), transparent) !important;
        }
        [data-theme="light"] .hero-trust-row { color: rgba(15,23,42,0.6) !important; }
        [data-theme="light"] .hero-trust-row .check { color: #5B21B6 !important; }

        /* ── stat pills: glass purple ── */
        [data-theme="light"] .hero-stat-pill {
          background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(237,233,254,0.85)) !important;
          border: 1.5px solid rgba(91,33,182,0.22) !important;
          box-shadow: 0 4px 20px rgba(91,33,182,0.12), inset 0 1px 0 rgba(255,255,255,0.9) !important;
          backdrop-filter: blur(8px) !important;
        }
        [data-theme="light"] .hero-stat-pill .stat-val {
          color: #3B0764 !important;
          font-weight: 900 !important;
        }
        [data-theme="light"] .hero-stat-pill .stat-lbl { color: rgba(91,33,182,0.65) !important; }

        /* ── search wrap glow ── */
        [data-theme="light"] .hero-search-wrap { position: relative; }
        [data-theme="light"] .hero-search-wrap::before {
          content: "";
          position: absolute;
          inset: -10px;
          border-radius: 30px;
          background: radial-gradient(ellipse at 30% 50%, rgba(91,33,182,0.18), transparent 70%);
          pointer-events: none;
          z-index: 0;
          filter: blur(18px);
        }

        /* ── search bar: frosted glass ── */
        [data-theme="light"] .hero-search-bar {
          position: relative;
          z-index: 1;
          background: linear-gradient(145deg, rgba(255,255,255,0.97), rgba(245,243,255,0.94)) !important;
          border: 1.5px solid rgba(91,33,182,0.25) !important;
          box-shadow:
            0 8px 32px rgba(91,33,182,0.14),
            0 2px 8px rgba(91,33,182,0.08),
            inset 0 1px 0 rgba(255,255,255,1) !important;
          backdrop-filter: blur(12px) !important;
        }
        [data-theme="light"] .hero-search-bar:focus-within {
          border-color: rgba(91,33,182,0.5) !important;
          box-shadow:
            0 12px 40px rgba(91,33,182,0.2),
            0 0 0 4px rgba(91,33,182,0.08),
            inset 0 1px 0 rgba(255,255,255,1) !important;
        }
        [data-theme="light"] .hero-search-bar input {
          background: transparent !important;
          color: #0f172a !important;
          border: none !important;
        }
        [data-theme="light"] .hero-search-bar input::placeholder { color: rgba(91,33,182,0.4) !important; }

        /* ── compare button: solid purple gradient ── */
        [data-theme="light"] .hero-compare-btn {
          background: linear-gradient(135deg, #8a74bd 0%, #a896ce 52%, #c0b2dc 100%) !important;
          color: #ffffff !important;
          border: 1px solid rgba(109,75,176,0.26) !important;
          box-shadow: 0 6px 16px rgba(91,33,182,0.16), 0 1px 5px rgba(91,33,182,0.1) !important;
        }
        [data-theme="light"] .hero-compare-btn:hover {
          background: linear-gradient(135deg, #816ab5 0%, #9c87c8 52%, #b6a6d8 100%) !important;
          box-shadow: 0 8px 20px rgba(91,33,182,0.2), 0 2px 8px rgba(91,33,182,0.12) !important;
          transform: translateY(-1px) scale(1.005) !important;
        }

        /* ── price card: frosted glass with purple accent border ── */
        [data-theme="light"] .hero-price-card {
          background: linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(245,243,255,0.96) 100%) !important;
          border: 1.5px solid rgba(91,33,182,0.2) !important;
          box-shadow:
            0 24px 64px rgba(91,33,182,0.16),
            0 8px 24px rgba(91,33,182,0.1),
            inset 0 1px 0 rgba(255,255,255,1) !important;
          backdrop-filter: blur(20px) !important;
        }
        [data-theme="light"] .hero-price-card::before {
          background: linear-gradient(90deg, transparent, rgba(91,33,182,0.35), transparent) !important;
        }
        [data-theme="light"] .hero-price-card::after {
          background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 65%) !important;
        }

        /* card internals */
        [data-theme="light"] .hpc-live-pill {
          background: linear-gradient(135deg, rgba(91,33,182,0.1), rgba(124,58,237,0.06)) !important;
          border: 1px solid rgba(91,33,182,0.28) !important;
        }
        [data-theme="light"] .hpc-live-dot {
          background: #7C3AED !important;
          box-shadow: 0 0 8px rgba(124,58,237,0.7) !important;
        }
        [data-theme="light"] .hpc-live-text { color: #5B21B6 !important; font-weight: 700 !important; }
        [data-theme="light"] .hpc-nav-dot { background: rgba(91,33,182,0.18) !important; }
        [data-theme="light"] .hpc-nav-dot.active { background: #5B21B6 !important; width: 22px !important; }
        [data-theme="light"] .hpc-progress-track { background: rgba(91,33,182,0.1) !important; }
        [data-theme="light"] .hpc-progress-fill {
          background: linear-gradient(90deg, #5B21B6, #8B5CF6) !important;
        }
        [data-theme="light"] .hpc-category-label { color: rgba(91,33,182,0.7) !important; letter-spacing: 0.2em !important; }
        [data-theme="light"] .hpc-tag {
          background: linear-gradient(135deg, rgba(91,33,182,0.1), rgba(124,58,237,0.06)) !important;
          border: 1px solid rgba(91,33,182,0.25) !important;
          color: #5B21B6 !important;
          font-weight: 700 !important;
        }
        [data-theme="light"] .hpc-product-name { color: #0f172a !important; font-weight: 700 !important; }
        [data-theme="light"] .hpc-product-spec { color: rgba(15,23,42,0.6) !important; }
        [data-theme="light"] .hpc-divider {
          background: linear-gradient(90deg, transparent, rgba(91,33,182,0.15), transparent) !important;
          height: 1px !important;
        }

        /* store rows */
        [data-theme="light"] .hpc-store-row {
          background: rgba(255,255,255,0.7) !important;
          border: 1px solid rgba(91,33,182,0.1) !important;
          box-shadow: 0 2px 8px rgba(91,33,182,0.05) !important;
        }
        [data-theme="light"] .hpc-store-row:hover {
          background: rgba(237,233,254,0.6) !important;
          border-color: rgba(91,33,182,0.2) !important;
        }
        [data-theme="light"] .hpc-store-row.best {
          background: linear-gradient(135deg, rgba(91,33,182,0.1), rgba(124,58,237,0.06)) !important;
          border: 1.5px solid rgba(91,33,182,0.32) !important;
          box-shadow: 0 4px 16px rgba(91,33,182,0.12) !important;
        }
        [data-theme="light"] .hpc-store-row.best::after {
          background: linear-gradient(180deg, #5B21B6, #8B5CF6) !important;
          box-shadow: 0 0 12px rgba(91,33,182,0.55) !important;
        }
        [data-theme="light"] .hpc-store-row .hpc-store-name { color: rgba(15,23,42,0.6) !important; }
        [data-theme="light"] .hpc-store-row.best .hpc-store-name { color: #1e1b4b !important; font-weight: 700 !important; }
        [data-theme="light"] .hpc-price-num { color: rgba(15,23,42,0.6) !important; }
        [data-theme="light"] .hpc-price-unit { color: rgba(15,23,42,0.38) !important; }
        [data-theme="light"] .hpc-store-row.best .hpc-price-num { color: #1e1b4b !important; font-weight: 800 !important; }
        [data-theme="light"] .hpc-store-row.best .hpc-price-unit { color: rgba(91,33,182,0.6) !important; }
        [data-theme="light"] .hpc-best-badge { color: #5B21B6 !important; font-weight: 700 !important; }
        [data-theme="light"] .hpc-rank-badge.rank-2,
        [data-theme="light"] .hpc-rank-badge.rank-3 { color: rgba(15,23,42,0.3) !important; }
        [data-theme="light"] .hpc-product-meta { color: rgba(91,33,182,0.5) !important; }
        [data-theme="light"] .hpc-card-cta {
          background: linear-gradient(135deg, rgba(91,33,182,0.1), rgba(124,58,237,0.07)) !important;
          border: 1.5px solid rgba(91,33,182,0.28) !important;
          color: #5B21B6 !important;
          font-weight: 800 !important;
          box-shadow: 0 4px 16px rgba(91,33,182,0.1) !important;
        }

        /* search dropdown: glass */
        [data-theme="light"] .hero-search-dropdown {
          background: linear-gradient(160deg, rgba(255,255,255,0.98), rgba(245,243,255,0.96)) !important;
          border: 1.5px solid rgba(91,33,182,0.18) !important;
          box-shadow: 0 24px 60px rgba(91,33,182,0.18), 0 8px 20px rgba(91,33,182,0.1) !important;
          backdrop-filter: blur(16px) !important;
        }
        [data-theme="light"] .hsd-name { color: #0f172a !important; font-weight: 600 !important; }
        [data-theme="light"] .hsd-meta { color: rgba(15,23,42,0.5) !important; }
        [data-theme="light"] .hsd-source-retail { color: rgba(15,23,42,0.55) !important; }
        [data-theme="light"] .hsd-source-para { color: #5B21B6 !important; }
        [data-theme="light"] .hsd-price { color: #1e1b4b !important; font-weight: 700 !important; }
        [data-theme="light"] .hsd-status { color: rgba(91,33,182,0.5) !important; }
        [data-theme="light"] .hsd-item:hover,
        [data-theme="light"] .hsd-item.active {
          background: linear-gradient(135deg, rgba(91,33,182,0.07), rgba(124,58,237,0.04)) !important;
          border-color: rgba(91,33,182,0.18) !important;
        }
        [data-theme="light"] .hsd-thumb {
          background: rgba(91,33,182,0.06) !important;
          border-color: rgba(91,33,182,0.12) !important;
        }

        .hero-compare-btn:hover::before {
          opacity: 1;
          transform: scale(1);
        }
        .hero-compare-btn:hover::after {
          animation: hero-compare-sweep 0.72s ease-out;
        }
        @keyframes hero-compare-sweep {
          from { left: -130%; }
          to { left: 160%; }
        }
        @media (max-width: 991px) {
          .hero-right-panel { display: none !important; }
          .hero-search-bar  { max-width: 100%; }
        }
        @media (max-width: 767px) {
          .slider .slider-inner { padding: 48px 15px 64px !important; gap: 24px !important; }
          .slider .inner-content { padding-top: 0 !important; padding-left: 0 !important; }
          .hero-search-bar { padding: 6px !important; border-radius: 18px !important; flex-direction: column; gap: 8px !important; align-items: stretch !important; }
          .hero-search-bar input { min-height: 42px; padding: 0 10px !important; }
          .hero-search-bar button { justify-content: center; width: 100%; }
          .hero-trust-row { flex-wrap: wrap; row-gap: 6px; }
        }
      `}</style>

      <div className="hero-ambient" aria-hidden="true">
        <div className="hero-ambient-grid" />
        <div className="hero-ambient-blob b1" />
        <div className="hero-ambient-blob b2" />
        <div className="hero-ambient-blob b3" />
      </div>
      <img
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="item-1 item-circle-2"
        src="/images/item/item-circle-blur.webp"
        alt=""
      />
      <img
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="item-circle-1"
        src="/images/item/item-circle.webp"
        alt=""
      />
      <img
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="item-circle-3"
        src="/images/item/item-circle.webp"
        alt=""
      />

      <div
        className="slider-inner"
        style={{ alignItems: "center", gap: "48px" }}
      >
        {/* ── Left ── */}
        <div className="inner-content" style={{ flex: "1 1 0", minWidth: 0 }}>
          <div className="sub-title box-tag wow fadeInUp">
            <SparkleIcon />
            <span className="text-gradient style-2">
              Tunisie · Comparateur #1
            </span>
            <span className="eff"></span>
          </div>

          <div className="title wow fadeInUp" data-wow-delay="0.1s">
            Comparez les prix,
            <br />
            <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
              <span className="cd-words-wrapper">
                <span className="item-text is-visible">
                  <i className="in">é</i>
                  <i className="in">c</i>
                  <i className="in">o</i>
                  <i className="in">n</i>
                  <i className="in">o</i>
                  <i className="in">m</i>
                  <i className="in">i</i>
                  <i className="in">s</i>
                  <i className="in">e</i>
                  <i className="in">z</i>
                </span>
                <span className="item-text is-hidden">
                  <i className="out">é</i>
                  <i className="out">c</i>
                  <i className="out">o</i>
                  <i className="out">n</i>
                  <i className="out">o</i>
                  <i className="out">m</i>
                  <i className="out">i</i>
                  <i className="out">s</i>
                  <i className="out">e</i>
                  <i className="out">z</i>
                </span>
                <span className="item-text is-hidden">
                  <i className="in">é</i>
                  <i className="in">c</i>
                  <i className="in">o</i>
                  <i className="in">n</i>
                  <i className="in">o</i>
                  <i className="in">m</i>
                  <i className="in">i</i>
                  <i className="in">s</i>
                  <i className="in">e</i>
                  <i className="in">z</i>
                </span>
              </span>
            </span>{" "}
            vraiment.
          </div>

          <p className="text wow fadeInUp" data-wow-delay="0.2s">
            50 000+ produits. 10+ magasins. Des prix transparents en temps réel.
            <br />
            On dévoile les vrais prix — et les mensonges.
          </p>

          <div
            className="hero-search-wrap wow fadeInUp"
            data-wow-delay="0.25s"
            ref={searchWrapRef}
          >
            <div className="hero-search-bar">
              <input
                type="text"
                placeholder="Rechercher un produit, une marque…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitSearch();
                  } else if (e.key === "Escape") {
                    setSearchOpen(false);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSearchOpen(true);
                    setSearchHighlight((h) =>
                      Math.min(h + 1, Math.max(searchResults.length - 1, 0)),
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSearchHighlight((h) => Math.max(h - 1, 0));
                  }
                }}
                aria-autocomplete="list"
                aria-expanded={searchOpen}
              />
              <button
                type="button"
                className="hero-compare-btn"
                onClick={submitSearch}
              >
                <ArrowRightIcon /> Comparer
              </button>
            </div>
            {searchOpen && searchQuery.trim().length >= 2 && (
              <div className="hero-search-dropdown" role="listbox">
                {searchLoading && searchResults.length === 0 && (
                  <div className="hsd-status">Recherche en cours…</div>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="hsd-status">
                    Aucun produit trouvé pour « {searchQuery.trim()} »
                  </div>
                )}
                {searchResults.map((hit, i) => (
                  <button
                    key={`${hit.source}:${hit.id}`}
                    type="button"
                    role="option"
                    aria-selected={i === searchHighlight}
                    className={`hsd-item${i === searchHighlight ? " active" : ""}`}
                    onMouseEnter={() => setSearchHighlight(i)}
                    onClick={() => goToProduct(hit)}
                  >
                    <div className="hsd-thumb">
                      {hit.image ? (
                        <img
                          src={hit.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          sizes="56px"
                        />
                      ) : (
                        <span className="hsd-thumb-fallback" />
                      )}
                    </div>
                    <div className="hsd-info">
                      <span className="hsd-name">{hit.name}</span>
                      <span className="hsd-meta">
                        {hit.brand && <>{hit.brand} · </>}
                        <span className={`hsd-source hsd-source-${hit.source}`}>
                          {hit.source === "para"
                            ? "Parapharmacie"
                            : "Électroménager"}
                        </span>
                        {!hit.inStock && (
                          <span className="hsd-out"> · Rupture</span>
                        )}
                      </span>
                    </div>
                    <div className="hsd-price">
                      {hit.bestPrice > 0 ? formatPrice(hit.bestPrice) : "—"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hero-trust-row wow fadeInUp" data-wow-delay="0.3s">
            <span className="check">
              <CheckIcon />
            </span>{" "}
            Gratuit
            <span style={{ margin: "0 6px", opacity: 0.3 }}>·</span>
            <span className="check">
              <CheckIcon />
            </span>{" "}
            Sans inscription
            <span style={{ margin: "0 6px", opacity: 0.3 }}>·</span>
            <span className="check">
              <CheckIcon />
            </span>{" "}
            Mis à jour en temps réel
          </div>

          <div
            className="wow fadeInUp"
            data-wow-delay="0.4s"
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "32px",
            }}
          >
            {heroStats.map((s, index) => (
              <div
                key={`${s.label}-${s.value}-${index}`}
                className="hero-stat-pill"
              >
                <span className="stat-val">{s.value}</span>
                <span className="stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Price Card ── */}
        <div
          className="hero-right-panel wow fadeInUp"
          data-wow-delay="0.2s"
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translateX(-90px)",
          }}
        >
          <div
            className={`hero-price-card${p.href ? " is-clickable" : ""}${p.backgroundImage ? " with-cover" : ""}`}
            style={
              p.backgroundImage
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(6,10,14,0.34) 0%, rgba(7,10,14,0.72) 40%, rgba(8,12,17,0.96) 100%), url(${p.backgroundImage})`,
                  }
                : undefined
            }
            onClick={p.href ? openHeroCard : undefined}
            role={p.href ? "link" : undefined}
            tabIndex={p.href ? 0 : undefined}
            onKeyDown={
              p.href
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openHeroCard();
                    }
                  }
                : undefined
            }
          >
            {/* Top bar */}
            <div className="hpc-topbar">
              <div className="hpc-live-pill">
                <span className="hpc-live-dot" />
                <span className="hpc-live-text">En direct</span>
              </div>
              <div className="hpc-nav-dots">
                {products.map((_, i) => (
                  <button
                    key={i}
                    className={`hpc-nav-dot${i === current ? " active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      goTo(i);
                    }}
                    aria-label={`Produit ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Auto-progress bar */}
            <div className="hpc-progress-track">
              <div
                className="hpc-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Product info */}
            <div
              className="hpc-product-section"
              style={{ opacity: fading ? 0 : 1 }}
            >
              <div className="hpc-meta">
                <span className="hpc-category-label">{p.category}</span>
                <span className="hpc-tag">{p.tag}</span>
              </div>
              <div className="hpc-product-name">{p.name}</div>
              <div className={`hpc-product-spec${p.href ? " is-visible" : ""}`}>
                {p.spec}
              </div>
            </div>

            <div className="hpc-divider" />

            {/* Product comparison rows */}
            <div
              className="hpc-stores"
              style={{
                opacity: fading ? 0 : 1,
                transition: "opacity 0.34s ease",
                paddingBottom: p.href ? "82px" : "20px",
              }}
            >
              {p.stores.slice(0, p.href ? 1 : 3).map((s, i) => {
                return (
                  <div
                    key={s.id || s.name}
                    className={`hpc-store-row${s.current ? " best" : ""}`}
                  >
                    <div
                      className="hpc-bar-bg"
                      style={{ width: `${s.pct}%` }}
                    />
                    <div className="hpc-row-inner">
                      <div className="hpc-store-info">
                        <span className="hpc-store-name">{s.name}</span>
                        <span
                          className={`hpc-product-meta${p.href ? " is-visible" : ""}`}
                        >
                          {s.meta}
                        </span>
                        {i === 0 && (
                          <span className="hpc-best-badge hpc-rank-badge rank-1">
                            <TrophyIcon /> Meilleur prix
                          </span>
                        )}
                        {i === 1 && (
                          <span className="hpc-best-badge hpc-rank-badge rank-2">
                            Deuxieme choix
                          </span>
                        )}
                        {i === 2 && (
                          <span className="hpc-best-badge hpc-rank-badge rank-3">
                            Troisieme choix
                          </span>
                        )}
                      </div>
                      <div className="hpc-price-group">
                        <span className="hpc-price-num">{s.price}</span>
                        <span className="hpc-price-unit">{s.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {p.href && (
              <div className="hpc-card-cta">
                <ArrowRightIcon />
                {p.ctaLabel || "Ouvrir"}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
