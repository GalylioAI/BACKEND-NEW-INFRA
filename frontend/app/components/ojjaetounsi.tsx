"use client";

import { useState } from "react";

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
  Monoprix: { color: "#EF4444" },
  Carrefour: { color: "#2563EB" },
  GeantDrive: { color: "#16A34A" },
} as const;

type ShopName = keyof typeof shopStyles;
type TooltipSide = "top" | "bottom" | "left" | "right";

type ShopPrice = {
  name: ShopName;
  price: number;
};

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

const ingredients: Ingredient[] = [
  {
    name: "Ail Frais",
    brand: "Locale",
    size: "250g",
    badge: "Legumes",
    icon: "garlic",
    accent: "#C7A7FF",
    left: "16%",
    top: "23%",
    delay: "0s",
    tooltipSide: "bottom",
    shops: [
      { name: "Carrefour", price: 4.25 },
      { name: "Monoprix", price: 4.5 },
      { name: "GeantDrive", price: 4.75 },
    ],
  },
  {
    name: "Oignons Blancs",
    brand: "Locale",
    size: "1kg",
    badge: "Legumes",
    icon: "onions",
    accent: "#F3C864",
    left: "50%",
    top: "15%",
    delay: "0.35s",
    tooltipSide: "bottom",
    shops: [
      { name: "Carrefour", price: 1.99 },
      { name: "Monoprix", price: 2.15 },
      { name: "GeantDrive", price: 2.25 },
    ],
  },
  {
    name: "Harissa",
    brand: "Cap Bon",
    size: "135g",
    badge: "Epices",
    icon: "harissa",
    accent: "#FF7D54",
    left: "84%",
    top: "23%",
    delay: "0.7s",
    tooltipSide: "bottom",
    shops: [
      { name: "Carrefour", price: 1.35 },
      { name: "Monoprix", price: 1.45 },
      { name: "GeantDrive", price: 1.55 },
    ],
  },
  {
    name: "Concentre de Tomates",
    brand: "Sicam",
    size: "400g",
    badge: "Conserves",
    icon: "tomatoPaste",
    accent: "#FF9075",
    left: "10%",
    top: "56%",
    delay: "1.05s",
    tooltipSide: "right",
    shops: [
      { name: "Carrefour", price: 1.85 },
      { name: "Monoprix", price: 1.95 },
      { name: "GeantDrive", price: 2.1 },
    ],
  },
  {
    name: "Sel de Table",
    brand: "Cotusal",
    size: "500g",
    badge: "Epices",
    icon: "salt",
    accent: "#D8DEE8",
    left: "90%",
    top: "56%",
    delay: "1.4s",
    tooltipSide: "left",
    shops: [
      { name: "Carrefour", price: 0.75 },
      { name: "Monoprix", price: 0.85 },
      { name: "GeantDrive", price: 0.9 },
    ],
  },
  {
    name: "Huile Vegetale",
    brand: "Nejma",
    size: "1L",
    badge: "Huiles",
    icon: "oliveOil",
    accent: "#F3CA59",
    left: "19%",
    top: "82%",
    delay: "1.75s",
    tooltipSide: "top",
    shops: [
      { name: "Carrefour", price: 4.69 },
      { name: "Monoprix", price: 4.85 },
      { name: "GeantDrive", price: 4.95 },
    ],
  },
  {
    name: "Tomates Fraiches",
    brand: "Locale",
    size: "1kg",
    badge: "Legumes",
    icon: "tomatoes",
    accent: "#FF6F61",
    left: "50%",
    top: "88%",
    delay: "2.1s",
    tooltipSide: "top",
    shops: [
      { name: "Carrefour", price: 2.99 },
      { name: "Monoprix", price: 3.25 },
      { name: "GeantDrive", price: 3.45 },
    ],
  },
  {
    name: "Oeufs Frais",
    brand: "El Mazraa",
    size: "6 pcs",
    badge: "Produits frais",
    icon: "eggs",
    accent: "#F5D783",
    left: "81%",
    top: "84%",
    delay: "2.45s",
    tooltipSide: "top",
    shops: [
      { name: "Carrefour", price: 3.59 },
      { name: "Monoprix", price: 3.75 },
      { name: "GeantDrive", price: 3.89 },
    ],
  },
];

function formatPrice(price: number) {
  return `${price.toFixed(3)} DT`;
}

