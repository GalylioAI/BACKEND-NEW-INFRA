import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SafeImage from "../../components/SafeImage";
import { loadBlogBySlug } from "../../lib/blog-content";
import type { BlogSection } from "../../lib/api/types";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadBlogBySlug(slug);

  if (!article) {
    return {
      title: "Article introuvable | 1111.tn",
    };
  }

  return {
    title: `${article.title} | 1111.tn`,
    description: article.desc,
  };
}

function renderSection(section: BlogSection, index: number) {
  switch (section.type) {
    case "h2":
      return <h2 key={index} className="art-h2">{section.text}</h2>;
    case "h3":
      return <h3 key={index} className="art-h3">{section.text}</h3>;
    case "p":
      return <p key={index} className="art-p">{section.text}</p>;
    case "ul":
      return (
        <ul key={index} className="art-ul">
          {(section.items ?? []).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
        </ul>
      );
    case "highlight":
      return (
        <div key={index} className="art-callout">
          <svg className="art-callout-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3BDEB9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="0.5" fill="#3BDEB9" />
          </svg>
          <p>{section.text}</p>
        </div>
      );
    default:
      return null;
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await loadBlogBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #060d08; color: #fff; font-family: inherit; }

        .art-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(59,222,185,0.1), transparent 28%),
            radial-gradient(circle at top right, rgba(204,255,155,0.08), transparent 22%),
            linear-gradient(180deg, #060d08 0%, #07110b 100%);
        }
        .art-topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 64px;
          background: rgba(6,13,8,0.85);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .art-logo {
          font-size: 22px;
          font-weight: 900;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.5px;
        }
        .art-logo span { color: #3BDEB9; }
        .art-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .art-back:hover { color: #fff; }
        .art-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(100deg,#3BDEB9,#CCFF9B);
          color: #000;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 9px 18px;
          border-radius: 999px;
          transition: opacity 0.2s;
        }
        .art-cta-btn:hover { opacity: 0.88; }
        .art-wrap {
          max-width: 760px;
          margin: 0 auto;
          padding: 48px 24px 100px;
        }
        .art-hero {
          border-radius: 22px;
          overflow: hidden;
          position: relative;
          margin-bottom: 36px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.28);
        }
        .art-hero img {
          width: 100%;
          height: 420px;
          object-fit: cover;
          display: block;
        }
        .art-hero-cat {
          position: absolute;
          top: 20px;
          left: 20px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          color: #000;
        }
        .art-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.32);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .art-meta-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }
        .art-title {
          font-size: 32px;
          font-weight: 900;
          line-height: 1.28;
          color: #fff;
          margin-bottom: 18px;
          letter-spacing: -0.5px;
        }
        .art-lead {
          font-size: 16px;
          line-height: 1.7;
          color: rgba(255,255,255,0.48);
          margin-bottom: 44px;
          padding-bottom: 36px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .art-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .art-h2 {
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          line-height: 1.35;
          margin-top: 12px;
          padding-left: 14px;
          border-left: 3px solid #3BDEB9;
        }
        .art-h3 {
          font-size: 16px;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
        }
        .art-p {
          font-size: 15px;
          line-height: 1.8;
          color: rgba(255,255,255,0.6);
        }
        .art-ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 20px 22px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
        }
        .art-ul li {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255,255,255,0.6);
          padding-left: 20px;
          position: relative;
        }
        .art-ul li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: linear-gradient(135deg,#3BDEB9,#CCFF9B);
        }
        .art-callout {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 18px 20px;
          background: rgba(59,222,185,0.06);
          border: 1px solid rgba(59,222,185,0.2);
          border-radius: 14px;
        }
        .art-callout-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .art-callout p {
          font-size: 14px;
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          font-weight: 500;
        }
        .art-bottom-cta {
          margin-top: 60px;
          padding: 36px;
          background: linear-gradient(135deg, rgba(59,222,185,0.08), rgba(204,255,155,0.04));
          border: 1px solid rgba(59,222,185,0.18);
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .art-bottom-cta strong {
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          display: block;
          margin-bottom: 4px;
        }
        .art-bottom-cta p {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
        }
        .art-nav-links {
          margin-top: 44px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .art-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .art-nav-link:hover { color: #3BDEB9; }

        @media (max-width: 640px) {
          .art-topbar { padding: 0 16px; }
          .art-topbar .art-cta-btn { display: none; }
          .art-wrap { padding: 36px 16px 80px; }
          .art-title { font-size: 24px; }
          .art-hero img { height: 240px; }
          .art-bottom-cta { flex-direction: column; text-align: center; }
        }
      `}</style>

      <div className="tfmouseCursor cursor-outer"></div>
      <div className="tfmouseCursor cursor-inner"></div>

      <div id="wrapper">
        <div id="pagee">
          <main className="art-page">
            <nav className="art-topbar">
              <a href="/" className="art-logo">1111<span>.tn</span></a>
              <a href="/blogs" className="art-back">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.83 7H1.17M1.17 7L7 1.17M1.17 7L7 12.83" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Tous les articles
              </a>
              <a href="https://1111.tn" target="_blank" rel="noreferrer" className="art-cta-btn">
                Comparer maintenant
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M1.17 12.83L12.83 1.17M12.83 1.17H4.5M12.83 1.17V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </nav>

            <div className="art-wrap">
              <div className="art-hero">
                <span className="art-hero-cat" style={{ background: article.categoryColor }}>{article.category}</span>
                <SafeImage
                  src={article.img || FALLBACK_IMG}
                  fallbackSrc={FALLBACK_IMG}
                  alt={article.title}
                />
              </div>

              <div className="art-meta">
                <span>{article.date}</span>
                <span className="art-meta-dot"></span>
                <span>{article.read} de lecture</span>
              </div>
              <h1 className="art-title">{article.title}</h1>
              <p className="art-lead">{article.desc}</p>

              <div className="art-body">
                {article.sections.map((section, index) => renderSection(section, index))}
              </div>

              <div className="art-bottom-cta">
                <div>
                  <strong>Pret a trouver le meilleur prix ?</strong>
                  <p>Comparez en temps reel sur tous les e-shops tunisiens</p>
                </div>
                <a href="https://1111.tn" target="_blank" rel="noreferrer" className="art-cta-btn">
                  Comparer sur 1111.tn
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1.17 12.83L12.83 1.17M12.83 1.17H4.5M12.83 1.17V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              <div className="art-nav-links">
                <a href="/blogs" className="art-nav-link">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M12.83 7H1.17M1.17 7L7 1.17M1.17 7L7 12.83" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Retour aux articles
                </a>
                <a href="/" className="art-nav-link">
                  Accueil 1111.tn
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1.17 12.83L12.83 1.17M12.83 1.17H4.5M12.83 1.17V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
