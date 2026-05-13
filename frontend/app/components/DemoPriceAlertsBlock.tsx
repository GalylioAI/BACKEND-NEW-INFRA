"use client";

import { useRef } from "react";

type AlertProduct = {
  productImage: string;
  productAlt: string;
  shopLogo: string;
  shopName: string;
  brand: string;
  title: string;
  category: string;
  oldReal: { crossed: string; promo: string };
  newSuspect: { crossed: string; promo: string };
  metrics: {
    displayedPct: string;
    inflatedPct: string;
    inflatedDt: string;
    realHikePct: string;
  };
};

const ALERT_PRODUCTS: AlertProduct[] = [
  {
    productImage: "https://www.mytek.tn/media/catalog/product/2/_/2_574_1.jpg",
    productAlt: "Toner Original KONICA MINOLTA TN-328 - Cyan (TN-328C)",
    shopLogo: "https://www.mytek.tn/favicon.ico",
    shopName: "mytek",
    brand: "konica-minolta",
    title: "Toner Original KONICA MINOLTA TN-328 - Cyan (TN-328C)",
    category: "Toner Photocopieur",
    oldReal: { crossed: "599.000 DT", promo: "494.000 DT" },
    newSuspect: { crossed: "599.000 DT", promo: "519.000 DT" },
    metrics: { displayedPct: "-13.4%", inflatedPct: "+21.3%", inflatedDt: "105.000 DT", realHikePct: "+5.1%" },
  },
  {
    productImage: "https://spacenet.tn/themes/medicine_theme_5/assets/img/refrigerateur.png",
    productAlt: "Réfrigérateur Side By Side Hyundai 549L NoFrost Inox",
    shopLogo: "https://spacenet.tn/favicon.ico",
    shopName: "spacenet",
    brand: "HYUNDAI",
    title: "Réfrigérateur Side By Side Hyundai 549L NoFrost Inox",
    category: "Réfrigérateur",
    oldReal: { crossed: "2899.000 DT", promo: "2699.000 DT" },
    newSuspect: { crossed: "2999.000 DT", promo: "2799.000 DT" },
    metrics: { displayedPct: "-6.7%", inflatedPct: "+11.1%", inflatedDt: "300.000 DT", realHikePct: "+3.7%" },
  },
  {
    productImage: "https://spacenet.tn/200436-large_default/montre-connectee-smartberry-a56-plus-gold.jpg",
    productAlt: "Montre Connectée Smartbarry A56 Plus Gold",
    shopLogo: "https://spacenet.tn/favicon.ico",
    shopName: "spacenet",
    brand: "Smartbarry",
    title: "Montre Connectée Smartbarry A56 Plus Gold",
    category: "SmartWatch Femme",
    oldReal: { crossed: "199.000 DT", promo: "89.000 DT" },
    newSuspect: { crossed: "209.000 DT", promo: "99.000 DT" },
    metrics: { displayedPct: "-52.6%", inflatedPct: "+134.8%", inflatedDt: "120.000 DT", realHikePct: "+11.2%" },
  },
  {
    productImage: "https://spacenet.tn/199656-large_default/casque-bluetooth-p9-pro-max-bleu.jpg",
    productAlt: "Casque Bluetooth P9 Pro Max Bleu",
    shopLogo: "https://spacenet.tn/favicon.ico",
    shopName: "spacenet",
    brand: "sans Marque",
    title: "Casque Bluetooth P9 Pro Max Bleu",
    category: "Casques Audio & Sans Fil",
    oldReal: { crossed: "69.000 DT", promo: "20.900 DT" },
    newSuspect: { crossed: "69.000 DT", promo: "24.900 DT" },
    metrics: { displayedPct: "-63.9%", inflatedPct: "+230.1%", inflatedDt: "48.100 DT", realHikePct: "+19.1%" },
  },
  {
    productImage: "https://www.mytek.tn/media/catalog/product/c/o/compteuse-de-billets-olympia-nc-520-plus-universel_1.jpg",
    productAlt: "Compteuse de Billets OLYMPIA NC 520 Plus Universel",
    shopLogo: "https://www.mytek.tn/favicon.ico",
    shopName: "mytek",
    brand: "olympia",
    title: "Compteuse de Billets OLYMPIA NC 520 Plus Universel",
    category: "Compteuse de Billets",
    oldReal: { crossed: "599.000 DT", promo: "555.000 DT" },
    newSuspect: { crossed: "599.000 DT", promo: "579.000 DT" },
    metrics: { displayedPct: "-3.3%", inflatedPct: "+7.9%", inflatedDt: "44.000 DT", realHikePct: "+4.3%" },
  },
  {
    productImage: "https://www.mytek.tn/media/catalog/product/s/m/smartphone_samsung_galaxy_a26_5g_8go_256go_-_blanc_1_.jpg",
    productAlt: "Smartphone SAMSUNG Galaxy A26 5G 16Go 256Go - Blanc",
    shopLogo: "https://www.mytek.tn/favicon.ico",
    shopName: "mytek",
    brand: "samsung",
    title: "Smartphone SAMSUNG Galaxy A26 5G 16Go 256Go - Blanc",
    category: "Smartphone",
    oldReal: { crossed: "1299.000 DT", promo: "1099.000 DT" },
    newSuspect: { crossed: "1299.000 DT", promo: "1269.000 DT" },
    metrics: { displayedPct: "-2.3%", inflatedPct: "+18.2%", inflatedDt: "200.000 DT", realHikePct: "+15.5%" },
  },
  {
    productImage: "https://www.tunisianet.com.tn/427688-large/pc-portable-dell-latitude-5450-ultra-5-125u-24-go-ddr5-512-go-ssd-silver.jpg",
    productAlt: "PC PORTABLE DELL LATITUDE 5450 / ULTRA 5 125U / 24 Go DDR5 / 512 GO SSD / SILVER",
    shopLogo: "https://www.tunisianet.com.tn/favicon.ico",
    shopName: "tunisianet",
    brand: "Dell",
    title: "PC PORTABLE DELL LATITUDE 5450 / ULTRA 5 125U / 24 Go DDR5 / 512 GO SSD / SILVER",
    category: "Pc Portable",
    oldReal: { crossed: "3369.000 DT", promo: "3199.000 DT" },
    newSuspect: { crossed: "3569.000 DT", promo: "3399.000 DT" },
    metrics: { displayedPct: "-4.8%", inflatedPct: "+11.6%", inflatedDt: "370.000 DT", realHikePct: "+6.3%" },
  },
  {
    productImage: "/images/item-cart.webp",
    productAlt: "LAVE VAISSELLE CANDY 13 Couverts + AFF / Silver / CF3E7L0S",
    shopLogo: "https://www.tunisianet.com.tn/favicon.ico",
    shopName: "tunisianet",
    brand: "Candy",
    title: "LAVE VAISSELLE CANDY 13 Couverts + AFF / Silver / CF3E7L0S",
    category: "Lave vaisselle",
    oldReal: { crossed: "1499.000 DT", promo: "1259.000 DT" },
    newSuspect: { crossed: "1499.000 DT", promo: "1299.000 DT" },
    metrics: { displayedPct: "-13.3%", inflatedPct: "+19.1%", inflatedDt: "240.000 DT", realHikePct: "+3.2%" },
  },
  {
    productImage: "https://spacenet.tn/274322-large_default/processeur-intel-core-i7-14700k-56-ghz-lga-1700-box.jpg",
    productAlt: "Processeur Intel Core i7-14700K 5.6 GHz LGA 1700 Box",
    shopLogo: "https://spacenet.tn/favicon.ico",
    shopName: "spacenet",
    brand: "Intel",
    title: "Processeur Intel Core i7-14700K 5.6 GHz LGA 1700 Box",
    category: "Processeur",
    oldReal: { crossed: "1619.000 DT", promo: "1419.000 DT" },
    newSuspect: { crossed: "1619.000 DT", promo: "1519.000 DT" },
    metrics: { displayedPct: "-6.2%", inflatedPct: "+14.1%", inflatedDt: "200.000 DT", realHikePct: "+7.0%" },
  },
  {
    productImage: "https://spacenet.tn/339009-large_default/bicyclette-enfant-best-bike-b-16-16-vert.jpg",
    productAlt: "Bicyclette Enfant Best Bike B-16 16\" Vert",
    shopLogo: "https://spacenet.tn/favicon.ico",
    shopName: "spacenet",
    brand: "Best Bike",
    title: "Bicyclette Enfant Best Bike B-16 16\" Vert",
    category: "Bicyclette Enfant",
    oldReal: { crossed: "329.000 DT", promo: "289.000 DT" },
    newSuspect: { crossed: "329.000 DT", promo: "309.000 DT" },
    metrics: { displayedPct: "-6.1%", inflatedPct: "+13.8%", inflatedDt: "40.000 DT", realHikePct: "+6.9%" },
  },
];