function sortShops(shops: ShopPrice[]) {
  return [...shops].sort((a, b) => a.price - b.price);
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IngredientIcon({ kind }: { kind: IngredientIconKind }) {
  switch (kind) {
    case "garlic":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 8.5C19.5 10.4 20.2 12.4 20.2 14.6V16H15.8V14.6C15.8 12.4 16.5 10.4 18 8.5Z"
            fill="#7C5DE8"
          />
          <path
            d="M18 12.5C23.1 12.5 27 16.3 27 21.5C27 26.4 23.3 30 18.4 30H17.6C12.7 30 9 26.4 9 21.5C9 16.3 12.9 12.5 18 12.5Z"
            fill="#F7F3FF"
            stroke="#A78BFA"
            strokeWidth="1.5"
          />
          <path
            d="M18 12.5V30"
            stroke="#D6C7FF"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M15.2 15.3C13.4 17.5 12.8 19.8 13.1 22.4"
            stroke="#DCCEFF"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M20.8 15.3C22.6 17.5 23.2 19.8 22.9 22.4"
            stroke="#DCCEFF"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "harissa":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M23.8 9.5C24.3 8.2 25.4 7.1 26.8 6.7"
            stroke="#48B55A"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M21.8 11C16 9.6 10.3 13.4 9.4 19.2C8.5 24.8 12.6 29 17.6 29C23.7 29 29 24.2 28.6 18.1C28.4 14.4 25.8 11.8 21.8 11Z"
            fill="#FF5A43"
          />
          <path
            d="M16.1 14.8C13.1 16.3 11.2 19.1 11 22.4"
            stroke="#FFB1A4"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "eggs":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="18"
            cy="19"
            rx="8.8"
            ry="11.1"
            fill="#FFF7EA"
            stroke="#F0E2C9"
            strokeWidth="1.4"
          />
          <circle cx="15.1" cy="15.8" r="1.4" fill="#E7D8C0" />
          <circle cx="21.5" cy="18.3" r="1.2" fill="#E7D8C0" />
          <circle cx="18.2" cy="22.8" r="1.1" fill="#E7D8C0" />
        </svg>
      );
    case "oliveOil":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path d="M16 10.5H20V14.2H16V10.5Z" fill="#5E6D2F" />
          <path
            d="M14.2 14H21.8L23.3 25.8C23.5 27.7 22 29.4 20 29.4H16C14 29.4 12.5 27.7 12.7 25.8L14.2 14Z"
            fill="#F2C14C"
          />
          <path
            d="M16.5 17.2C15.4 18.6 15 20 15.2 21.8"
            stroke="#FFF2B4"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M18.7 7.6C19.9 8.7 20.5 9.7 20.5 10.8"
            stroke="#5E6D2F"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "onions":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M18 7.5C20.6 10 22 12.8 22 15.8V28"
            stroke="#C98A00"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M18 10.5C24 10.5 28 14.8 28 20.5C28 25.8 24.2 29.5 18.8 29.5H17.2C11.8 29.5 8 25.8 8 20.5C8 14.8 12 10.5 18 10.5Z"
            fill="#FFCB45"
            stroke="#D89716"
            strokeWidth="1.5"
          />
          <path
            d="M18 10.5V29.5"
            stroke="#E3A93C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M13.5 12.5C11.7 14.6 10.8 17.1 10.9 20"
            stroke="#FFE18B"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M22.5 12.5C24.3 14.6 25.2 17.1 25.1 20"
            stroke="#FFE18B"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "salt":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14.8 9.5H21.2L22.4 14.2L23.5 27.1C23.6 28.6 22.4 29.8 20.9 29.8H15.1C13.6 29.8 12.4 28.6 12.5 27.1L13.6 14.2L14.8 9.5Z"
            fill="#F7F7F9"
            stroke="#D7DAE1"
            strokeWidth="1.4"
          />
          <path
            d="M14.6 13.8H21.4"
            stroke="#B9C1CC"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="16.4" cy="21.5" r="0.9" fill="#CED4DD" />
          <circle cx="20.1" cy="19.4" r="0.8" fill="#CED4DD" />
          <circle cx="18.1" cy="24.1" r="0.9" fill="#CED4DD" />
        </svg>
      );
    case "tomatoPaste":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 9.2H24V26.8C24 28.1 22.9 29.2 21.6 29.2H14.4C13.1 29.2 12 28.1 12 26.8V9.2Z"
            fill="#D1E37A"
          />
          <path
            d="M11 9.2H25"
            stroke="#51630D"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M12 13H24" stroke="#92B14B" strokeWidth="1.6" />
          <path d="M12 24H24" stroke="#92B14B" strokeWidth="1.6" />
          <circle cx="18" cy="19" r="4.8" fill="#FFC42F" />
          <path
            d="M18 14.2L19.2 16L21.4 15.9L19.9 17.5L20.4 19.7L18.4 18.9L16.6 20.2L16.7 18L15 16.7L17.1 16.2L18 14.2Z"
            fill="#4FB25E"
          />
        </svg>
      );
    case "tomatoes":
      return (
        <svg
          width="34"
          height="34"
          viewBox="0 0 36 36"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="18" cy="18" r="9.5" fill="#EF4E42" />
          <path
            d="M18 9.3L20.1 12.4L23.9 12.1L21.4 15L22.3 18.8L18.8 17.4L15.7 19.6L15.8 15.8L12.9 13.4L16.5 12.5L18 9.3Z"
            fill="#4AB05A"
          />
          <circle cx="18" cy="18" r="4.2" fill="#FF8E80" opacity="0.45" />
        </svg>
      );
  }
}

