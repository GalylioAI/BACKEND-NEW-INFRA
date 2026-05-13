"use client";

import { useRef } from "react";
import type { CatalogProduct, CatalogSource } from "../../lib/api/types";
import { formatPrice, productHref, sourceLabel } from "../../lib/product-utils";
import ProductImage from "./ProductImage";

type Theme = {
  surface: string;
  border: string;
  text: string;
  textSoft: string;
  teal: string;
};

interface RecommendationsCarouselProps {
  recommendations: CatalogProduct[];
  source: CatalogSource;
  theme: Theme;
}

export default function RecommendationsCarousel({ recommendations, source, theme }: RecommendationsCarouselProps) {
  const railRef = useRef<HTMLDivElement | null>(null);

  const scrollRail = (dir: "left" | "right") => {
    const node = railRef.current;
    if (!node) return;
    const step = Math.max(180, Math.round(node.clientWidth * 0.72));
    node.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        .rec-mobile-wrap{display:block;}
        .rec-mobile-controls{display:none;}
        .rec-mobile-rail{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}
        .rec-mobile-card{
          background:${theme.surface};
          border:1px solid ${theme.border};
          border-radius:16px;
          text-decoration:none;
          padding:16px;
          display:flex;
          flex-direction:column;
          gap:10px;
          transition:border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow:0 4px 16px rgba(0,0,0,0.24);
        }
        .rec-mobile-card:hover{
          border-color:rgba(59,222,185,0.35);
          transform:translateY(-2px);
        }
        .rec-mobile-media{
          height:160px;
          border-radius:10px;
          overflow:hidden;
          background:linear-gradient(135deg,#16161f,#1a1a28);
          display:flex;align-items:center;justify-content:center;
          padding:12px;
          position:relative;
        }
        @media(max-width:767px){
          .rec-mobile-controls{
            display:flex;
            align-items:center;
            justify-content:flex-end;
            gap:8px;
            margin-bottom:10px;
          }
          .rec-mobile-arrow{
            width:34px;height:34px;border-radius:999px;
            border:1px solid rgba(255,255,255,0.3);
            background:rgba(255,255,255,0.05);
            color:#fff;display:inline-flex;align-items:center;justify-content:center;
            cursor:pointer;
          }
          .rec-mobile-rail{
            display:flex;
            overflow-x:auto;
            gap:10px;
            padding:2px 2px 6px;
            scroll-snap-type:x mandatory;
            scrollbar-width:none;
          }
          .rec-mobile-rail::-webkit-scrollbar{display:none;}
          .rec-mobile-card{
            min-width:162px;
            width:162px;
            flex-shrink:0;
            padding:10px;
            border-radius:12px;
            gap:8px;
            scroll-snap-align:start;
          }
          .rec-mobile-media{
            height:102px;
            padding:8px;
            border-radius:8px;
          }
          .rec-mobile-brand{font-size:9px !important;}
          .rec-mobile-name{font-size:11px !important;line-height:1.3 !important;}
          .rec-mobile-price{font-size:13px !important;}
          .rec-mobile-link{font-size:10px !important;}
        }

        /* Light mode */
        [data-theme="light"] .rec-mobile-card {
          background: #ffffff !important;
          border-color: rgba(91,33,182,0.12) !important;
          box-shadow: 0 4px 16px rgba(91,33,182,0.08) !important;
        }
        [data-theme="light"] .rec-mobile-card:hover {
          border-color: rgba(91,33,182,0.3) !important;
          box-shadow: 0 8px 28px rgba(91,33,182,0.14) !important;
        }
        [data-theme="light"] .rec-mobile-media {
          background: linear-gradient(135deg, #f0eefe, #ede9fe) !important;
        }
        [data-theme="light"] .rec-mobile-brand {
          color: #7C3AED !important;
        }
        [data-theme="light"] .rec-mobile-name {
          color: #1e1b4b !important;
        }
        [data-theme="light"] .rec-mobile-price {
          color: #1e1b4b !important;
        }
        [data-theme="light"] .rec-mobile-link {
          color: #7C3AED !important;
        }
        [data-theme="light"] .rec-mobile-arrow {
          border-color: rgba(91,33,182,0.25) !important;
          background: rgba(91,33,182,0.06) !important;
          color: #5B21B6 !important;
        }
        [data-theme="light"] .rec-mobile-card [style*="border-top"] {
          border-color: rgba(91,33,182,0.10) !important;
        }
      `}</style>

      <div className="rec-mobile-wrap">
        <div className="rec-mobile-controls">
          <button type="button" className="rec-mobile-arrow" aria-label="Produits precedents" onClick={() => scrollRail("left")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button type="button" className="rec-mobile-arrow" aria-label="Produits suivants" onClick={() => scrollRail("right")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        <div ref={railRef} className="rec-mobile-rail">
          {recommendations.map((item) => (
            <a key={item.id} href={productHref(item, source)} className="rec-mobile-card">
              <div className="rec-mobile-media">
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 40%, rgba(59,222,185,0.04), transparent 60%)" }} />
                <ProductImage src={item.image || ""} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <span className="rec-mobile-brand" style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.teal }}>
                  {item.brand || sourceLabel(source)}
                </span>
                <span className="rec-mobile-name" style={{ fontSize: 13, lineHeight: 1.45, color: theme.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.name}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${theme.border}` }}>
                <span className="rec-mobile-price" style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>{formatPrice(item.bestPrice)}</span>
                <span className="rec-mobile-link" style={{ fontSize: 11, color: theme.teal, fontWeight: 700 }}>Voir →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