function IconTriangleAlert({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * Hero mark: loupe over comparative bars — reads as “price data under audit” at small sizes.
 * Geometry tuned on a 24px grid; single-color for crisp dark/light themes.
 */
function IconHeroPriceAudit({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 15.75V13" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" opacity="0.28" />
      <path d="M17 15.75v-4.25" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" opacity="0.28" />
      <path d="M12 15.75V7.85" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      <circle cx="11.85" cy="11.35" r="7.35" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17.1 16.6 20.85 20.35" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      <circle cx="12" cy="7.15" r="1.15" fill="currentColor" opacity="0.92" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconChevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {dir === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export default function DemoPriceAlertsBlock() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div id="alertes-prix" className="pa-root">
      <div className="pa-backdrop" aria-hidden="true" />
      <style>{`
        /* ── Dark mode base (default) ── */
        .pa-root {
          position: relative;
          width: 100%;
          margin-top: 40px;
          margin-bottom: 32px;
          overflow: hidden;
          font-family: "Plus Jakarta Sans", sans-serif;
        }
        .pa-backdrop {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 55% at 12% 18%, rgba(59, 222, 185, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 88% 8%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 95%, rgba(124, 58, 237, 0.06) 0%, transparent 45%);
          opacity: 1;
        }
        .pa-section {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1736px;
          margin-left: auto;
          margin-right: auto;
          padding: 24px 15px 28px;
          box-sizing: border-box;
        }
        @media (min-width: 768px) {
          .pa-section { padding: 32px 24px 36px; }
        }
        @media (min-width: 1100px) {
          .pa-section { padding: 40px 32px 44px; }
        }
        .pa-shell {
          border-radius: 22px;
          padding: clamp(22px, 3.5vw, 40px);
          background:
            linear-gradient(155deg, rgba(255, 255, 255, 0.07) 0%, rgba(12, 16, 22, 0.55) 42%, rgba(8, 11, 16, 0.88) 100%);
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.35) inset,
            0 28px 72px -20px rgba(0, 0, 0, 0.65),
            0 12px 40px rgba(59, 222, 185, 0.06);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        @media (min-width: 640px) {
          .pa-shell { border-radius: 26px; }
        }
        .pa-hero {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: space-between;
          gap: 28px;
          margin-bottom: 28px;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        @media (min-width: 900px) {
          .pa-hero {
            flex-direction: row;
            align-items: flex-start;
            gap: 40px;
          }
        }
        .pa-hero-main { flex: 1; min-width: 0; }
        .pa-hero-left {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-top: 15px;
        }
        @media (min-width: 900px) {
          .pa-hero-left { margin-top: 17px; }
        }
        @media (min-width: 480px) {
          .pa-hero-left { align-items: center; }
        }
        .pa-hero-icon {
          flex-shrink: 0;
          width: 52px;
          height: 52px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(165deg, rgba(22, 32, 28, 0.98) 0%, rgba(8, 12, 10, 0.98) 100%);
          color: #7af3dc;
          border: 1px solid rgba(94, 234, 212, 0.42);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.07) inset,
            0 0 0 1px rgba(0, 0, 0, 0.35) inset,
            0 12px 32px rgba(0, 0, 0, 0.42);
        }
        @media (min-width: 640px) {
          .pa-hero-icon { width: 60px; height: 60px; border-radius: 17px; }
        }
        .pa-hero-icon .pa-hero-icon-svg {
          width: 27px;
          height: 27px;
          display: block;
          transform: translate(-0.5px, 0);
        }
        @media (min-width: 640px) {
          .pa-hero-icon .pa-hero-icon-svg { width: 31px; height: 31px; }
        }
        .pa-hero-title {
          margin: 0;
          font-size: clamp(1.5rem, 4.2vw, 2.85rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #f8fafc;
          line-height: 1.12;
        }
        .pa-hero-accent-anim-root {
          display: inline;
        }
        .pa-hero-title-accent {
          font-family: "Playfair Display", serif;
          font-style: italic;
          font-weight: 800;
          color: #f87171;
        }
        #alertes-prix .pa-hero-title .pa-hero-title-accent.animationtext.letters {
          font-weight: 800 !important;
        }
        #alertes-prix .pa-hero-title .animationtext.letters {
          height: auto !important;
          min-height: 0;
          overflow: visible !important;
          line-height: inherit;
          vertical-align: baseline;
        }
        #alertes-prix .pa-hero-title .animationtext.rotate-3 .item-text.is-visible {
          opacity: 1 !important;
        }
        #alertes-prix .pa-hero-title .animationtext.rotate-3 .cd-words-wrapper .item-text,
        #alertes-prix .pa-hero-title .animationtext.rotate-3 .cd-words-wrapper .item-text i {
          color: #f87171 !important;
          background: none !important;
          -webkit-background-clip: unset !important;
          background-clip: unset !important;
          -webkit-text-fill-color: #f87171 !important;
          -webkit-text-stroke: 0 !important;
        }
        .is_dark #alertes-prix .pa-hero-title .animationtext.rotate-3 .cd-words-wrapper .item-text,
        .is_dark #alertes-prix .pa-hero-title .animationtext.rotate-3 .cd-words-wrapper .item-text i {
          color: #f87171 !important;
          background: none !important;
          -webkit-text-fill-color: #f87171 !important;
          -webkit-text-stroke: 0 !important;
        }
        .pa-hero-sub {
          margin: 12px 0 0;
          font-size: clamp(0.9rem, 1.65vw, 1.05rem);
          line-height: 1.6;
          font-weight: 500;
          color: rgba(226, 232, 240, 0.72);
          max-width: 540px;
        }
        .pa-hero-art {
          flex-shrink: 0;
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
          padding: 18px 20px;
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.25) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
        }
        @media (min-width: 900px) {
          .pa-hero-art { margin: 0; max-width: 300px; }
        }
        .pa-viz-cap {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(148, 163, 184, 0.85);
          margin-bottom: 14px;
        }
        .pa-viz {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          height: 88px;
          padding: 0 4px 4px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pa-viz-bar {
          flex: 1;
          min-width: 0;
          border-radius: 6px 6px 2px 2px;
          background: linear-gradient(180deg, rgba(59, 222, 185, 0.45) 0%, rgba(59, 222, 185, 0.12) 100%);
          transition: height 0.4s ease;
        }
        .pa-viz-bar:nth-child(1) { height: 38%; }
        .pa-viz-bar:nth-child(2) { height: 52%; }
        .pa-viz-bar:nth-child(3) { height: 44%; }
        .pa-viz-bar:nth-child(4) { height: 100%; background: linear-gradient(180deg, #f87171 0%, rgba(248, 113, 113, 0.25) 100%); box-shadow: 0 0 24px rgba(248, 113, 113, 0.35); }
        .pa-viz-bar:nth-child(5) { height: 48%; }
        .pa-viz-foot {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(148, 163, 184, 0.75);
        }
        .pa-viz-foot span:last-child {
          color: #fca5a5;
          font-weight: 700;
        }
        .pa-info {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 16px;
          margin-bottom: 28px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(59, 222, 185, 0.18);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
        }
        @media (max-width: 599px) {
          .pa-info {
            grid-template-columns: auto 1fr;
            grid-template-rows: auto auto;
          }
          .pa-info-stat {
            grid-column: 1 / -1;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            gap: 10px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }
        }
        .pa-info-iconwrap {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 222, 185, 0.12);
          border: 1px solid rgba(59, 222, 185, 0.28);
          color: #5eead4;
        }
        .pa-info-iconwrap svg { width: 22px; height: 22px; }
        .pa-info-body strong {
          display: block;
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
          line-height: 1.45;
          letter-spacing: -0.01em;
        }
        .pa-info-body span {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(148, 163, 184, 0.95);
          margin-top: 6px;
        }
        .pa-info-stat {
          text-align: center;
          padding: 10px 18px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.28);
        }
        .pa-info-stat-num {
          display: block;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #fecaca;
          line-height: 1;
        }
        .pa-info-stat-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(252, 165, 165, 0.75);
          margin-top: 6px;
        }
        .pa-carousel-block { margin-top: 4px; }
        .pa-carousel-head {
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        @media (min-width: 640px) {
          .pa-carousel-head {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: baseline;
            justify-content: space-between;
            gap: 12px 24px;
          }
        }
        .pa-carousel-title {
          margin: 0;
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #f8fafc;
        }
        .pa-carousel-sub {
          margin: 0;
          font-size: 13px;
          font-weight: 500;
          color: rgba(148, 163, 184, 0.9);
          max-width: 420px;
          line-height: 1.5;
        }
        .pa-carousel-wrap {
          position: relative;
        }
        .pa-carousel-wrap::before,
        .pa-carousel-wrap::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 18px;
          width: 36px;
          z-index: 2;
          pointer-events: none;
        }
        .pa-carousel-wrap::before {
          left: 0;
          background: linear-gradient(90deg, rgba(8, 11, 16, 0.95) 0%, transparent 100%);
        }
        .pa-carousel-wrap::after {
          right: 0;
          background: linear-gradient(270deg, rgba(8, 11, 16, 0.95) 0%, transparent 100%);
        }
        @media (max-width: 639px) {
          .pa-carousel-wrap::before,
          .pa-carousel-wrap::after { width: 20px; }
        }
        @media (max-width: 639px) {
          .pa-carousel-wrap {
            width: calc(100% + 24px);
            margin-left: -12px;
            margin-right: -12px;
          }
        }
        .pa-nav {
          display: none;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1.5px solid rgba(59, 222, 185, 0.4);
          background: rgba(0, 0, 0, 0.8);
          color: #3BDEB9;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .pa-nav:hover {
          background: rgba(59, 222, 185, 0.12);
          border-color: #3BDEB9;
          color: #CCFF9B;
        }
        @media (min-width: 640px) { .pa-nav { display: flex; } }
        .pa-nav--prev { left: 4px; }
        .pa-nav--next { right: 4px; }
        .pa-nav svg { width: 18px; height: 18px; }
        .pa-scroller {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 2px 10px 10px;
          scroll-snap-type: x mandatory;
          scroll-padding-inline: 10px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-scroller { gap: 10px; scroll-padding-inline: 12px; padding-left: 12px; padding-right: 12px; }
        }
        @media (min-width: 480px) {
          .pa-scroller { gap: 12px; scroll-padding-inline: 14px; padding-left: 14px; padding-right: 14px; }
        }
        @media (min-width: 640px) {
          .pa-scroller {
            gap: 16px;
            padding: 4px 4px 16px;
            scroll-padding-inline: 4px;
          }
        }
        @media (min-width: 900px) {
          .pa-scroller { gap: 20px; }
        }
        .pa-scroller::-webkit-scrollbar { display: none; }
        .pa-card {
          flex: 0 0 min(220px, calc(100vw - 44px));
          width: min(220px, calc(100vw - 44px));
          max-width: min(220px, calc(100vw - 44px));
          scroll-snap-align: start;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: #000000;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04) inset,
            0 20px 48px rgba(0, 0, 0, 0.55);
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-card {
            flex: 0 0 min(238px, calc(100vw - 50px));
            width: min(238px, calc(100vw - 50px));
            max-width: min(238px, calc(100vw - 50px));
          }
        }
        @media (min-width: 480px) {
          .pa-card {
            flex: 0 0 min(300px, calc(100vw - 48px));
            width: min(300px, calc(100vw - 48px));
            max-width: min(300px, calc(100vw - 48px));
            border-radius: 16px;
          }
        }
        @media (min-width: 640px) {
          .pa-card {
            flex: 0 0 min(320px, calc(100vw - 56px));
            width: min(320px, calc(100vw - 56px));
            max-width: min(320px, calc(100vw - 56px));
          }
        }
        @media (min-width: 900px) {
          .pa-card {
            flex: 0 0 min(340px, calc(100vw - 64px));
            width: min(340px, calc(100vw - 64px));
            max-width: min(340px, calc(100vw - 64px));
          }
        }
        .pa-card:hover {
          border-color: rgba(255, 255, 255, 0.16);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.06) inset,
            0 24px 56px rgba(0, 0, 0, 0.65);
          transform: translateY(-2px);
        }
        .pa-card-flag {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #fecaca;
          background: #140505;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-card-flag { padding: 6px 9px; font-size: 10px; }
        }
        @media (min-width: 480px) {
          .pa-card-flag { padding: 8px 12px; font-size: 11px; gap: 6px; }
        }
        .pa-card-flag svg { width: 12px; height: 12px; flex-shrink: 0; }
        @media (min-width: 480px) { .pa-card-flag svg { width: 14px; height: 14px; } }
        .pa-card-body {
          padding: 10px;
          background: #000000;
          color: #fafafa;
        }
        @media (min-width: 400px) and (max-width: 479px) { .pa-card-body { padding: 11px; } }
        @media (min-width: 480px) { .pa-card-body { padding: 20px; } }
        .pa-card-top {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 10px;
        }
        @media (min-width: 480px) {
          .pa-card-top { gap: 12px; margin-bottom: 14px; }
        }
        .pa-thumb {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-thumb { width: 56px; height: 56px; border-radius: 9px; }
        }
        @media (min-width: 480px) { .pa-thumb { width: 80px; height: 80px; border-radius: 10px; } }
        .pa-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
        .pa-card-meta { min-width: 0; flex: 1; }
        .pa-shop-row {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 4px;
        }
        .pa-shop-logo {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #111111;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          flex-shrink: 0;
        }
        @media (min-width: 480px) {
          .pa-shop-logo { width: 28px; height: 28px; border-radius: 7px; }
        }
        .pa-shop-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .pa-shop-name {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.55);
          text-transform: capitalize;
        }
        .pa-brand {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.88);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 3px;
        }
        .pa-card-title {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-card-title { font-size: 11.5px; }
        }
        @media (min-width: 480px) {
          .pa-card-title { font-size: 13px; }
        }
        .pa-card-cat {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.48);
          margin-top: 4px;
        }
        .pa-compare {
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pa-compare-old {
          padding: 7px 8px;
          background: #0c0c0c;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-compare-old { padding: 8px 9px; }
        }
        @media (min-width: 480px) {
          .pa-compare-old { padding: 11px 14px; }
        }
        .pa-compare-old-label {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.72);
          margin-bottom: 6px;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-compare-old-label { font-size: 9px; margin-bottom: 7px; }
        }
        @media (min-width: 480px) {
          .pa-compare-old-label { font-size: 10px; margin-bottom: 9px; letter-spacing: 0.06em; }
        }
        .pa-compare-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        @media (min-width: 480px) {
          .pa-compare-row { gap: 8px; }
        }
        .pa-price-col { text-align: center; }
        .pa-price-col p {
          margin: 0 0 2px;
          font-size: 8.5px;
          color: rgba(255, 255, 255, 0.5);
        }
        @media (min-width: 480px) {
          .pa-price-col p { font-size: 9px; }
        }
        .pa-price-col span {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-price-col span { font-size: 11.5px; }
        }
        @media (min-width: 480px) {
          .pa-price-col span { font-size: 14px; }
        }
        .pa-price-col .pa-strike { text-decoration: line-through; opacity: 0.45; }
        .pa-arrow { color: rgba(255, 255, 255, 0.45); font-weight: 700; font-size: 12px; }
        @media (min-width: 480px) {
          .pa-arrow { font-size: 16px; }
        }
        .pa-compare-new {
          padding: 7px 8px;
          background: #0a0606;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-compare-new { padding: 8px 9px; }
        }
        @media (min-width: 480px) {
          .pa-compare-new { padding: 11px 14px; }
        }
        .pa-compare-new-label {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.72);
          margin-bottom: 6px;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-compare-new-label { font-size: 9px; margin-bottom: 7px; }
        }
        @media (min-width: 480px) {
          .pa-compare-new-label { font-size: 10px; margin-bottom: 9px; letter-spacing: 0.06em; }
        }
        .pa-compare-new .pa-price-col p { color: rgba(255, 255, 255, 0.5); }
        .pa-compare-new .pa-price-col span { color: #f5f5f5; }
        .pa-compare-new .pa-arrow { color: rgba(255, 255, 255, 0.45); }
        .pa-metrics {
          display: flex;
          gap: 4px;
          margin-top: 9px;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-metrics { gap: 5px; margin-top: 10px; }
        }
        @media (min-width: 480px) {
          .pa-metrics { gap: 8px; margin-top: 14px; }
        }
        .pa-metric {
          flex: 1;
          text-align: center;
          padding: 6px 3px;
          border-radius: 8px;
          border: 1px solid transparent;
          min-width: 0;
        }
        @media (min-width: 480px) {
          .pa-metric { padding: 9px 6px; border-radius: 10px; }
        }
        .pa-metric--red {
          background: #0f0a0a;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .pa-metric--amber {
          background: #0f0d08;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .pa-metric--teal {
          background: #080f0e;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .pa-metric p:first-child {
          margin: 0;
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (min-width: 480px) {
          .pa-metric p:first-child { font-size: 8px; letter-spacing: 0.04em; }
        }
        .pa-metric p:nth-child(2) {
          margin: 3px 0 1px;
          font-size: 12px;
          font-weight: 900;
        }
        @media (min-width: 400px) and (max-width: 479px) {
          .pa-metric p:nth-child(2) { font-size: 13.5px; margin: 4px 0 1px; }
        }
        @media (min-width: 480px) {
          .pa-metric p:nth-child(2) { font-size: 18px; margin: 5px 0 2px; }
        }
        .pa-metric p:last-child {
          margin: 0;
          font-size: 7px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (min-width: 480px) {
          .pa-metric p:last-child { font-size: 8px; }
        }
        .pa-metric--red p:first-child { color: rgba(255, 255, 255, 0.52); }
        .pa-metric--red p:nth-child(2) { color: #fecaca; }
        .pa-metric--red p:last-child { color: rgba(255, 255, 255, 0.45); }
        .pa-metric--amber p:first-child { color: rgba(255, 255, 255, 0.52); }
        .pa-metric--amber p:nth-child(2) { color: #fde68a; }
        .pa-metric--amber p:last-child { color: rgba(255, 255, 255, 0.45); }
        .pa-metric--teal p:first-child { color: rgba(255, 255, 255, 0.52); }
        .pa-metric--teal p:nth-child(2) { color: #a7f3d0; }
        .pa-metric--teal p:last-child { color: rgba(255, 255, 255, 0.45); }
        .pa-cta-wrap {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }
        .pa-cta {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: -0.01em;
          color: #ffffff !important;
          background: transparent !important;
          border: 1.5px solid rgba(255, 255, 255, 0.45);
          box-shadow: none;
          isolation: isolate;
          transition:
            color 0.35s ease,
            border-color 0.35s ease,
            transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pa-cta::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            110deg,
            transparent 0%,
            transparent 38%,
            rgba(255, 255, 255, 0.14) 50%,
            transparent 62%,
            transparent 100%
          );
          background-size: 220% 100%;
          background-position: 100% 0;
          opacity: 0;
          z-index: -1;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        @keyframes pa-cta-sheen {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes pa-cta-pulse-ring {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
          50% {
            box-shadow: 0 0 28px 2px rgba(255, 255, 255, 0.14);
          }
        }
        .pa-cta:hover {
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.92);
          transform: translateY(-2px) scale(1.02);
          animation: pa-cta-pulse-ring 1.6s ease-in-out infinite;
        }
        .pa-cta:hover::before {
          opacity: 1;
          animation: pa-cta-sheen 1.1s ease-in-out infinite;
        }
        .pa-cta:active {
          transform: translateY(0) scale(1);
          animation: none;
        }
        .pa-cta:active::before {
          opacity: 0;
          animation: none;
        }
        .pa-cta svg {
          width: 18px;
          height: 18px;
          transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pa-cta:hover svg {
          transform: translateX(6px);
        }

        /* ── Light mode ── */
        [data-theme=”light”] #alertes-prix.pa-root .pa-backdrop {
          background:
            radial-gradient(ellipse 80% 55% at 10% 12%, rgba(91, 33, 182, 0.09) 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 92% 6%, rgba(239, 68, 68, 0.07) 0%, transparent 50%),
            radial-gradient(ellipse 55% 42% at 72% 96%, rgba(59, 222, 185, 0.06) 0%, transparent 48%);
        }
        [data-theme=”light”] #alertes-prix .pa-shell {
          background: linear-gradient(165deg, #ffffff 0%, #f8fafc 45%, #f1f5f9 100%);
          border-color: rgba(15, 23, 42, 0.1);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.9) inset,
            0 24px 60px rgba(15, 23, 42, 0.1),
            0 8px 24px rgba(91, 33, 182, 0.06);
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        [data-theme=”light”] #alertes-prix .pa-hero {
          border-bottom-color: rgba(15, 23, 42, 0.1);
        }
        [data-theme=”light”] #alertes-prix .pa-hero-art {
          background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
          border-color: rgba(15, 23, 42, 0.1);
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
        }
        [data-theme=”light”] #alertes-prix .pa-viz-cap { color: rgba(15, 23, 42, 0.65); }
        [data-theme=”light”] #alertes-prix .pa-viz { border-bottom-color: rgba(15, 23, 42, 0.1); }
        [data-theme=”light”] #alertes-prix .pa-viz-bar {
          background: linear-gradient(180deg, rgba(91, 33, 182, 0.4) 0%, rgba(91, 33, 182, 0.12) 100%);
        }
        [data-theme=”light”] #alertes-prix .pa-viz-bar:nth-child(4) {
          background: linear-gradient(180deg, #ef4444 0%, rgba(239, 68, 68, 0.3) 100%);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.25);
        }
        [data-theme=”light”] #alertes-prix .pa-viz-foot { color: rgba(15, 23, 42, 0.6); }
        [data-theme=”light”] #alertes-prix .pa-viz-foot span:last-child { color: #dc2626; font-weight: 700; }
        [data-theme=”light”] #alertes-prix .pa-carousel-title { color: #0f172a; }
        [data-theme=”light”] #alertes-prix .pa-carousel-sub { color: rgba(15, 23, 42, 0.65); }
        [data-theme=”light”] #alertes-prix .pa-carousel-wrap::before {
          background: linear-gradient(90deg, rgba(241, 245, 249, 0.98) 0%, transparent 100%);
        }
        [data-theme=”light”] #alertes-prix .pa-carousel-wrap::after {
          background: linear-gradient(270deg, rgba(241, 245, 249, 0.98) 0%, transparent 100%);
        }
        [data-theme=”light”] #alertes-prix .pa-info {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(91, 33, 182, 0.16);
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
        }
        [data-theme=”light”] #alertes-prix .pa-info-iconwrap {
          background: rgba(91, 33, 182, 0.1);
          border-color: rgba(91, 33, 182, 0.22);
          color: #6d28d9;
        }
        [data-theme=”light”] #alertes-prix .pa-info-body strong { color: #0f172a; }
        [data-theme=”light”] #alertes-prix .pa-info-body span { color: rgba(15, 23, 42, 0.68); }
        [data-theme=”light”] #alertes-prix .pa-info-stat {
          background: rgba(254, 226, 226, 0.9);
          border-color: rgba(220, 38, 38, 0.25);
        }
        [data-theme=”light”] #alertes-prix .pa-info-stat-num { color: #b91c1c; }
        [data-theme=”light”] #alertes-prix .pa-info-stat-label { color: rgba(153, 27, 27, 0.85); }
        @media (max-width: 599px) {
          [data-theme=”light”] #alertes-prix .pa-info-stat {
            border-top-color: rgba(15, 23, 42, 0.08);
          }
        }
        [data-theme=”light”] #alertes-prix .pa-hero-icon {
          background: linear-gradient(165deg, #ffffff 0%, #ede9fe 100%);
          border-color: rgba(91, 33, 182, 0.25);
          color: #5b21b6;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.95) inset,
            0 0 0 1px rgba(15, 23, 42, 0.04) inset,
            0 10px 26px rgba(15, 23, 42, 0.1);
        }
        [data-theme=”light”] #alertes-prix .pa-hero-title { color: #0a0f1a; }
        [data-theme=”light”] #alertes-prix .pa-hero-title-accent { color: #dc2626; }
        [data-theme=”light”] #alertes-prix .pa-hero-title .animationtext.rotate-3 .cd-words-wrapper .item-text,
        [data-theme=”light”] #alertes-prix .pa-hero-title .animationtext.rotate-3 .cd-words-wrapper .item-text.is-hidden,
        [data-theme=”light”] #alertes-prix .pa-hero-title .animationtext.rotate-3 .cd-words-wrapper .item-text.is-visible,
        [data-theme=”light”] #alertes-prix .pa-hero-title .animationtext.rotate-3 .cd-words-wrapper .item-text i {
          color: #dc2626 !important;
          background: none !important;
          text-shadow: none !important;
          -webkit-background-clip: initial !important;
          background-clip: initial !important;
          -webkit-text-fill-color: #dc2626 !important;
          -webkit-text-stroke: 0 !important;
        }
        [data-theme=”light”] #alertes-prix .pa-hero-sub { color: rgba(10, 15, 26, 0.7); }
        [data-theme=”light”] #alertes-prix .pa-nav {
          background: #ffffff;
          border-color: rgba(91, 33, 182, 0.28);
          color: #6d28d9;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        [data-theme=”light”] #alertes-prix .pa-nav:hover {
          background: #f5f3ff;
          border-color: #7C3AED;
          color: #5B21B6;
        }
        /* Cards: white with dark text in light theme for maximum readability */
        [data-theme=”light”] #alertes-prix .pa-card {
          background: #ffffff;
          border-color: rgba(15, 23, 42, 0.1);
          box-shadow:
            0 0 0 1px rgba(15, 23, 42, 0.04) inset,
            0 8px 32px rgba(15, 23, 42, 0.1);
        }
        [data-theme=”light”] #alertes-prix .pa-card:hover {
          border-color: rgba(91, 33, 182, 0.2);
          box-shadow:
            0 0 0 1px rgba(91, 33, 182, 0.06) inset,
            0 12px 40px rgba(15, 23, 42, 0.14);
        }
        [data-theme=”light”] #alertes-prix .pa-card-flag {
          background: #fef2f2;
          color: #991b1b;
          border-bottom-color: rgba(239, 68, 68, 0.15);
        }
        [data-theme=”light”] #alertes-prix .pa-card-body {
          background: #ffffff;
          color: #0f172a;
        }
        [data-theme=”light”] #alertes-prix .pa-thumb {
          background: #f8fafc;
          border-color: rgba(15, 23, 42, 0.1);
        }
        [data-theme=”light”] #alertes-prix .pa-shop-logo {
          background: #f8fafc;
          border-color: rgba(15, 23, 42, 0.1);
        }
        [data-theme=”light”] #alertes-prix .pa-shop-name { color: rgba(15, 23, 42, 0.55); }
        [data-theme=”light”] #alertes-prix .pa-brand { color: #0f172a; }
        [data-theme=”light”] #alertes-prix .pa-card-title { color: #0f172a; }
        [data-theme=”light”] #alertes-prix .pa-card-cat { color: rgba(15, 23, 42, 0.55); }
        [data-theme=”light”] #alertes-prix .pa-compare { border-color: rgba(15, 23, 42, 0.1); }
        [data-theme=”light”] #alertes-prix .pa-compare-old {
          background: #f8fafc;
          border-bottom-color: rgba(15, 23, 42, 0.08);
        }
        [data-theme=”light”] #alertes-prix .pa-compare-old-label { color: rgba(15, 23, 42, 0.65); }
        [data-theme=”light”] #alertes-prix .pa-compare-old .pa-price-col p { color: rgba(15, 23, 42, 0.55); }
        [data-theme=”light”] #alertes-prix .pa-compare-old .pa-price-col span { color: #0f172a; }
        [data-theme=”light”] #alertes-prix .pa-compare-old .pa-arrow { color: rgba(15, 23, 42, 0.4); }
        [data-theme=”light”] #alertes-prix .pa-compare-new { background: #fff5f5; }
        [data-theme=”light”] #alertes-prix .pa-compare-new-label { color: rgba(153, 27, 27, 0.8); }
        [data-theme=”light”] #alertes-prix .pa-compare-new .pa-price-col p { color: rgba(15, 23, 42, 0.55); }
        [data-theme=”light”] #alertes-prix .pa-compare-new .pa-price-col span { color: #0f172a; }
        [data-theme=”light”] #alertes-prix .pa-compare-new .pa-arrow { color: rgba(15, 23, 42, 0.4); }
        [data-theme=”light”] #alertes-prix .pa-metric--red {
          background: #fef2f2;
          border-color: rgba(239, 68, 68, 0.18);
        }
        [data-theme=”light”] #alertes-prix .pa-metric--red p:first-child { color: rgba(153, 27, 27, 0.75); }
        [data-theme=”light”] #alertes-prix .pa-metric--red p:nth-child(2) { color: #dc2626; }
        [data-theme=”light”] #alertes-prix .pa-metric--red p:last-child { color: rgba(153, 27, 27, 0.7); }
        [data-theme=”light”] #alertes-prix .pa-metric--amber {
          background: #fffbeb;
          border-color: rgba(245, 158, 11, 0.18);
        }
        [data-theme=”light”] #alertes-prix .pa-metric--amber p:first-child { color: rgba(120, 53, 15, 0.75); }
        [data-theme=”light”] #alertes-prix .pa-metric--amber p:nth-child(2) { color: #b45309; }
        [data-theme=”light”] #alertes-prix .pa-metric--amber p:last-child { color: rgba(120, 53, 15, 0.7); }
        [data-theme=”light”] #alertes-prix .pa-metric--teal {
          background: #f0fdf4;
          border-color: rgba(16, 185, 129, 0.18);
        }
        [data-theme=”light”] #alertes-prix .pa-metric--teal p:first-child { color: rgba(6, 78, 59, 0.75); }
        [data-theme=”light”] #alertes-prix .pa-metric--teal p:nth-child(2) { color: #059669; }
        [data-theme=”light”] #alertes-prix .pa-metric--teal p:last-child { color: rgba(6, 78, 59, 0.7); }
        [data-theme=”light”] #alertes-prix .pa-strike { opacity: 0.35; }
        [data-theme=”light”] #alertes-prix .pa-cta {
          color: #0f172a !important;
          background: transparent !important;
          border-color: rgba(15, 23, 42, 0.3);
          box-shadow: none;
        }
        [data-theme=”light”] #alertes-prix .pa-cta::before {
          background: linear-gradient(
            110deg,
            transparent 0%,
            transparent 38%,
            rgba(91, 33, 182, 0.1) 50%,
            transparent 62%,
            transparent 100%
          );
          background-size: 220% 100%;
          background-position: 100% 0;
        }
        @keyframes pa-cta-pulse-ring-light {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91, 33, 182, 0); }
          50% { box-shadow: 0 0 24px 2px rgba(91, 33, 182, 0.18); }
        }
        [data-theme=”light”] #alertes-prix .pa-cta:hover {
          color: #5b21b6 !important;
          border-color: rgba(91, 33, 182, 0.55);
          animation: pa-cta-pulse-ring-light 1.6s ease-in-out infinite;
        }
      `}</style>

      <section className="pa-section" aria-labelledby="pa-heading">
        <div className="pa-shell">
          <header className="pa-hero">
            <div className="pa-hero-main">
              <div className="pa-hero-left">
                <div className="pa-hero-icon" aria-hidden="true">
                  <IconHeroPriceAudit className="pa-hero-icon-svg" />
                </div>
                <div>
                  <h2 id="pa-heading" className="pa-hero-title">
                    Attention aux{" "}
                    <span className="is-visible pa-hero-accent-anim-root">
                      <span className="pa-hero-title-accent fst-italic font-playfair-display animationtext letters rotate-3">
                        <span className="cd-words-wrapper">
                          <span className="item-text is-visible">Faux Prix !</span>
                          <span className="item-text is-hidden">Arnaques promo</span>
                          <span className="item-text is-hidden">Prix trompeurs</span>
                        </span>
                      </span>
                    </span>
                  </h2>
                  <p className="pa-hero-sub">
                    Nous détectons les fausses promotions avec des prix d&apos;origine gonflés artificiellement — avant que vous ne passiez à la caisse.
                  </p>
                </div>
              </div>
            </div>
            <div className="pa-hero-art" aria-hidden="true">
              <span className="pa-viz-cap">Évolution du prix affiché</span>
              <div className="pa-viz">
                <div className="pa-viz-bar" />
                <div className="pa-viz-bar" />
                <div className="pa-viz-bar" />
                <div className="pa-viz-bar" />
                <div className="pa-viz-bar" />
              </div>
              <div className="pa-viz-foot">
                <span>Historique stable</span>
                <span>Pic suspect</span>
              </div>
            </div>
          </header>

          <div className="pa-info" role="note">
            <div className="pa-info-iconwrap">
              <IconEye />
            </div>
            <div className="pa-info-body">
              <strong>Notre algorithme croise l&apos;historique des prix pour repérer les promotions trompeuses.</strong>
              <span>Comparaison multi-magasins, mise à jour continue.</span>
            </div>
            <div className="pa-info-stat">
              <span className="pa-info-stat-num">10</span>
              <span className="pa-info-stat-label">détections cette semaine</span>
            </div>
          </div>

          <div className="pa-carousel-block">
            <div className="pa-carousel-head">
              <h3 className="pa-carousel-title">Exemples récents</h3>
              <p className="pa-carousel-sub">Ancienne promotion réelle face à la nouvelle offre suspecte — les métriques parlent d&apos;elles-mêmes.</p>
            </div>
            <div className="pa-carousel-wrap">
          <button type="button" className="pa-nav pa-nav--prev" aria-label="Voir les précédents" onClick={() => scrollBy(-360)}>
            <IconChevron dir="left" />
          </button>
          <button type="button" className="pa-nav pa-nav--next" aria-label="Voir les suivants" onClick={() => scrollBy(360)}>
            <IconChevron dir="right" />
          </button>
          <div ref={scrollerRef} className="pa-scroller">
            {ALERT_PRODUCTS.map((item) => (
              <article key={item.title} className="pa-card">
                <div className="pa-card-flag">
                  <IconTriangleAlert />
                  Faux prix détecté
                </div>
                <div className="pa-card-body">
                  <div className="pa-card-top">
                    <div className="pa-thumb">
                      <img src={item.productImage} alt={item.productAlt} loading="lazy" decoding="async" />
                    </div>
                    <div className="pa-card-meta">
                      <div className="pa-shop-row">
                        <div className="pa-shop-logo">
                          <img src={item.shopLogo} alt="" />
                        </div>
                        <span className="pa-shop-name">{item.shopName}</span>
                      </div>
                      <p className="pa-brand">{item.brand}</p>
                      <h3 className="pa-card-title">{item.title}</h3>
                      <p className="pa-card-cat">{item.category}</p>
                    </div>
                  </div>
                  <div className="pa-compare">
                    <div className="pa-compare-old">
                      <p className="pa-compare-old-label">Ancienne promo (réelle)</p>
                      <div className="pa-compare-row">
                        <div className="pa-price-col">
                          <p>Prix barré</p>
                          <span className="pa-strike">{item.oldReal.crossed}</span>
                        </div>
                        <span className="pa-arrow">→</span>
                        <div className="pa-price-col">
                          <p>Prix promo</p>
                          <span>{item.oldReal.promo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pa-compare-new">
                      <p className="pa-compare-new-label">Nouvelle promo (suspecte)</p>
                      <div className="pa-compare-row">
                        <div className="pa-price-col">
                          <p>Prix barré</p>
                          <span className="pa-strike">{item.newSuspect.crossed}</span>
                        </div>
                        <span className="pa-arrow">→</span>
                        <div className="pa-price-col">
                          <p>Prix promo</p>
                          <span>{item.newSuspect.promo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pa-metrics">
                    <div className="pa-metric pa-metric--red">
                      <p>Réduction affichée</p>
                      <p>{item.metrics.displayedPct}</p>
                      <p>FAUX</p>
                    </div>
                    <div className="pa-metric pa-metric--amber">
                      <p>Prix gonflé de</p>
                      <p>{item.metrics.inflatedPct}</p>
                      <p>{item.metrics.inflatedDt}</p>
                    </div>
                    <div className="pa-metric pa-metric--teal">
                      <p>Hausse réelle</p>
                      <p>{item.metrics.realHikePct}</p>
                      <p>ÉCART</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            </div>
          </div>
          </div>

          <div className="pa-cta-wrap">
            <a className="pa-cta" href="/products/faux-prix">
              Voir tous les faux prix
              <IconArrowRight />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