function OjjaDishArtwork() {
  return (
    <svg
      viewBox="0 0 320 320"
      width="100%"
      height="100%"
      role="img"
      aria-label="Stylized ojja tounsia dish"
    >
      <defs>
        <radialGradient id="ojjaDishSauce" cx="32%" cy="24%" r="78%">
          <stop offset="0%" stopColor="#FFBE72" />
          <stop offset="48%" stopColor="#EE6A34" />
          <stop offset="100%" stopColor="#8B1F15" />
        </radialGradient>
        <radialGradient id="ojjaDishYolk" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE38F" />
          <stop offset="100%" stopColor="#F5A623" />
        </radialGradient>
        <linearGradient
          id="ojjaDishMerguez"
          x1="70"
          y1="190"
          x2="248"
          y2="155"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#C84C2C" />
          <stop offset="45%" stopColor="#8F2E20" />
          <stop offset="100%" stopColor="#F5955E" />
        </linearGradient>
        <filter
          id="ojjaDishShadow"
          x="33"
          y="41"
          width="254"
          height="240"
          filterUnits="userSpaceOnUse"
        >
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="16"
            floodColor="#4A170F"
            floodOpacity="0.32"
          />
        </filter>
      </defs>

      <g filter="url(#ojjaDishShadow)">
        <circle cx="160" cy="165" r="109" fill="url(#ojjaDishSauce)" />
      </g>

      <circle cx="99" cy="121" r="16" fill="#B42C1D" opacity="0.88" />
      <circle cx="121" cy="94" r="12" fill="#D54B2A" opacity="0.9" />
      <circle cx="245" cy="133" r="13" fill="#B73121" opacity="0.82" />
      <circle cx="208" cy="92" r="11" fill="#CF4726" opacity="0.84" />

      <ellipse cx="118" cy="140" rx="42" ry="34" fill="#FFF8EC" />
      <ellipse cx="205" cy="190" rx="45" ry="37" fill="#FFF8EC" />
      <circle cx="118" cy="141" r="15" fill="url(#ojjaDishYolk)" />
      <circle cx="205" cy="190" r="17" fill="url(#ojjaDishYolk)" />

      <path
        d="M78 225C114 195 161 175 229 164"
        stroke="url(#ojjaDishMerguez)"
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M100 96C139 112 188 107 239 121"
        stroke="url(#ojjaDishMerguez)"
        strokeWidth="18"
        strokeLinecap="round"
        opacity="0.95"
      />

      <path
        d="M84 174C104 157 118 139 126 111"
        stroke="#56C167"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M228 234C246 218 257 198 260 176"
        stroke="#5CBF64"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M210 98C234 117 249 136 257 157"
        stroke="#F24934"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M150 238C167 224 182 208 192 186"
        stroke="#6ACB73"
        strokeWidth="9"
        strokeLinecap="round"
      />

      <g fill="#3E8A42">
        <circle cx="87" cy="205" r="4.2" />
        <circle cx="112" cy="228" r="3.8" />
        <circle cx="145" cy="92" r="3.4" />
        <circle cx="174" cy="244" r="3.6" />
        <circle cx="228" cy="106" r="3.9" />
        <circle cx="249" cy="209" r="4" />
        <circle cx="202" cy="123" r="3.2" />
        <circle cx="139" cy="209" r="3.6" />
      </g>

      <g fill="#704214">
        <circle cx="94" cy="167" r="2.2" />
        <circle cx="108" cy="181" r="1.8" />
        <circle cx="141" cy="165" r="1.7" />
        <circle cx="161" cy="116" r="1.8" />
        <circle cx="188" cy="146" r="1.8" />
        <circle cx="236" cy="182" r="2" />
        <circle cx="222" cy="214" r="2.1" />
        <circle cx="175" cy="214" r="1.9" />
        <circle cx="126" cy="248" r="1.8" />
      </g>

      <path
        d="M138 66C146 54 158 50 171 53"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.24"
      />
      <path
        d="M189 69C196 58 208 55 218 57"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.18"
      />
    </svg>
  );
}

