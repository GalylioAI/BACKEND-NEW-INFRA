"use client";

import { Check, ChevronLeft, ChevronRight, X, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  enrichCatalogProductImages,
  listProducts,
} from "../lib/demo-data/catalog";
import type { CatalogProduct } from "../lib/demo-data/types";
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
import { ApplianceLightShowcase } from "./ApplianceLightShowcase";
import { LavageShowcaseSection } from "./LavageShowcaseSection";

/* ── Theme — reactive to data-theme="light" ─── */
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
        tealMid: "#7C3AED",
        lime: "#A78BFA",
        bg: "#f0f2ef",
        card: "#ffffff",
        cardBorder: "rgba(0,0,0,0.1)",
        border: "rgba(0,0,0,0.12)",
        muted: "rgba(0,0,0,0.45)",
        text: "#0a0f0d",
        textSoft: "rgba(0,0,0,0.72)",
        price: "#5B21B6",
        ctaText: "#ffffff",
        rowBest: "rgba(91,33,182,0.07)",
        rowBestBorder: "rgba(91,33,182,0.25)",
        rowOther: "rgba(0,0,0,0.02)",
        bannerBg: "#e8eae6",
        chipInactiveBg: "rgba(0,0,0,0.04)",
        glow: "rgba(91,33,182,0.08)",
      }
    : {
        teal: "#3BDEB9",
        tealMid: "#77E590",
        lime: "#CCFF9B",
        bg: "#000000",
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
        bannerBg: "#000000",
        chipInactiveBg: "rgba(255,255,255,0.04)",
        glow: "rgba(59,222,185,0.14)",
      };
}

export type TrendingStore = {
  name: string;
  dot: string;
  price: string;
  best: boolean;
};
export type TrendingProduct = {
  id: string;
  brand: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  inStock: boolean;
  stores: TrendingStore[];
  href?: string;
};
export type TrendingCat = {
  label: string;
  bannerImg: string;
  bannerTitle: string;
  products: TrendingProduct[];
};

type Store = TrendingStore;
type Product = TrendingProduct;
type Cat = TrendingCat;
type TrendingCategoryData = { label: string; products: CatalogProduct[] };

interface TrendingSectionProps {
  categories?: TrendingCategoryData[];
}

function buildImageCandidates(primary: string, fallback: string) {
  const candidates = [
    primary,
    `/images/item-cart.png ""))}&w=900&fit=inside`,
    fallback,
    "/images/item/cart-frame.jpg",
    "/images/item-cart.png",
  ];
  return [...new Set(candidates)];
}

