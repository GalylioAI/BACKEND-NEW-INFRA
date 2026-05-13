"use client";

import { articles } from "../lib/articles";

const FALLBACK = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&q=80";

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1.17 12.83L12.83 1.17M12.83 1.17H4.5M12.83 1.17V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const featuredArticle = articles[0];
const hiddenSideArticleSlugs = new Set([
  "samsung-galaxy-vs-iphone-tunisie",
  "oled-vs-qled-guide-2025",
]);

const sideArticles = articles
  .filter((article) => !hiddenSideArticleSlugs.has(article.slug))
  .slice(1, 2);

export default function BlogSection() {
  if (!featuredArticle) {
    return null;
  }

  return (
    <aside id="blog" className="hero-blog-sidebar">
      <style>{`
        .hero-blog-sidebar {
          position: relative;
          min-height: 100%;
        }
        .hero-blog-panel {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 18px;
          height: 100%;
          padding: 24px;
          border-radius: 30px;
          background:
            radial-gradient(circle at top right, rgba(59,222,185,0.14), transparent 28%),
            linear-gradient(155deg, rgba(9,15,24,0.98) 0%, rgba(8,15,12,0.96) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 30px 80px rgba(0,0,0,0.34);
          overflow: hidden;
        }
        .hero-blog-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 22px 22px;
          mask-image: linear-gradient(180deg, rgba(0,0,0,0.9), transparent 100%);
        }
        .hero-blog-head {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .hero-blog-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(59,222,185,0.1);
          border: 1px solid rgba(59,222,185,0.18);
          color: #3BDEB9;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .hero-blog-count {
          min-width: 60px;
          text-align: right;
        }
        .hero-blog-count strong {
          display: block;
          font-size: 24px;
          line-height: 1;
          color: #fff;
        }
        .hero-blog-count span {
          color: rgba(255,255,255,0.42);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .hero-blog-title {
          position: relative;
          z-index: 1;
          margin: 0;
          color: #fff;
          font-size: 30px;
          line-height: 1.03;
          letter-spacing: -0.05em;
          max-width: 12ch;
        }
        .hero-blog-copy {
          position: relative;
          z-index: 1;
          margin: -4px 0 0;
          color: rgba(255,255,255,0.58);
          font-size: 13px;
          line-height: 1.75;
          max-width: 34ch;
        }
        .hero-blog-featured {
          position: relative;
          z-index: 1;
          display: block;
          overflow: hidden;
          border-radius: 24px;
          text-decoration: none;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
        }
        .hero-blog-featured:hover {
          transform: translateY(-4px);
          border-color: rgba(59,222,185,0.24);
          box-shadow: 0 24px 50px rgba(0,0,0,0.32);
        }
        .hero-blog-media {
          position: relative;
          height: 210px;
          overflow: hidden;
        }
        .hero-blog-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s ease;
        }
        .hero-blog-featured:hover .hero-blog-media img {
          transform: scale(1.05);
        }
        .hero-blog-media::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 58%;
          background: linear-gradient(180deg, transparent 0%, rgba(8,16,12,0.92) 100%);
        }
        .hero-blog-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 2;
          padding: 5px 10px;
          border-radius: 999px;
          color: #000;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .hero-blog-featured-body {
          padding: 18px 18px 20px;
        }
        .hero-blog-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          color: rgba(255,255,255,0.38);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .hero-blog-meta-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.18);
        }
        .hero-blog-featured-title {
          margin: 0 0 10px;
          color: #fff;
          font-size: 18px;
          line-height: 1.34;
        }
        .hero-blog-featured-text {
          margin: 0;
          color: rgba(255,255,255,0.58);
          font-size: 12.5px;
          line-height: 1.72;
        }
        .hero-blog-link {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #3BDEB9;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: gap 0.2s ease;
        }
        .hero-blog-featured:hover .hero-blog-link,
        .hero-blog-mini:hover .hero-blog-link {
          gap: 10px;
        }
        .hero-blog-stack {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hero-blog-mini {
          display: grid;
          grid-template-columns: 88px minmax(0, 1fr);
          gap: 14px;
          align-items: center;
          padding: 12px;
          border-radius: 20px;
          text-decoration: none;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .hero-blog-mini:hover {
          transform: translateX(4px);
          border-color: rgba(59,222,185,0.22);
          background: rgba(255,255,255,0.045);
        }
        .hero-blog-mini-media {
          position: relative;
          height: 82px;
          border-radius: 14px;
          overflow: hidden;
        }
        .hero-blog-mini-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hero-blog-mini-content {
          min-width: 0;
        }
        .hero-blog-mini-category {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 999px;
          color: #000;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .hero-blog-mini-title {
          margin: 0 0 8px;
          color: #fff;
          font-size: 13px;
          line-height: 1.45;
        }
        .hero-blog-mini-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          color: rgba(255,255,255,0.34);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .hero-blog-mini-read {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .hero-blog-footer {
          position: relative;
          z-index: 1;
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-top: 4px;
        }
        .hero-blog-footer p {
          margin: 0;
          color: rgba(255,255,255,0.45);
          font-size: 11px;
          line-height: 1.6;
          max-width: 22ch;
        }
        .hero-blog-footer .tf-btn-4 {
          flex-shrink: 0;
        }
        @media (max-width: 1399px) {
          .hero-blog-title {
            font-size: 26px;
          }
          .hero-blog-media {
            height: 190px;
          }
        }
        @media (max-width: 1199px) {
          .hero-blog-panel {
            padding: 22px;
          }
          .hero-blog-title {
            max-width: none;
          }
        }
        @media (max-width: 767px) {
          .hero-blog-panel {
            padding: 18px;
            border-radius: 24px;
          }
          .hero-blog-head,
          .hero-blog-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          .hero-blog-count {
            text-align: left;
          }
          .hero-blog-title {
            font-size: 24px;
          }
          .hero-blog-media {
            height: 180px;
          }
          .hero-blog-mini {
            grid-template-columns: 1fr;
          }
          .hero-blog-mini-media {
            height: 150px;
          }
          .hero-blog-footer .tf-btn-4 {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="hero-blog-panel">
        <div className="hero-blog-head">
          <div>
            <span className="hero-blog-kicker">Editorial Picks</span>
          </div>
          <div className="hero-blog-count">
            <strong>{articles.length}</strong>
            <span>articles</span>
          </div>
        </div>

        <h2 className="hero-blog-title">Le blog a cote du comparateur.</h2>
        <p className="hero-blog-copy">
          Guides rapides, bons reflexes d&apos;achat et comparatifs utiles pour passer de la recherche au bon choix sans quitter l&apos;accueil.
        </p>

        <a href={`/blog/${featuredArticle.slug}`} className="hero-blog-featured">
          <div className="hero-blog-media">
            <span className="hero-blog-badge" style={{ background: featuredArticle.categoryColor }}>
              A la une
            </span>
            <img
              src={featuredArticle.img}
              alt={featuredArticle.title}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.src = FALLBACK;
              }}
            />
          </div>
          <div className="hero-blog-featured-body">
            <div className="hero-blog-meta">
              <span>{featuredArticle.category}</span>
              <span className="hero-blog-meta-dot"></span>
              <span>{featuredArticle.date}</span>
              <span className="hero-blog-meta-dot"></span>
              <span>{featuredArticle.read}</span>
            </div>
            <h3 className="hero-blog-featured-title">{featuredArticle.title}</h3>
            <p className="hero-blog-featured-text">{featuredArticle.desc}</p>
            <div className="hero-blog-link">Lire l&apos;article <ArrowIcon /></div>
          </div>
        </a>

        <div className="hero-blog-stack">
          {sideArticles.map((article) => (
            <a key={article.slug} href={`/blog/${article.slug}`} className="hero-blog-mini">
              <div className="hero-blog-mini-media">
                <img
                  src={article.img}
                  alt={article.title}
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK;
                  }}
                />
              </div>
              <div className="hero-blog-mini-content">
                <span className="hero-blog-mini-category" style={{ background: article.categoryColor }}>
                  {article.category}
                </span>
                <h3 className="hero-blog-mini-title">{article.title}</h3>
                <div className="hero-blog-mini-meta">
                  <span className="hero-blog-mini-read"><ClockIcon />{article.read}</span>
                  <span className="hero-blog-meta-dot"></span>
                  <span>{article.date}</span>
                </div>
                <div className="hero-blog-link">Ouvrir <ArrowIcon /></div>
              </div>
            </a>
          ))}
        </div>

        <div className="hero-blog-footer">
          <p>Un acces direct aux derniers contenus sans descendre dans la page.</p>
          <a href="/blogs" className="tf-btn-4 light_skew_hover type-white">
            Voir tout le blog
          </a>
        </div>
      </div>
    </aside>
  );
}
