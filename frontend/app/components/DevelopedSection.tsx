"use client";
import { useEffect, useState } from "react";

const boostRows = [
  {
    items: ["Comparaison de Prix", "Veille Concurrentielle", "Alertes Prix"],
    reverse: false,
    duration: "30s",
  },
  {
    items: [
      "Détection Faux Prix",
      "Benchmarking",
      "50K+ Produits",
      "10+ Magasins",
    ],
    reverse: true,
    duration: "38s",
  },
  {
    items: ["Prédiction IA", "Supermarché", "Parapharmacie", "Électroménager"],
    reverse: false,
    duration: "40s",
  },
];

function BoostRow({
  items,
  reverse,
  duration,
}: {
  items: string[];
  reverse: boolean;
  duration: string;
}) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div style={{ overflow: "hidden" }}>
      <div
        className="tf-brand style-2"
        style={{
          display: "flex",
          flexFlow: "row nowrap",
          alignItems: "center",
          width: "max-content",
          animation: `boost-scroll-${reverse ? "reverse" : "forward"} ${duration} linear infinite`,
        }}
      >
        {repeated.map((text, i) => (
          <div
            key={i}
            className="brand-item boost-item"
            style={{ flex: "0 0 auto" }}
          >
            <div className="text-gradient">{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// French tokens: strings or {highlight: true, text: string} or {br: true}
type FrToken =
  | { type: "text"; val: string }
  | { type: "highlight"; val: string }
  | { type: "br" };

const frTokens: FrToken[] = [
  { type: "text", val: "Surveillez" },
  { type: "text", val: " les " },
  { type: "highlight", val: "PRIX EN LIGNE" },
  { type: "br" },
  { type: "text", val: " avant " },
  { type: "text", val: "d'acheter" },
  { type: "text", val: " un" },
  { type: "text", val: " produit." },
];

const arWords = ["ثبت", " قبل", " ما", " تشري", " أي حاجة !"];

type Phase = "typing-fr" | "hold-fr" | "typing-ar" | "hold-ar" | "reset";

export default function DevelopedSection() {
  const [frCount, setFrCount] = useState(0);
  const [arCount, setArCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing-fr");

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;

    if (phase === "typing-fr") {
      if (frCount < frTokens.length) {
        id = setTimeout(() => setFrCount((c) => c + 1), 260);
      } else {
        id = setTimeout(() => setPhase("hold-fr"), 1400);
      }
    } else if (phase === "hold-fr") {
      id = setTimeout(() => setPhase("typing-ar"), 100);
    } else if (phase === "typing-ar") {
      if (arCount < arWords.length) {
        id = setTimeout(() => setArCount((c) => c + 1), 320);
      } else {
        id = setTimeout(() => setPhase("hold-ar"), 2200);
      }
    } else if (phase === "hold-ar") {
      id = setTimeout(() => setPhase("reset"), 100);
    } else if (phase === "reset") {
      setFrCount(0);
      setArCount(0);
      id = setTimeout(() => setPhase("typing-fr"), 400);
    }

    return () => clearTimeout(id);
  }, [phase, frCount, arCount]);

  return (
    <section className="section-developed">
      <style>{`
        @font-face {
          font-family: "RetroBrushArabic";
          src: url("/fonts/RetroBrushArabicPersonalUseOnly-Regular.otf") format("opentype");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        @keyframes boost-scroll-forward {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes boost-scroll-reverse {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .boost-item {
          padding: 0 8px;
        }
        .boost-item .text-gradient {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #0f172a !important;
          background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.84));
          border: 1px solid rgba(148,163,184,0.34);
          box-shadow: 0 4px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.75);
          -webkit-text-fill-color: currentColor !important;
          -webkit-background-clip: initial !important;
          background-clip: initial !important;
        }
        .boost-item:nth-child(3n) .text-gradient {
          color: #0f172a !important;
          background: linear-gradient(135deg, rgba(255,247,237,0.94), rgba(255,237,213,0.84));
          border-color: rgba(251,146,60,0.34);
        }
        .boost-item:nth-child(2n) .text-gradient {
          color: #0f172a !important;
          background: linear-gradient(135deg, rgba(245,243,255,0.94), rgba(237,233,254,0.86));
          border-color: rgba(124,58,237,0.34);
        }

        /* ── Shared screen card ── */
        .alert-screen-wrap {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          background: #030a07;
          border: 1px solid rgba(59,222,185,0.15);
          box-shadow: 0 0 0 1px rgba(59,222,185,0.08), 0 24px 64px rgba(0,0,0,0.6);
          min-height: 446px;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .section-developed .row {
            align-items: stretch;
          }
          .section-developed .col-md-8,
          .section-developed .col-md-4 {
            display: flex;
          }
          .section-developed .col-md-8 .alert-screen-wrap,
          .section-developed .col-md-4 .alert-screen-wrap {
            width: 100%;
            height: 100%;
          }
        }
        .alert-screen-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 3px,
            rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px
          );
          pointer-events: none;
          z-index: 1;
        }
        .alert-screen-wrap::after {
          content: '';
          position: absolute;
          top: -60px; left: -60px;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,222,185,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .alert-screen-inner {
          position: relative;
          z-index: 2;
          padding: 38px 40px 32px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        /* Corner accents */
        .alert-corner {
          position: absolute;
          width: 18px; height: 18px;
          z-index: 3;
        }
        .alert-corner.tl { top: 14px; left: 14px; border-top: 2px solid rgba(59,222,185,0.4); border-left: 2px solid rgba(59,222,185,0.4); border-radius: 3px 0 0 0; }
        .alert-corner.tr { top: 14px; right: 14px; border-top: 2px solid rgba(59,222,185,0.4); border-right: 2px solid rgba(59,222,185,0.4); border-radius: 0 3px 0 0; }
        .alert-corner.bl { bottom: 14px; left: 14px; border-bottom: 2px solid rgba(59,222,185,0.4); border-left: 2px solid rgba(59,222,185,0.4); border-radius: 0 0 0 3px; }
        .alert-corner.br { bottom: 14px; right: 14px; border-bottom: 2px solid rgba(59,222,185,0.4); border-right: 2px solid rgba(59,222,185,0.4); border-radius: 0 0 3px 0; }

        /* Badge row */
        .alert-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
        }
        .alert-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(239,68,68,0.10);
          border: 1px solid rgba(239,68,68,0.28);
          border-radius: 6px;
          padding: 5px 11px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #f87171;
        }
        .alert-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          animation: alert-blink 1.2s ease-in-out infinite;
        }
        @keyframes alert-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.2; }
        }
        .alert-badge-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(239,68,68,0.25), transparent);
        }
        .alert-screen-id {
          font-size: 10px;
          color: rgba(59,222,185,0.35);
          font-family: monospace;
          letter-spacing: 0.08em;
        }

        /* Headline */
        .alert-headline {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(1.45rem, 2.8vw, 2.05rem);
          font-weight: 900;
          line-height: 1.25;
          color: #fff;
          letter-spacing: -0.4px;
          min-height: 3.2em;
        }
        .alert-highlight {
          color: #ef4444;
          text-shadow: 0 0 20px rgba(239,68,68,0.5);
          animation: flicker 4s ease-in-out infinite;
        }
        @keyframes flicker {
          0%,92%,94%,96%,100% { opacity: 1; }
          93%,95%              { opacity: 0.6; }
        }

        /* Arabic */
        .alert-arabic {
          font-size: clamp(1.4rem, 2.8vw, 2rem);
          font-weight: normal;
          color: #3BDEB9;
          text-shadow: 0 0 24px rgba(59,222,185,0.35);
          direction: rtl;
          font-family: "RetroBrushArabic", 'Noto Sans Arabic', sans-serif;
          margin-top: 10px;
          min-height: 1.8em;
        }

        /* Cursor */
        .alert-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: #3BDEB9;
          vertical-align: middle;
          margin-left: 3px;
          animation: cursor-blink 0.9s step-end infinite;
        }
        @keyframes cursor-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }

        /* Divider */
        .alert-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(59,222,185,0.2), rgba(255,255,255,0.05), transparent);
          margin: 22px 0 18px;
        }

        /* Sub */
        .alert-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.33);
          line-height: 1.65;
        }
        .alert-sub strong {
          color: rgba(255,255,255,0.58);
          font-weight: 600;
        }

        /* Stats strip */
        .alert-stats {
          display: flex;
          margin-top: auto;
          padding-top: 22px;
          border: 1px solid rgba(59,222,185,0.12);
          border-radius: 14px;
          overflow: hidden;
          background: rgba(59,222,185,0.03);
        }
        .alert-stat {
          flex: 1;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .alert-stat + .alert-stat { border-left: 1px solid rgba(59,222,185,0.10); }
        .alert-stat-val {
          font-size: 20px;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .alert-stat-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
        }

        /* ── Right card: features ── */
        .boost-screen-wrap {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .boost-screen-header {
          margin-bottom: 20px;
        }
        .boost-screen-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(59,222,185,0.07);
          border: 1px solid rgba(59,222,185,0.2);
          border-radius: 6px;
          padding: 5px 11px;
          width: fit-content;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #3BDEB9;
          margin-bottom: 18px;
        }
        .boost-screen-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #3BDEB9;
          box-shadow: 0 0 8px #3BDEB9;
          animation: teal-blink 2s ease-in-out infinite;
        }
        @keyframes teal-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        .boost-screen-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.3px;
          line-height: 1.3;
          margin-bottom: 4px;
        }
        .boost-screen-sub {
          font-size: 11px;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.02em;
        }
        .boost-screen-rows {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 20px 0;
          overflow: hidden;
        }
        .boost-screen-footer {
          border-top: 1px solid rgba(59,222,185,0.1);
          padding-top: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .boost-screen-footer-label {
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .boost-screen-count {
          font-size: 11px;
          font-weight: 700;
          background: linear-gradient(90deg,#3BDEB9,#CCFF9B);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Light mode polish (requested) ───────────────────────── */
        [data-theme="light"] .section-developed {
          background: #f3f5f2 !important;
        }
        [data-theme="light"] .alert-screen-wrap {
          background: #ffffff !important;
          border: 1px solid rgba(17,24,39,0.12) !important;
          box-shadow: 0 10px 30px rgba(17,24,39,0.08), 0 2px 8px rgba(17,24,39,0.05) !important;
        }
        [data-theme="light"] .alert-screen-wrap::before {
          background: repeating-linear-gradient(
            0deg, transparent, transparent 3px,
            rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px
          ) !important;
        }
        [data-theme="light"] .alert-screen-wrap::after {
          background: radial-gradient(circle, rgba(91,33,182,0.08) 0%, transparent 70%) !important;
        }
        [data-theme="light"] .alert-corner.tl,
        [data-theme="light"] .alert-corner.tr,
        [data-theme="light"] .alert-corner.bl,
        [data-theme="light"] .alert-corner.br {
          border-color: rgba(91,33,182,0.35) !important;
        }
        [data-theme="light"] .alert-badge {
          background: rgba(91,33,182,0.08) !important;
          border-color: rgba(91,33,182,0.28) !important;
          color: #5B21B6 !important;
        }
        [data-theme="light"] .alert-badge-dot {
          background: #5B21B6 !important;
          box-shadow: 0 0 8px rgba(91,33,182,0.55) !important;
        }
        [data-theme="light"] .alert-badge-line {
          background: linear-gradient(90deg, rgba(91,33,182,0.25), transparent) !important;
        }
        [data-theme="light"] .alert-screen-id { color: rgba(91,33,182,0.55) !important; }
        [data-theme="light"] .alert-headline { color: #111827 !important; }
        [data-theme="light"] .alert-highlight {
          color: #B91C1C !important;
          text-shadow: 0 0 14px rgba(185,28,28,0.16) !important;
        }
        [data-theme="light"] .alert-arabic {
          color: #5B21B6 !important;
          text-shadow: 0 0 20px rgba(91,33,182,0.22) !important;
        }
        [data-theme="light"] .alert-cursor { background: #5B21B6 !important; }
        [data-theme="light"] .alert-divider {
          background: linear-gradient(90deg, rgba(91,33,182,0.24), rgba(0,0,0,0.08), transparent) !important;
        }
        [data-theme="light"] .alert-sub { color: rgba(17,24,39,0.76) !important; }
        [data-theme="light"] .alert-sub strong { color: #111827 !important; }
        [data-theme="light"] .alert-stats {
          border-color: rgba(91,33,182,0.16) !important;
          background: rgba(91,33,182,0.04) !important;
        }
        [data-theme="light"] .alert-stat + .alert-stat { border-left-color: rgba(91,33,182,0.12) !important; }
        [data-theme="light"] .alert-stat-val { color: #111827 !important; }
        [data-theme="light"] .alert-stat-label { color: rgba(17,24,39,0.52) !important; }
        [data-theme="light"] .boost-screen-badge {
          background: rgba(91,33,182,0.08) !important;
          border-color: rgba(91,33,182,0.25) !important;
          color: #5B21B6 !important;
        }
        [data-theme="light"] .boost-screen-badge-dot {
          background: #5B21B6 !important;
          box-shadow: 0 0 8px rgba(91,33,182,0.5) !important;
        }
        [data-theme="light"] .boost-screen-title { color: #111827 !important; }
        [data-theme="light"] .boost-screen-sub { color: rgba(17,24,39,0.62) !important; }
        [data-theme="light"] .boost-screen-footer {
          border-top-color: rgba(91,33,182,0.14) !important;
        }
        [data-theme="light"] .boost-screen-footer-label { color: rgba(17,24,39,0.58) !important; }
        [data-theme="light"] .boost-screen-count {
          background: linear-gradient(90deg,#5B21B6,#7C3AED) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
        }
        [data-theme="light"] .boost-item .text-gradient {
          color: #0f172a !important;
          background: #ffffff !important;
          border: 1px solid rgba(15,23,42,0.22) !important;
          box-shadow: 0 2px 8px rgba(15,23,42,0.08) !important;
          -webkit-text-fill-color: #0f172a !important;
        }
        [data-theme="light"] .boost-item:nth-child(3n) .text-gradient {
          color: #0f172a !important;
          background: #fff7ed !important;
          border-color: rgba(194,65,12,0.26) !important;
          -webkit-text-fill-color: #0f172a !important;
        }
        [data-theme="light"] .boost-item:nth-child(2n) .text-gradient {
          color: #0f172a !important;
          background: #f5f3ff !important;
          border-color: rgba(91,33,182,0.26) !important;
          -webkit-text-fill-color: #0f172a !important;
        }
      `}</style>

      <div className="container">
        <div className="row">
          {/* ── Left: Alert Screen ── */}
          <div className="col-md-8">
            <div className="alert-screen-wrap wow fadeInUp" data-wow-delay="0s">
              <div className="alert-corner tl" />
              <div className="alert-corner tr" />
              <div className="alert-corner bl" />
              <div className="alert-corner br" />

              <div className="alert-screen-inner">
                <div className="alert-badge-row">
                  <div className="alert-badge">
                    <span className="alert-badge-dot" />
                    Alerte Prix
                  </div>
                  <div className="alert-badge-line" />
                  <span className="alert-screen-id">HTTPS://1111.TN</span>
                </div>

                {/* Animated headline */}
                <div className="alert-headline">
                  {frTokens.slice(0, frCount).map((tok, i) => {
                    if (tok.type === "br") return <br key={i} />;
                    if (tok.type === "highlight")
                      return (
                        <span key={i} className="alert-highlight">
                          {tok.val}
                        </span>
                      );
                    return <span key={i}>{tok.val}</span>;
                  })}
                  {phase === "typing-fr" && <span className="alert-cursor" />}
                </div>

                {/* Animated Arabic */}
                <div className="alert-arabic">
                  {arWords.slice(0, arCount).join("")}
                  {phase === "typing-ar" && <span className="alert-cursor" />}
                </div>

                <div className="alert-divider" />

                <p className="alert-sub">
                  1111.tn scanne en temps réel les prix de{" "}
                  <strong>10+ enseignes tunisiennes</strong> et détecte
                  automatiquement les hausses abusives, les fausses promos et
                  les prix gonflés.
                </p>

                <div className="alert-stats">
                  <div className="alert-stat">
                    <span className="alert-stat-val">50K+</span>
                    <span className="alert-stat-label">Produits suivis</span>
                  </div>
                  <div className="alert-stat">
                    <span className="alert-stat-val">&gt;30%</span>
                    <span className="alert-stat-label">Économies</span>
                  </div>
                  <div className="alert-stat">
                    <span className="alert-stat-val">10+</span>
                    <span className="alert-stat-label">Magasins</span>
                  </div>
                  <div className="alert-stat">
                    <span className="alert-stat-val">24/7</span>
                    <span className="alert-stat-label">Surveillance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Features screen ── */}
          <div className="col-md-4">
            <div
              className="alert-screen-wrap wow fadeInUp"
              data-wow-delay="0.1s"
              style={{ padding: 0 }}
            >
              <div className="alert-corner tl" />
              <div className="alert-corner tr" />
              <div className="alert-corner bl" />
              <div className="alert-corner br" />

              <div className="alert-screen-inner boost-screen-wrap">
                <div className="boost-screen-header">
                  <div className="boost-screen-badge">
                    <span className="boost-screen-badge-dot" />
                    Fonctionnalités
                  </div>
                  <div className="boost-screen-title">
                    Tout inclus,
                    <br />
                    dès le départ.
                  </div>
                  <div className="boost-screen-sub">
                    Aucun abonnement requis
                  </div>
                </div>

                <div className="boost-screen-rows">
                  {boostRows.map((row, i) => (
                    <BoostRow key={i} {...row} />
                  ))}
                </div>

                <div className="boost-screen-footer">
                  <span className="boost-screen-footer-label">
                    Fonctionnalités incluses
                  </span>
                  <span className="boost-screen-count">10+ outils</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