/* ── Fallback catalog (same structure as before) ───────────────────── */
const fallbackTrendCats: Cat[] = [
  {
    label: "Imprimante",
    bannerImg: "/images/item-cart.png",
    bannerTitle: "Imprimantes",
    products: [
      {
        id: "p1",
        brand: "BROTHER",
        name: "Imprimante Multifonction 3-en-1 Laser monochrome DCP-L5500DN",
        price: "1755 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "1755 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1779 DT", best: false },
        ],
      },
      {
        id: "p2",
        brand: "CANON",
        name: "Imprimante Lazer Multifonction Cannon I-Sensys MF655CDW Couleur",
        price: "1084 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Jumbo", dot: "#9ca3af", price: "1084 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "1089 DT", best: false },
          { name: "Technopro", dot: "#3b82f6", price: "1219 DT", best: false },
        ],
      },
      {
        id: "p3",
        brand: "CANON",
        name: "Imprimante CANON PIXMA G3430 Réservoir Intégré WiFi - Pink",
        price: "669 DT",
        originalPrice: "699 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "669 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "669 DT", best: true },
        ],
      },
      {
        id: "p4",
        brand: "CANON",
        name: "Traceur Canon imagePROGRAF TM-350/355",
        price: "4709 DT",
        originalPrice: "4799 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "4709 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "4709 DT", best: false },
        ],
      },
      {
        id: "p5",
        brand: "HP",
        name: "Imprimante Monochrome HP LaserJet Pro 4003DN Réseau",
        price: "699 DT",
        originalPrice: "735 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "699 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "699 DT", best: false },
          { name: "Tunisianet", dot: "#f97316", price: "699 DT", best: true },
        ],
      },
      {
        id: "p6",
        brand: "CANON",
        name: "Imprimante Canon Pixma G-3420 Réservoir Intégré Multifonction Wifi",
        price: "545 DT",
        image: "/images/item-cart.png",
        inStock: false,
        stores: [
          { name: "Zoom", dot: "#9ca3af", price: "545 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "605 DT", best: false },
        ],
      },
      {
        id: "p7",
        brand: "BROTHER",
        name: "IMPRIMANTE BROTHER MULTIFONCTION A3 J5955DW",
        price: "1579 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "1579 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1579 DT", best: true },
        ],
      },
      {
        id: "p8",
        brand: "EPSON",
        name: "Imprimante Jet Encre Epson M5299 Workforce Pro Wifi",
        price: "1175 DT",
        originalPrice: "1225 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Technopro", dot: "#3b82f6", price: "1175 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1599 DT", best: false },
          { name: "Spacenet", dot: "#2563eb", price: "1799 DT", best: false },
        ],
      },
      {
        id: "p9",
        brand: "KYOCERA",
        name: "Imprimante KYOCERA ECOSYS MA2100CFX multifonction Laser Couleur",
        price: "1069 DT",
        originalPrice: "1199 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1069 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "1069 DT", best: false },
          { name: "Technopro", dot: "#3b82f6", price: "1099 DT", best: false },
        ],
      },
    ],
  },
  {
    label: "PC de Bureau",
    bannerImg: "/images/bureau.jpg",
    bannerTitle: "PC de Bureau",
    products: [
      {
        id: "d1",
        brand: "DELL",
        name: "PC de Bureau Dell OptiPlex 3000 Core i5-12500T 8Go 256Go SSD",
        price: "1399 DT",
        originalPrice: "1499 DT",
        image: "/images/laptops-informatique.webp",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1399 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "1450 DT", best: false },
        ],
      },
      {
        id: "d2",
        brand: "HP",
        name: "PC de Bureau HP ProDesk 400 G9 Core i5-12500 8Go 512Go SSD",
        price: "1649 DT",
        image: "/images/laptops-informatique.webp",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "1649 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1699 DT", best: false },
        ],
      },
      {
        id: "d3",
        brand: "LENOVO",
        name: "PC de Bureau Lenovo ThinkCentre M70q Gen3 Core i5 8Go 256Go SSD",
        price: "1299 DT",
        originalPrice: "1399 DT",
        image: "/images/laptops-informatique.webp",
        inStock: false,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "1299 DT", best: true },
          { name: "Mytek", dot: "#ef4444", price: "1350 DT", best: false },
        ],
      },
      {
        id: "d4",
        brand: "ASUS",
        name: "PC de Bureau ASUS ExpertCenter D500SC Core i5-10400 8Go 512Go SSD",
        price: "1199 DT",
        image: "/images/laptops-informatique.webp",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1199 DT", best: true },
          { name: "Technopro", dot: "#3b82f6", price: "1249 DT", best: false },
        ],
      },
      {
        id: "d5",
        brand: "HP",
        name: "PC de Bureau HP EliteDesk 800 G9 Core i7-12700 16Go 512Go SSD",
        price: "2199 DT",
        originalPrice: "2399 DT",
        image: "/images/laptops-informatique.webp",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "2199 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "2249 DT", best: false },
        ],
      },
      {
        id: "d6",
        brand: "DELL",
        name: "PC de Bureau Dell Inspiron 3910 Core i5-12400 16Go 1To HDD",
        price: "1549 DT",
        image: "/images/laptops-informatique.webp",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "1549 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1599 DT", best: false },
        ],
      },
      {
        id: "d7",
        brand: "LENOVO",
        name: "PC de Bureau Lenovo IdeaCentre 5 Core i7-12700 16Go 512Go SSD",
        price: "1899 DT",
        originalPrice: "1999 DT",
        image: "/images/laptops-informatique.webp",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "1899 DT", best: true },
          { name: "Technopro", dot: "#3b82f6", price: "1949 DT", best: false },
        ],
      },
      {
        id: "d8",
        brand: "ACER",
        name: "PC de Bureau Acer Aspire TC-1760 Core i5-12400 8Go 512Go SSD",
        price: "1099 DT",
        originalPrice: "1199 DT",
        image: "/images/laptops-informatique.webp",
        inStock: true,
        stores: [
          { name: "Jumbo", dot: "#9ca3af", price: "1099 DT", best: true },
          { name: "Mytek", dot: "#ef4444", price: "1149 DT", best: false },
        ],
      },
    ],
  },
  {
    label: "Pc Portable",
    bannerImg: "/images/item-cart.png",
    bannerTitle: "Pc Portables",
    products: [
      {
        id: "l1",
        brand: "LENOVO",
        name: "PC Portable Lenovo IdeaPad 3 15IAU7 Core i5-1235U 8Go 512Go SSD",
        price: "1399 DT",
        originalPrice: "1549 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1399 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "1449 DT", best: false },
        ],
      },
      {
        id: "l2",
        brand: "HP",
        name: "PC Portable HP 15s-fq5040nk Core i7-1255U 16Go 512Go SSD",
        price: "1849 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "1849 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1899 DT", best: false },
        ],
      },
      {
        id: "l3",
        brand: "DELL",
        name: "PC Portable Dell Inspiron 15 3525 Ryzen 5 5625U 8Go 512Go SSD",
        price: "1599 DT",
        originalPrice: "1699 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "1599 DT", best: true },
          { name: "Mytek", dot: "#ef4444", price: "1649 DT", best: false },
        ],
      },
      {
        id: "l4",
        brand: "ACER",
        name: "PC Portable Acer Aspire 3 A315-59 Core i5-1235U 8Go 512Go SSD",
        price: "1249 DT",
        originalPrice: "1349 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Jumbo", dot: "#9ca3af", price: "1249 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "1299 DT", best: false },
        ],
      },
      {
        id: "l5",
        brand: "ASUS",
        name: "PC Portable ASUS VivoBook 15 Core i5-1235U 8Go 512Go SSD",
        price: "1349 DT",
        originalPrice: "1449 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1349 DT", best: true },
          { name: "Technopro", dot: "#3b82f6", price: "1399 DT", best: false },
        ],
      },
      {
        id: "l6",
        brand: "LENOVO",
        name: "PC Portable Lenovo ThinkPad E15 Core i7-1255U 16Go 512Go SSD",
        price: "2299 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "2299 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "2349 DT", best: false },
        ],
      },
      {
        id: "l7",
        brand: "HP",
        name: "PC Portable HP EliteBook 840 G9 Core i7-1255U 16Go 512Go SSD",
        price: "2749 DT",
        originalPrice: "2899 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "2749 DT", best: true },
          { name: "Mytek", dot: "#ef4444", price: "2799 DT", best: false },
        ],
      },
      {
        id: "l8",
        brand: "DELL",
        name: "PC Portable Dell XPS 15 9520 Core i7-12700H 16Go 512Go SSD",
        price: "3499 DT",
        originalPrice: "3699 DT",
        image: "/images/item-cart.png",
        inStock: false,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "3499 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "3599 DT", best: false },
        ],
      },
    ],
  },
  {
    label: "Réfrigérateur",
    bannerImg: "/images/item-cart.png",
    bannerTitle: "Réfrigérateurs",
    products: [
      {
        id: "r1",
        brand: "SAMSUNG",
        name: "Réfrigérateur Samsung Twin Cooling Plus 385L No Frost Inox",
        price: "2199 DT",
        originalPrice: "2399 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "2199 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "2249 DT", best: false },
        ],
      },
      {
        id: "r2",
        brand: "LG",
        name: "Réfrigérateur LG Door-in-Door 660L Inox GC-X247CSAV",
        price: "3499 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "3499 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "3599 DT", best: false },
        ],
      },
      {
        id: "r3",
        brand: "BEKO",
        name: "Réfrigérateur Beko RDNE455E20DZX 3 Portes No Frost 430L",
        price: "1699 DT",
        originalPrice: "1849 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "1699 DT", best: true },
          { name: "Technopro", dot: "#3b82f6", price: "1749 DT", best: false },
        ],
      },
      {
        id: "r4",
        brand: "WHIRLPOOL",
        name: "Réfrigérateur Whirlpool W7 921I OX Side by Side 594L Inox",
        price: "3199 DT",
        image: "/images/item-cart.png",
        inStock: false,
        stores: [
          { name: "Jumbo", dot: "#9ca3af", price: "3199 DT", best: true },
          { name: "Mytek", dot: "#ef4444", price: "3299 DT", best: false },
        ],
      },
      {
        id: "r5",
        brand: "SAMSUNG",
        name: "Réfrigérateur Samsung Side by Side 617L No Frost RS68A884CSL",
        price: "3899 DT",
        originalPrice: "4199 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "3899 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "3999 DT", best: false },
        ],
      },
      {
        id: "r6",
        brand: "HISENSE",
        name: "Réfrigérateur Hisense 2 Portes No Frost 331L RT422N4ACF",
        price: "1299 DT",
        originalPrice: "1399 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "1299 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1349 DT", best: false },
        ],
      },
      {
        id: "r7",
        brand: "LG",
        name: "Réfrigérateur LG 2 Portes No Frost 384L Multi Air Flow",
        price: "2099 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "2099 DT", best: true },
          { name: "Technopro", dot: "#3b82f6", price: "2149 DT", best: false },
        ],
      },
      {
        id: "r8",
        brand: "BEKO",
        name: "Réfrigérateur Beko B3RCNA365HXBR 2 Portes No Frost 335L",
        price: "1499 DT",
        originalPrice: "1599 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1499 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "1549 DT", best: false },
        ],
      },
    ],
  },
  {
    label: "Machine à Laver",
    bannerImg: "/images/item-cart.png",
    bannerTitle: "Machines à Laver",
    products: [
      {
        id: "m1",
        brand: "SAMSUNG",
        name: "Machine à Laver Samsung EcoBubble 8Kg 1400 Tr/min Blanc",
        price: "1299 DT",
        originalPrice: "1449 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1299 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "1349 DT", best: false },
        ],
      },
      {
        id: "m2",
        brand: "LG",
        name: "Machine à Laver LG ThinQ 9Kg 1400 Tr/min Moteur Direct Drive",
        price: "1699 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "1699 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1749 DT", best: false },
        ],
      },
      {
        id: "m3",
        brand: "BOSCH",
        name: "Machine à Laver Bosch Serie 6 9Kg 1400 Tr/min EcoSilence Drive",
        price: "2199 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Jumbo", dot: "#9ca3af", price: "2199 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "2299 DT", best: false },
        ],
      },
      {
        id: "m4",
        brand: "BEKO",
        name: "Machine à Laver Beko WTV8612XW 8Kg 1200 Tr/min SteamCure",
        price: "999 DT",
        originalPrice: "1099 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "999 DT", best: true },
          { name: "Technopro", dot: "#3b82f6", price: "1049 DT", best: false },
        ],
      },
      {
        id: "m5",
        brand: "SAMSUNG",
        name: "Machine à Laver Samsung AddWash 10Kg 1400 Tr/min Inox",
        price: "1849 DT",
        originalPrice: "1999 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1849 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "1899 DT", best: false },
        ],
      },
      {
        id: "m6",
        brand: "WHIRLPOOL",
        name: "Machine à Laver Whirlpool Supreme Clean 10Kg 1400 Tr/min",
        price: "1599 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Jumbo", dot: "#9ca3af", price: "1599 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "1649 DT", best: false },
        ],
      },
      {
        id: "m7",
        brand: "LG",
        name: "Machine à Laver LG F4WV509S1E 9Kg 1400 Tr/min AI DD Motor",
        price: "1999 DT",
        originalPrice: "2199 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "1999 DT", best: true },
          { name: "Mytek", dot: "#ef4444", price: "2049 DT", best: false },
        ],
      },
      {
        id: "m8",
        brand: "HISENSE",
        name: "Machine à Laver Hisense WFGA8012V 8Kg 1200 Tr/min A+++",
        price: "849 DT",
        originalPrice: "949 DT",
        image: "/images/item-cart.png",
        inStock: false,
        stores: [
          { name: "Technopro", dot: "#3b82f6", price: "849 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "899 DT", best: false },
        ],
      },
    ],
  },
  {
    label: "Lave Vaisselle",
    bannerImg: "/images/item-cart.png",
    bannerTitle: "Lave Vaisselles",
    products: [
      {
        id: "v1",
        brand: "BOSCH",
        name: "Lave-Vaisselle Bosch Serie 4 12 Couverts 60cm Inox SMU4HVS31E",
        price: "1749 DT",
        originalPrice: "1899 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1749 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "1799 DT", best: false },
        ],
      },
      {
        id: "v2",
        brand: "SAMSUNG",
        name: "Lave-Vaisselle Samsung 13 Couverts 60cm Inox DW60A6092FS",
        price: "1499 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "1499 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "1549 DT", best: false },
        ],
      },
      {
        id: "v3",
        brand: "BEKO",
        name: "Lave-Vaisselle Beko BDFN26430XA 14 Couverts 60cm AquaIntense",
        price: "1299 DT",
        originalPrice: "1399 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "1299 DT", best: true },
          { name: "Technopro", dot: "#3b82f6", price: "1349 DT", best: false },
        ],
      },
      {
        id: "v4",
        brand: "LG",
        name: "Lave-Vaisselle LG QuadWash 14 Couverts 60cm Inox DF455HMS",
        price: "1899 DT",
        image: "/images/item-cart.png",
        inStock: false,
        stores: [
          { name: "Jumbo", dot: "#9ca3af", price: "1899 DT", best: true },
          { name: "Mytek", dot: "#ef4444", price: "1999 DT", best: false },
        ],
      },
      {
        id: "v5",
        brand: "WHIRLPOOL",
        name: "Lave-Vaisselle Whirlpool WFC 3C26 14 Couverts 60cm PowerClean",
        price: "1649 DT",
        originalPrice: "1749 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1649 DT", best: true },
          { name: "Spacenet", dot: "#2563eb", price: "1699 DT", best: false },
        ],
      },
      {
        id: "v6",
        brand: "BOSCH",
        name: "Lave-Vaisselle Bosch Serie 6 13 Couverts 60cm Inox SMD6TCX00E",
        price: "2199 DT",
        originalPrice: "2399 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Tunisianet", dot: "#f97316", price: "2199 DT", best: true },
          { name: "Jumbo", dot: "#9ca3af", price: "2299 DT", best: false },
        ],
      },
      {
        id: "v7",
        brand: "HISENSE",
        name: "Lave-Vaisselle Hisense HS642E90X 14 Couverts 60cm Inox",
        price: "1149 DT",
        originalPrice: "1249 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Spacenet", dot: "#2563eb", price: "1149 DT", best: true },
          { name: "Technopro", dot: "#3b82f6", price: "1199 DT", best: false },
        ],
      },
      {
        id: "v8",
        brand: "SAMSUNG",
        name: "Lave-Vaisselle Samsung 14 Couverts 60cm Blanc DW60BG530BWEF",
        price: "1349 DT",
        image: "/images/item-cart.png",
        inStock: true,
        stores: [
          { name: "Mytek", dot: "#ef4444", price: "1349 DT", best: true },
          { name: "Tunisianet", dot: "#f97316", price: "1399 DT", best: false },
        ],
      },
    ],
  },
];