function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const sortedShops = sortShops(ingredient.shops);
  const bestShop = sortedShops[0];

  return (
    <article
      className="ojja-ingredient-card"
      data-side={ingredient.tooltipSide}
      tabIndex={0}
      aria-label={`${ingredient.name}, meilleur prix ${formatPrice(bestShop.price)} chez ${bestShop.name}`}
      style={{
        left: ingredient.left,
        top: ingredient.top,
        animationDelay: ingredient.delay,
        borderColor: `${ingredient.accent}33`,
        boxShadow: `0 22px 44px rgba(0, 0, 0, 0.26), 0 0 0 1px ${ingredient.accent}12`,
      }}
    >
      <div
        className="ojja-ingredient-icon"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${ingredient.accent}33, rgba(255, 255, 255, 0.04))`,
        }}
      >
        <IngredientIcon kind={ingredient.icon} />
      </div>

      <div className="ojja-ingredient-brand">{ingredient.brand}</div>
      <div className="ojja-ingredient-name">{ingredient.name}</div>

      <div className="ojja-ingredient-meta">
        <span>{ingredient.size}</span>
        <span className="ojja-ingredient-badge">{ingredient.badge}</span>
      </div>

      <div className="ojja-ingredient-best">
        <span
          className="ojja-shop-dot"
          style={{ backgroundColor: shopStyles[bestShop.name].color }}
          aria-hidden="true"
        />
        <span>{formatPrice(bestShop.price)}</span>
      </div>

      <div className="ojja-ingredient-tooltip">
        <div className="ojja-ingredient-tooltip__title">Top 3 shops</div>
        {sortedShops.map((shop, index) => (
          <div
            key={`${ingredient.name}-${shop.name}`}
            className={`ojja-price-row${index === 0 ? " is-best" : ""}`}
          >
            <span className="ojja-price-row__shop">
              <span
                className="ojja-shop-dot"
                style={{ backgroundColor: shopStyles[shop.name].color }}
                aria-hidden="true"
              />
              {shop.name}
            </span>
            <span className="ojja-price-row__value">
              {formatPrice(shop.price)}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function computeRecipeTotals() {
  const totals: Record<ShopName, number> = {
    Carrefour: 0,
    Monoprix: 0,
    GeantDrive: 0,
  };
  for (const ing of ingredients) {
    for (const shop of ing.shops) {
      totals[shop.name] += shop.price;
    }
  }
  const sorted = (Object.entries(totals) as [ShopName, number][]).sort(
    (a, b) => a[1] - b[1],
  );
  const avg =
    Object.values(totals).reduce((s, v) => s + v, 0) /
    Object.values(totals).length;
  return { totals, sorted, avg };
}

const recipeTotals = computeRecipeTotals();

function OjjaEtTounsiSection() {
  const [plateTapped, setPlateTapped] = useState(false);

  return (
    <section className="ojja-section">
      <style>{`
        .ojja-section {
          position: relative;
          overflow: visible;
          padding: 110px 0 120px;
          background:
            radial-gradient(circle at 16% 12%, rgba(59, 222, 185, 0.14), transparent 28%),
            radial-gradient(circle at 82% 18%, rgba(255, 117, 74, 0.14), transparent 24%),
            linear-gradient(180deg, #07130f 0%, #091b17 52%, #07130f 100%);
        }

        .ojja-section .container-1,
        .ojja-stage,
        .ojja-stage__canvas,
        .ojja-stage__cards {
          position: relative;
          overflow: visible;
        }

        .ojja-section__glow {
          position: absolute;
          width: 430px;
          height: 430px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.7;
          pointer-events: none;
        }

        .ojja-section__glow--left {
          left: -120px;
          top: 60px;
          background: rgba(59, 222, 185, 0.18);
        }

        .ojja-section__glow--right {
          right: -80px;
          bottom: 40px;
          background: rgba(255, 117, 74, 0.18);
        }

        .ojja-section__intro {
          max-width: 820px;
          margin: 0 auto 56px;
          text-align: center;
        }

        .ojja-section__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          margin-bottom: 18px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(9, 20, 17, 0.74);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.16);
          color: #D7F8D0;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .ojja-section__eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(90deg, #3BDEB9 0%, #77E590 55%, #CCFF9B 100%);
          box-shadow: 0 0 0 6px rgba(59, 222, 185, 0.12);
        }

        .ojja-section__legend {
          display: flex;
          justify-content: center;
          gap: 18px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }

        .ojja-section__legend-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          font-weight: 600;
        }

        .ojja-section__legend-item .ojja-shop-dot {
          width: 10px;
          height: 10px;
        }

        .ojja-section__intro .heading {
          margin-bottom: 18px;
          font-size: clamp(2.45rem, 5vw, 4.3rem);
          line-height: 1.04;
          letter-spacing: -0.045em;
          color: #FFFFFF;
        }

        .ojja-section__intro p {
          max-width: 720px;
          margin: 0 auto;
          color: rgba(255, 255, 255, 0.62);
          font-size: 16px;
          line-height: 1.7;
        }

        .ojja-stage {
          position: relative;
        }

        .ojja-stage__canvas {
          position: relative;
          min-height: 860px;
        }

        .ojja-stage__ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(74vw, 620px);
          aspect-ratio: 1;
          border-radius: 50%;
          border: 1px dashed rgba(255, 255, 255, 0.08);
          transform: translate(-50%, -50%);
        }

        .ojja-stage__ring::before,
        .ojja-stage__ring::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          inset: 0;
        }

        .ojja-stage__ring::before {
          inset: 8%;
          border: 1px solid rgba(59, 222, 185, 0.12);
        }

        .ojja-stage__ring::after {
          inset: 22%;
          border: 1px solid rgba(255, 127, 76, 0.12);
        }

        .ojja-stage__plate {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(36vw, 360px);
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          padding: 14px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
          box-shadow:
            0 32px 84px rgba(0, 0, 0, 0.45),
            0 0 0 1px rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          animation: ojja-plate-float 6s ease-in-out infinite;
        }

        .ojja-stage__plate::before {
          content: "";
          position: absolute;
          inset: -18px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59, 222, 185, 0.24), transparent 62%);
          filter: blur(18px);
          opacity: 0.75;
          z-index: -1;
        }

        .ojja-stage__plate-surface {
          width: 100%;
          height: 100%;
          padding: 14px;
          border-radius: 50%;
          background: linear-gradient(145deg, #4D3628 0%, #171210 52%, #6B503A 100%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }

        .ojja-stage__plate-core {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background:
            radial-gradient(circle at 40% 32%, rgba(255, 255, 255, 0.36), transparent 28%),
            linear-gradient(180deg, #FFF9EE 0%, #F5EDE0 100%);
          box-shadow:
            inset 0 18px 28px rgba(255, 255, 255, 0.38),
            inset 0 -10px 18px rgba(0, 0, 0, 0.14);
        }

        .ojja-stage__cards {
          position: absolute;
          inset: 0;
          isolation: isolate;
        }

        .ojja-ingredient-card {
          position: absolute;
          width: 160px;
          min-height: 196px;
          padding: 16px 14px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border-radius: 24px;
          transform: translate(-50%, -50%);
          background: rgba(10, 18, 22, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.09);
          backdrop-filter: blur(16px);
          animation: ojja-card-float 6.6s ease-in-out infinite;
          outline: none;
          z-index: 1;
        }

        .ojja-ingredient-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 42%);
          opacity: 0.6;
          pointer-events: none;
        }

        .ojja-ingredient-card:hover,
        .ojja-ingredient-card:focus-visible {
          animation-play-state: paused;
          transform: translate(-50%, -50%) translateY(-10px) scale(1.02);
          z-index: 20;
          box-shadow:
            0 28px 60px rgba(0, 0, 0, 0.34),
            0 0 0 1px rgba(59, 222, 185, 0.18);
          border-color: rgba(59, 222, 185, 0.42) !important;
        }

        .ojja-ingredient-icon {
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
          position: relative;
          z-index: 1;
        }

        .ojja-ingredient-brand {
          position: relative;
          z-index: 1;
          color: #FF7F3F;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-align: center;
        }

        .ojja-ingredient-name {
          position: relative;
          z-index: 1;
          color: rgba(255, 255, 255, 0.96);
          font-size: 16px;
          font-weight: 700;
          line-height: 1.22;
          text-align: center;
          letter-spacing: -0.01em;
        }

        .ojja-ingredient-meta {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          color: rgba(255, 255, 255, 0.58);
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
        }

        .ojja-ingredient-badge {
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(255, 127, 63, 0.12);
          color: #FFB285;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .ojja-ingredient-best {
          position: relative;
          z-index: 1;
          margin-top: 2px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(64, 255, 163, 0.1);
          border: 1px solid rgba(64, 255, 163, 0.3);
          color: #A8FFD3;
          font-size: 13px;
          font-weight: 800;
          line-height: 1;
        }

        .ojja-shop-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ojja-ingredient-tooltip {
          position: absolute;
          z-index: 5;
          width: min(220px, calc(100vw - 32px));
          max-width: calc(100vw - 32px);
          padding: 14px;
          border-radius: 22px;
          background: rgba(7, 14, 18, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 28px 48px rgba(0, 0, 0, 0.38);
          opacity: 0;
          pointer-events: none;
          transition:
            opacity 0.24s ease,
            transform 0.24s ease;
        }

        .ojja-ingredient-card[data-side="bottom"] .ojja-ingredient-tooltip {
          top: calc(100% + 14px);
          left: 50%;
          transform: translate(-50%, 12px);
        }

        .ojja-ingredient-card[data-side="top"] .ojja-ingredient-tooltip {
          bottom: calc(100% + 14px);
          left: 50%;
          transform: translate(-50%, -12px);
        }

        .ojja-ingredient-card[data-side="left"] .ojja-ingredient-tooltip {
          right: calc(100% + 14px);
          top: 50%;
          transform: translate(-12px, -50%);
        }

        .ojja-ingredient-card[data-side="right"] .ojja-ingredient-tooltip {
          left: calc(100% + 14px);
          top: 50%;
          transform: translate(12px, -50%);
        }

        .ojja-ingredient-card:hover .ojja-ingredient-tooltip,
        .ojja-ingredient-card:focus-visible .ojja-ingredient-tooltip {
          opacity: 1;
          pointer-events: auto;
        }

        .ojja-ingredient-card[data-side="bottom"]:hover .ojja-ingredient-tooltip,
        .ojja-ingredient-card[data-side="bottom"]:focus-visible .ojja-ingredient-tooltip,
        .ojja-ingredient-card[data-side="top"]:hover .ojja-ingredient-tooltip,
        .ojja-ingredient-card[data-side="top"]:focus-visible .ojja-ingredient-tooltip {
          transform: translate(-50%, 0);
        }

        .ojja-ingredient-card[data-side="left"]:hover .ojja-ingredient-tooltip,
        .ojja-ingredient-card[data-side="left"]:focus-visible .ojja-ingredient-tooltip,
        .ojja-ingredient-card[data-side="right"]:hover .ojja-ingredient-tooltip,
        .ojja-ingredient-card[data-side="right"]:focus-visible .ojja-ingredient-tooltip {
          transform: translate(0, -50%);
        }

        .ojja-ingredient-tooltip__title {
          margin-bottom: 10px;
          color: rgba(255, 255, 255, 0.66);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .ojja-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .ojja-price-row + .ojja-price-row {
          margin-top: 8px;
        }

        .ojja-price-row.is-best {
          background: rgba(64, 255, 163, 0.08);
          border-color: rgba(64, 255, 163, 0.22);
        }

        .ojja-price-row__shop {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.84);
          font-size: 13px;
          font-weight: 600;
        }

        .ojja-price-row__value {
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .ojja-price-row.is-best .ojja-price-row__value {
          color: #A8FFD3;
        }

        .ojja-section__footer {
          margin-top: 40px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-radius: 999px;
          background: rgba(8, 17, 20, 0.68);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.22);
        }

        .ojja-section__footer p {
          margin: 0;
          color: rgba(255, 255, 255, 0.64);
          font-size: 15px;
          line-height: 1.6;
        }

        .ojja-section__cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 22px;
          border-radius: 999px;
          background: linear-gradient(90deg, #3BDEB9 0%, #77E590 55%, #CCFF9B 100%);
          color: #05110D;
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          box-shadow: 0 16px 34px rgba(59, 222, 185, 0.24);
        }

        .ojja-section__cta svg {
          transition: transform 0.25s ease;
        }

        .ojja-section__cta:hover svg {
          transform: translateX(4px);
        }

        @keyframes ojja-plate-float {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-10px);
          }
        }

        @keyframes ojja-card-float {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-12px);
          }
        }

        @media (max-width: 1120px) {
          .ojja-stage__canvas {
            min-height: 790px;
          }

          .ojja-stage__plate {
            width: min(40vw, 330px);
          }

          .ojja-ingredient-card {
            width: 148px;
            min-height: 188px;
          }

          .ojja-ingredient-tooltip {
            width: 208px;
          }
        }

        /* ── Dish hover overlay ──────────────────────────── */
        /* Sits directly inside .ojja-stage__plate (position:absolute),
           outside plate-core which has overflow:hidden + border-radius:50% */
        .ojja-dish-hover__overlay {
          position: absolute;
          inset: 14px; /* matches plate padding so it covers the dish area */
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 18px;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(6px);
          opacity: 0;
          transition: opacity 0.26s ease;
          z-index: 10;
          text-align: center;
          pointer-events: none;
          overflow: hidden;
        }

        .ojja-stage__plate:hover .ojja-dish-hover__overlay,
        .ojja-stage__plate:focus-within .ojja-dish-hover__overlay,
        .ojja-stage__plate.is-tapped .ojja-dish-hover__overlay {
          opacity: 1;
        }

        .ojja-dish-overlay__label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }

        .ojja-dish-overlay__title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.04em;
          line-height: 1.3;
        }

        .ojja-dish-overlay__price {
          font-size: 22px;
          font-weight: 900;
          color: #A8FFD3;
          letter-spacing: -0.5px;
          line-height: 1;
        }

        .ojja-dish-overlay__sub {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.38);
          font-weight: 600;
        }

        .ojja-dish-overlay__divider {
          width: 32px;
          height: 1px;
          background: rgba(255, 255, 255, 0.12);
          margin: 2px 0;
        }

        .ojja-dish-overlay__row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.55);
        }

        .ojja-dish-overlay__row .ojja-shop-dot {
          width: 6px;
          height: 6px;
        }

        /* ── Mobile ──────────────────────────────────────── */
        @media (max-width: 767px) {
          .ojja-section {
            padding: 84px 0 92px;
          }

          .ojja-section__intro {
            margin-bottom: 38px;
          }

          .ojja-section__legend {
            gap: 12px;
          }

          .ojja-stage__canvas {
            min-height: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }

          .ojja-stage__ring {
            display: none;
          }

          .ojja-stage__plate {
            position: relative;
            left: auto;
            top: auto;
            width: min(84vw, 300px);
            transform: none;
            animation-name: ojja-plate-float-mobile;
            cursor: pointer;
          }


          .ojja-stage__cards {
            position: relative;
            inset: auto;
            width: 100%;
            max-width: 480px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .ojja-ingredient-card {
            position: relative;
            left: auto !important;
            top: auto !important;
            width: 100%;
            min-height: auto;
            transform: none;
            animation: none;
            padding: 14px 12px 12px;
          }

          .ojja-ingredient-card:hover,
          .ojja-ingredient-card:focus-visible {
            transform: translateY(-3px);
          }

          /* tooltip always visible on mobile — sits below card content */
          .ojja-ingredient-tooltip {
            position: static !important;
            width: 100%;
            margin-top: 10px;
            opacity: 1 !important;
            pointer-events: auto;
            transform: none !important;
            background: rgba(0, 0, 0, 0.5);
            border-color: rgba(255, 255, 255, 0.06);
            padding: 10px;
            border-radius: 16px;
          }

          .ojja-price-row {
            padding: 8px 10px;
          }

          .ojja-price-row__shop,
          .ojja-price-row__value {
            font-size: 12px;
          }

          .ojja-section__footer {
            flex-direction: column;
            align-items: flex-start;
            border-radius: 28px;
          }
        }

        @keyframes ojja-plate-float-mobile {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ojja-stage__plate,
          .ojja-ingredient-card {
            animation: none !important;
          }

          .ojja-ingredient-tooltip {
            transition: none !important;
          }
        }
      `}</style>

      <div className="ojja-section__glow ojja-section__glow--left" />
      <div className="ojja-section__glow ojja-section__glow--right" />

      <div className="container-1">
        <div className="heading-section center ojja-section__intro">
          <div className="ojja-section__eyebrow">
            <span className="ojja-section__eyebrow-dot" />
            Panier du quotidien
          </div>

          <div className="ojja-section__legend">
            {shopLegend.map((shop) => (
              <span key={shop} className="ojja-section__legend-item">
                <span
                  className="ojja-shop-dot"
                  style={{ backgroundColor: shopStyles[shop].color }}
                  aria-hidden="true"
                />
                {shop}
              </span>
            ))}
          </div>

          <div className="heading">
            Comparez une{" "}
            <span className="font-playfair-display text-gradient">ojja</span>
            <br />
            ingredient par ingredient
          </div>

          <p>
            Les prix ci-dessous viennent des captures que vous avez envoyees.
            Passez la souris sur chaque ingredient pour afficher automatiquement
            le top 3 des boutiques les moins cheres.
          </p>
        </div>

        <div className="ojja-stage">
          <div className="ojja-stage__canvas">
            <div className="ojja-stage__ring" />

            <div
              className={`ojja-stage__plate${plateTapped ? " is-tapped" : ""}`}
              tabIndex={0}
              role="button"
              aria-label="Prix moyen de la recette ojja"
              onClick={() => setPlateTapped((v) => !v)}
              onKeyDown={(e) => e.key === "Enter" && setPlateTapped((v) => !v)}
            >
              <div className="ojja-stage__plate-surface">
                <div className="ojja-stage__plate-core">
                  <OjjaDishArtwork />
                </div>
              </div>
              {/* overlay lives OUTSIDE plate-core so overflow:hidden doesn't clip it */}
              <div className="ojja-dish-hover__overlay" aria-hidden="true">
                <div className="ojja-dish-overlay__label">
                  Couffin · 8 ingrédients
                </div>
                <div className="ojja-dish-overlay__divider" />
                <div className="ojja-dish-overlay__title">
                  Prix moyen recette
                </div>
                <div className="ojja-dish-overlay__price">
                  {formatPrice(recipeTotals.avg)}
                </div>
                <div className="ojja-dish-overlay__divider" />
                {recipeTotals.sorted.map(([shop, total], i) => (
                  <div key={shop} className="ojja-dish-overlay__row">
                    <span
                      className="ojja-shop-dot"
                      style={{ backgroundColor: shopStyles[shop].color }}
                    />
                    <span style={{ color: i === 0 ? "#A8FFD3" : undefined }}>
                      {shop}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: i === 0 ? "#A8FFD3" : undefined,
                        fontWeight: 800,
                      }}
                    >
                      {formatPrice(total)}
                    </span>
                  </div>
                ))}
                <div className="ojja-dish-overlay__sub">
                  Meilleur prix : {recipeTotals.sorted[0][0]}
                </div>
              </div>
            </div>

            <div className="ojja-stage__cards">
              {ingredients.map((ingredient) => (
                <IngredientCard key={ingredient.name} ingredient={ingredient} />
              ))}
            </div>
          </div>
        </div>

        <div className="ojja-section__footer">
          <p>
            Le meilleur prix de chaque ingredient est visible sur la carte, et
            le hover ouvre le classement complet Monoprix, Carrefour et
            GeantDrive.
          </p>
          <a href="/products" className="ojja-section__cta">
            Explorer le panier
            <ArrowRightIcon />
          </a>
        </div>
      </div>
    </section>
  );
}

export function AboutIntroSection() {
  return <OjjaEtTounsiSection />;
}

export default OjjaEtTounsiSection;