/** Main row: API `category` + chip label (PC de Bureau first — default tab). */
const ELEC_MAIN_CATEGORIES = [
  { api: "PC de Bureau", chip: "PC de Bureau" },
  { api: "Imprimante", chip: "Imprimantes" },
  { api: "Pc Portable", chip: "Pc Portable" },
  { api: "Réfrigérateur", chip: "Réfrigérateurs" },
  { api: "Machine à Laver", chip: "Machine à Laver" },
  { api: "Lave Vaisselle", chip: "Lave Vaisselle" },
] as const;

function toTrendProduct(product: CatalogProduct): Product {
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
    href: productHref(product, "retail"),
    stores:
      stores.length > 0
        ? stores.map((shop, index) => ({
            name: normalizeShopName(shop.shop),
            dot: index === 0 ? "#3BDEB9" : "rgba(100,116,139,0.9)",
            price: formatPrice(shop.price),
            best: index === 0,
          }))
        : [
            {
              name: "Meilleur prix",
              dot: "#3BDEB9",
              price: formatPrice(product.bestPrice),
              best: true,
            },
          ],
  };
}

type CType = ReturnType<typeof makeC>;
function ElectroniqueProductCard({
  p,
  fallbackSrc,
  C,
  isLight,
}: {
  p: Product;
  fallbackSrc: string;
  C: CType;
  isLight: boolean;
}) {
  const imageCandidates = buildImageCandidates(p.image, fallbackSrc);
  const stores = p.stores.filter((s) => s.name).slice(0, 3);
  const href = p.href || `/products/${p.id}`;

  return (
    <div
      className="elec-card"
      style={{
        display: "flex",
        width: "100%",
        maxWidth: 280,
        flexShrink: 0,
        flexDirection: "column",
        borderRadius: 16,
        border: `1px solid ${C.cardBorder}`,
        background: C.card,
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
            src={imageCandidates[0]}
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
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const current = Number(img.dataset.fallbackIndex ?? "0");
              const next = current + 1;
              if (next < imageCandidates.length) {
                img.dataset.fallbackIndex = String(next);
                img.src = imageCandidates[next];
              }
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
              color: C.teal,
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
            color: C.teal,
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
            color: C.text,
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
              color: C.text,
              whiteSpace: "nowrap",
            }}
          >
            {p.price}
          </span>
          {p.originalPrice && (
            <span
              style={{
                fontSize: 10,
                color: C.muted,
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
              color: C.muted,
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
                  background: s.best ? C.rowBest : C.rowOther,
                  border: s.best
                    ? `1px solid ${C.rowBestBorder}`
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
                      color: s.best ? C.text : C.textSoft,
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
                      color: s.best ? C.price : C.textSoft,
                    }}
                  >
                    {s.price}
                  </span>
                  {s.best ? (
                    <Check
                      size={12}
                      strokeWidth={3}
                      style={{ color: C.teal }}
                    />
                  ) : (
                    <X
                      size={12}
                      strokeWidth={3}
                      style={{ color: "rgba(248,113,113,0.85)" }}
                    />
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
            color: C.text,
            background: "transparent",
            border: `1px solid ${C.border}`,
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

export default function TrendingSection({
  categories: _categories = [],
}: TrendingSectionProps) {
  const isLight = useIsLight();
  const C = makeC(isLight);
  const [mainRowChipIdx, setMainRowChipIdx] = useState(0);
  const activeMainCat = ELEC_MAIN_CATEGORIES[mainRowChipIdx];

  const mainBannerMeta = useMemo(
    () =>
      fallbackTrendCats.find((c) => c.label === activeMainCat.api) ??
      fallbackTrendCats[0],
    [activeMainCat.api],
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [mainRowProducts, setMainRowProducts] = useState<Product[]>([]);
  const [mainRowLoading, setMainRowLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const apiCategory = activeMainCat.api;

    async function loadMainRow() {
      setMainRowLoading(true);
      try {
        let res = await listProducts(
          { category: apiCategory, category_type: "subcategory", limit: 24 },
          { signal: ac.signal },
        );
        if (!res.products?.length) {
          res = await listProducts(
            { category: apiCategory, category_type: "low_category", limit: 24 },
            { signal: ac.signal },
          );
        }
        const raw = res.products || [];
        const enriched = await enrichCatalogProductImages(raw, ac.signal);
        if (!cancelled) {
          setMainRowProducts(enriched.map(toTrendProduct));
        }
      } catch {
        if (!cancelled) setMainRowProducts([]);
      } finally {
        if (!cancelled) setMainRowLoading(false);
      }
    }

    loadMainRow();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [activeMainCat.api]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [mainRowProducts.length, mainRowChipIdx]);

  const scrollStrip = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const moreHref = `/products?category=${encodeURIComponent(activeMainCat.api)}&type=subcategory`;
  return (
    <div
      id="electronique"
      style={{ width: "100%", background: C.bg, padding: "56px 0 64px" }}
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
          .elec-card:hover {
            box-shadow: 0 12px 36px rgba(0,0,0,0.55), 0 0 28px rgba(59,222,185,0.15) !important;
            transform: translateY(-2px);
            border-color: rgba(59,222,185,0.4) !important;
          }
          .elec-scroll {
            display: flex;
            gap: 16px;
            overflow-x: auto;
            scroll-behavior: smooth;
            padding-bottom: 16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .elec-scroll::-webkit-scrollbar { display: none; }
          .elec-chip {
            position: relative;
            overflow: hidden;
            z-index: 2;
            cursor: pointer;
            transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
          }
          .elec-banner {
            display: none;
          }
          .elec-main-row {
            border-radius: 24px;
            padding: 32px 20px;
          }
          @media (min-width: 1024px) {
            .elec-banner { display: block !important; }
            .elec-main-row {
              flex-direction: row !important;
              align-items: stretch !important;
            }
          }
          .elec-scroll-wrap .elec-arrow { display: flex; }
          @media (max-width: 767px) {
            .elec-scroll-wrap .elec-arrow {
              width: 34px !important;
              height: 34px !important;
            }
            .elec-scroll {
              gap: 8px !important;
            }
            .elec-card {
              width: calc((100% - 8px) / 2) !important;
              max-width: 156px !important;
              min-width: 140px !important;
              padding: 6px !important;
              border-radius: 10px !important;
            }
            .elec-card > a {
              height: 108px !important;
              margin-bottom: 6px !important;
              border-radius: 8px !important;
            }
            .elec-card .showcase-product-img {
              padding: 1px !important;
            }
            .elec-card > div {
              gap: 4px !important;
            }
            .elec-card > div > span:first-child {
              font-size: 8px !important;
            }
            .elec-card > div > a {
              font-size: 9px !important;
              min-height: 22px !important;
              line-height: 1.2 !important;
            }
            .elec-card > div > div:nth-child(3) span:first-child {
              font-size: 12px !important;
            }
            .elec-card > div > div:nth-child(3) span:last-child {
              font-size: 8px !important;
            }
            .elec-card > div > div:nth-child(4) > span {
              font-size: 7px !important;
              letter-spacing: 0.04em !important;
            }
            .elec-card > div > div:nth-child(4) > div > div {
              padding: 3px 5px !important;
              border-radius: 6px !important;
            }
            .elec-card > div > div:nth-child(4) > div > div span {
              font-size: 8px !important;
            }
            .elec-card > div > div:nth-child(4) > div > div:nth-child(n+3) {
              display: none !important;
            }
            .elec-card > div > div:nth-child(4) > div {
              gap: 3px !important;
            }
            .elec-card > a > span {
              padding: 1px 6px !important;
              font-size: 8px !important;
              top: 6px !important;
              right: 6px !important;
            }
            .elec-card .showcase-cta {
              padding: 6px 8px !important;
              font-size: 9px !important;
            }
            .elec-card .showcase-cta svg {
              width: 12px !important;
              height: 12px !important;
            }
          }
          @media (max-width: 420px) {
            .elec-card {
              min-width: 132px !important;
              max-width: 148px !important;
            }
            .elec-card > a {
              height: 100px !important;
            }
          }
          .elec-arrow:hover {
            border-color: rgba(59,222,185,0.5) !important;
            box-shadow: 0 0 24px rgba(59,222,185,0.18) !important;
          }
          .elec-more:hover {
            border-color: rgba(59,222,185,0.4) !important;
            transform: translateY(-2px);
            box-shadow: 0 14px 36px rgba(0,0,0,0.45), 0 0 28px rgba(59,222,185,0.12) !important;
          }
          .elec-more {
            animation: elecMoreFloat 2.8s ease-in-out infinite;
          }
          .elec-more > span {
            animation: elecMorePulse 1.8s ease-in-out infinite;
          }
          .elec-more:hover > span {
            transform: translateX(2px) scale(1.06);
          }
          @keyframes elecMoreFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
          @keyframes elecMorePulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(91,33,182,0.22); }
            50% { box-shadow: 0 0 0 7px rgba(91,33,182,0); }
          }
          .elec-banner-group:hover .elec-banner-img {
            transform: scale(1.1);
          }
          #electronique .elec-banner .elec-banner-group .elec-banner-kicker,
          [data-theme="light"] #electronique .elec-banner .elec-banner-group .elec-banner-kicker {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            text-shadow: 0 2px 8px rgba(0,0,0,0.55) !important;
          }
          #electronique .elec-banner .elec-banner-group .elec-banner-title,
          [data-theme="light"] #electronique .elec-banner .elec-banner-group .elec-banner-title {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            text-shadow: 0 2px 12px rgba(0,0,0,0.5) !important;
          }
          @media (max-width: 767px) {
            #electronique .trend-heading { margin-bottom: 30px !important; }
            .elec-main-row {
              width: 100% !important;
              max-width: 100% !important;
              padding: 20px 12px !important;
              border-radius: 16px !important;
              box-sizing: border-box !important;
            }
            .elec-main-panel {
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              border: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              box-sizing: border-box !important;
            }
            .elec-more {
              padding: 10px 14px !important;
              font-size: 12px !important;
              gap: 8px !important;
              width: 100%;
              justify-content: center;
            }
            .elec-more > span {
              width: 24px !important;
              height: 24px !important;
              background: #ffffff !important;
              color: #5b21b6 !important;
            }
            .elec-more > span svg {
              width: 14px !important;
              height: 14px !important;
            }
          }

          /* ── Light mode overrides ── */
          [data-theme="light"] #electronique { background: #f0f2ef !important; }
          [data-theme="light"] .elec-main-row {
            background: #ffffff !important;
            border: 1px solid rgba(91, 33, 182, 0.15) !important;
            box-shadow: 0 14px 42px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.65) !important;
          }
          [data-theme="light"] .elec-card { background: #ffffff !important; border-color: rgba(0,0,0,0.09) !important; box-shadow: 0 4px 20px rgba(0,0,0,0.07) !important; }
          [data-theme="light"] .elec-card:hover { border-color: rgba(91,33,182,0.28) !important; box-shadow: 0 12px 36px rgba(0,0,0,0.1) !important; }
          [data-theme="light"] .elec-banner { background: #e8eae6 !important; border-color: rgba(0,0,0,0.08) !important; }
          [data-theme="light"] .elec-banner-group { border-color: rgba(0,0,0,0.08) !important; background: #e4e6e2 !important; }
          [data-theme="light"] .elec-chip { background: rgba(0,0,0,0.04) !important; border-color: rgba(0,0,0,0.1) !important; color: rgba(0,0,0,0.55) !important; }
          [data-theme="light"] .elec-chip.active { background: rgba(91,33,182,0.1) !important; border-color: rgba(91,33,182,0.35) !important; color: #5B21B6 !important; }
          [data-theme="light"] .elec-arrow { background: #ffffff !important; border-color: rgba(0,0,0,0.1) !important; color: #0a0f0d !important; }
          [data-theme="light"] .elec-arrow:hover { border-color: rgba(91,33,182,0.4) !important; box-shadow: 0 0 18px rgba(91,33,182,0.1) !important; }
          [data-theme="light"] .elec-more { background: #ffffff !important; border-color: rgba(0,0,0,0.1) !important; color: #0a0f0d !important; }
          [data-theme="light"] .elec-more:hover { border-color: rgba(91,33,182,0.35) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
          [data-theme="light"] .elec-main-panel {
            background: #ffffff !important;
            border-radius: 24px;
            border: 1px solid rgba(91, 33, 182, 0.15) !important;
            box-shadow: 0 14px 42px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.65) !important;
            padding: 32px 20px;
          }
        `}</style>

        <div
          className="trend-heading"
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: C.teal,
              marginBottom: 14,
            }}
          >
            Comparez &amp; Économisez
          </p>
          <h2
            style={{
              color: C.text,
              fontSize: "clamp(2rem,5vw,3.6rem)",
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
            Les{" "}
            <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
              <span className="cd-words-wrapper">
                <span className="item-text is-visible">
                  <i className="in">m</i>
                  <i className="in">e</i>
                  <i className="in">i</i>
                  <i className="in">l</i>
                  <i className="in">l</i>
                  <i className="in">e</i>
                  <i className="in">u</i>
                  <i className="in">r</i>
                  <i className="in">s</i>
                </span>
                <span className="item-text is-hidden">
                  <i className="out">m</i>
                  <i className="out">e</i>
                  <i className="out">i</i>
                  <i className="out">l</i>
                  <i className="out">l</i>
                  <i className="out">e</i>
                  <i className="out">u</i>
                  <i className="out">r</i>
                  <i className="out">s</i>
                </span>
                <span className="item-text is-hidden">
                  <i className="in">m</i>
                  <i className="in">e</i>
                  <i className="in">i</i>
                  <i className="in">l</i>
                  <i className="in">l</i>
                  <i className="in">e</i>
                  <i className="in">u</i>
                  <i className="in">r</i>
                  <i className="in">s</i>
                </span>
              </span>
            </span>{" "}
            prix du marché
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 16,
              marginTop: 16,
              maxWidth: 520,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            Comparez les prix en temps réel sur les grandes enseignes
            tunisiennes et trouvez le meilleur deal en un clic.
          </p>
        </div>

        <div
          className="elec-main-row"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            alignItems: "stretch",
          }}
        >
          <div
            className="elec-banner"
            style={{
              width: 320,
              flexShrink: 0,
            }}
          >
            <div
              className="elec-banner-group"
              style={{
                height: "100%",
                minHeight: 420,
                width: "100%",
                position: "relative",
                borderRadius: "2.5rem",
                overflow: "hidden",
                background: "#ffffff",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
              }}
            >
              <img
                className="elec-banner-img"
                src={mainBannerMeta.bannerImg}
                alt="Bannière promo"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                sizes="320px"
                style={{
                  height: "100%",
                  width: "100%",
                  objectFit: mainBannerMeta.bannerImg.startsWith("/images/")
                    ? "contain"
                    : "cover",
                  objectPosition: "center",
                  opacity: 1,
                  transition: "transform 0.7s ease",
                  display: "block",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 38%, transparent 62%)",
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
                  className="elec-banner-kicker"
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    opacity: 1,
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    textDecorationColor: C.teal,
                    textShadow: "0 2px 8px rgba(0,0,0,0.55)",
                  }}
                >
                  Promo
                </span>
                <h3
                  className="elec-banner-title"
                  style={{
                    color: "#fff",
                    fontSize: 26,
                    fontWeight: 900,
                    margin: "8px 0 0",
                    textShadow: "0 2px 12px rgba(0,0,0,0.35)",
                  }}
                >
                  {mainBannerMeta.bannerTitle}
                </h3>
              </div>
            </div>
          </div>

          <div
            className="elec-main-panel"
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
                {ELEC_MAIN_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.api}
                    type="button"
                    className="elec-chip light_skew_hover"
                    onClick={() => setMainRowChipIdx(i)}
                    style={{
                      borderRadius: 999,
                      padding: "8px 20px",
                      fontSize: 13,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      cursor: "pointer",
                      border:
                        i === mainRowChipIdx
                          ? "1px solid rgba(255,255,255,0.28)"
                          : "1px solid rgba(255,255,255,0.1)",
                      boxShadow:
                        i === mainRowChipIdx
                          ? "0 4px 20px rgba(0,0,0,0.3)"
                          : "none",
                      background:
                        i === mainRowChipIdx
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(255,255,255,0.04)",
                      color: "#fff",
                    }}
                  >
                    {cat.chip}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ position: "relative" }} className="elec-scroll-wrap">
              <button
                type="button"
                className="elec-arrow"
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
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${C.border}`,
                  background: "#000000",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={22} strokeWidth={2.5} color={C.teal} />
              </button>
              <button
                type="button"
                className="elec-arrow"
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
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${C.border}`,
                  background: "#000000",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={22} strokeWidth={2.5} color={C.teal} />
              </button>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 16,
                  width: 32,
                  background: `linear-gradient(to right, ${C.bg}, transparent)`,
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
                  background: `linear-gradient(to left, ${C.bg}, transparent)`,
                  zIndex: 5,
                  pointerEvents: "none",
                }}
              />

              <div ref={scrollerRef} className="elec-scroll">
                {mainRowLoading ? (
                  <div
                    style={{
                      padding: "48px 24px",
                      color: C.muted,
                      fontSize: 14,
                      fontWeight: 600,
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    Chargement…
                  </div>
                ) : mainRowProducts.length === 0 ? (
                  <div
                    style={{
                      padding: "48px 24px",
                      color: C.muted,
                      fontSize: 14,
                      fontWeight: 600,
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    Aucun produit dans cette catégorie.
                  </div>
                ) : (
                  mainRowProducts.map((p) => (
                    <ElectroniqueProductCard
                      key={p.id}
                      p={p}
                      fallbackSrc={mainBannerMeta.bannerImg}
                      C={C}
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
                className="elec-more"
                href={moreHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  borderRadius: 999,
                  border: `1px solid ${C.cardBorder}`,
                  background: "rgba(0,0,0,0.92)",
                  padding: "16px 28px",
                  fontSize: 16,
                  fontWeight: 800,
                  color: C.text,
                  textDecoration: "none",
                  boxShadow:
                    "0 8px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
                  transition:
                    "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
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
                    background: `linear-gradient(90deg, ${C.teal} 0%, ${C.tealMid} 100%)`,
                    color: C.ctaText,
                  }}
                >
                  <ArrowRight size={18} strokeWidth={2.5} />
                </span>
              </a>
            </div>
          </div>
        </div>

        <ApplianceLightShowcase />
        <LavageShowcaseSection />
      </section>
    </div>
  );
}
