import type { Metadata } from "next";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SafeImage from "../components/SafeImage";
import { loadBlogs } from "../lib/blog-content";

export const metadata: Metadata = {
  title: "Blogs | 1111.tn",
  description: "Tous les articles, guides et comparatifs publies par 1111.tn.",
};

const BLOG_FALLBACK_IMG = "/images/innerpage/Blog_list_v1.jpg";

export default async function BlogsPage() {
  const articles = await loadBlogs();
  const featuredArticle = articles[0];
  const categoryCount = new Set(articles.map((article) => article.category))
    .size;

  if (!featuredArticle) return null;

  return (
    <>
      <style>{`
        .blogs-page {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(59,222,185,0.12), transparent 30%),
            radial-gradient(circle at top right, rgba(204,255,155,0.08), transparent 24%),
            linear-gradient(180deg, #060d08 0%, #07110b 100%);
        }
        .blogs-page::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 30px 30px;
          mask-image: linear-gradient(180deg, black 0%, transparent 100%);
        }
        .blogs-hero {
          position: relative;
          padding: 170px 0 70px;
        }
        .blogs-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
          gap: 28px;
          align-items: stretch;
        }
        .blogs-copy {
          padding: 16px 0;
        }
        .blogs-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(59,222,185,0.22);
          color: #3BDEB9;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(59,222,185,0.08);
        }
        .blogs-copy h1 {
          margin: 22px 0 18px;
          font-size: clamp(2.6rem, 5vw, 4.6rem);
          line-height: 1.02;
          color: #fff;
          letter-spacing: -0.04em;
        }
        .blogs-copy p {
          max-width: 640px;
          margin: 0;
          font-size: 16px;
          line-height: 1.8;
          color: rgba(255,255,255,0.65);
        }
        .blogs-hero-actions {
          margin-top: 28px;
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .blogs-secondary-link {
          color: rgba(255,255,255,0.72);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none;
        }
        .blogs-secondary-link:hover {
          color: #3BDEB9;
        }
        .blogs-stats {
          margin-top: 28px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .blogs-stat {
          min-width: 132px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }
        .blogs-stat strong {
          display: block;
          margin-bottom: 4px;
          color: #fff;
          font-size: 22px;
          line-height: 1;
        }
        .blogs-stat span {
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .blogs-featured {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 100%;
          overflow: hidden;
          border-radius: 28px;
          background: rgba(8,16,12,0.95);
          border: 1px solid rgba(255,255,255,0.08);
          text-decoration: none;
          box-shadow: 0 30px 80px rgba(0,0,0,0.3);
          transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;
        }
        .blogs-featured:hover {
          transform: translateY(-6px);
          border-color: rgba(59,222,185,0.24);
          box-shadow: 0 34px 90px rgba(0,0,0,0.38);
        }
        .blogs-featured-media {
          position: relative;
          min-height: 320px;
          overflow: hidden;
        }
        .blogs-featured-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .blogs-featured-media::after {
          content: '';
          position: absolute;
          inset: auto 0 0;
          height: 60%;
          background: linear-gradient(180deg, transparent 0%, rgba(8,16,12,0.95) 100%);
        }
        .blogs-featured-badge,
        .blogs-card-badge {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 2;
          padding: 6px 11px;
          border-radius: 999px;
          color: #000;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .blogs-featured-content {
          padding: 24px 26px 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
        }
        .blogs-featured-meta,
        .blogs-card-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          color: rgba(255,255,255,0.36);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .blogs-meta-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.18);
        }
        .blogs-featured h2 {
          margin: 0;
          color: #fff;
          font-size: 28px;
          line-height: 1.2;
        }
        .blogs-featured p {
          margin: 0;
          color: rgba(255,255,255,0.62);
          font-size: 14px;
          line-height: 1.75;
        }
        .blogs-link-row {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #3BDEB9;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .blogs-grid-section {
          position: relative;
          padding: 12px 0 110px;
        }
        .blogs-grid-head {
          margin-bottom: 30px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .blogs-grid-head h2 {
          margin: 0;
          color: #fff;
          font-size: clamp(2rem, 3vw, 2.8rem);
          line-height: 1.1;
        }
        .blogs-grid-head p {
          margin: 0;
          color: rgba(255,255,255,0.55);
          font-size: 14px;
          line-height: 1.7;
        }
        .blogs-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }
        .blogs-card {
          position: relative;
          display: flex;
          flex-direction: column;
          min-height: 100%;
          overflow: hidden;
          border-radius: 24px;
          background: rgba(8,16,12,0.96);
          border: 1px solid rgba(255,255,255,0.08);
          text-decoration: none;
          transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
        }
        .blogs-card:hover {
          transform: translateY(-5px);
          border-color: rgba(59,222,185,0.22);
          box-shadow: 0 20px 56px rgba(0,0,0,0.4);
        }
        .blogs-card-media {
          position: relative;
          height: 230px;
          overflow: hidden;
        }
        .blogs-card-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.45s ease;
        }
        .blogs-card:hover .blogs-card-media img {
          transform: scale(1.05);
        }
        .blogs-card-media::after {
          content: '';
          position: absolute;
          inset: auto 0 0;
          height: 58%;
          background: linear-gradient(180deg, transparent 0%, rgba(8,16,12,0.88) 100%);
        }
        .blogs-card-content {
          padding: 20px 22px 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .blogs-card h3 {
          margin: 0 0 10px;
          color: #fff;
          font-size: 18px;
          line-height: 1.35;
        }
        .blogs-card p {
          margin: 0 0 18px;
          color: rgba(255,255,255,0.58);
          font-size: 13px;
          line-height: 1.75;
          flex: 1;
        }
        @media (max-width: 1199px) {
          .blogs-hero-grid,
          .blogs-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 991px) {
          .blogs-hero {
            padding-top: 150px;
          }
          .blogs-hero-grid {
            grid-template-columns: 1fr;
          }
          .blogs-featured-media {
            min-height: 280px;
          }
        }
        @media (max-width: 639px) {
          .blogs-hero {
            padding: 118px 0 44px;
          }
          .blogs-grid {
            grid-template-columns: 1fr;
          }
          .blogs-copy {
            padding: 0;
          }
          .blogs-kicker {
            font-size: 10px;
            padding: 6px 10px;
            letter-spacing: 0.07em;
          }
          .blogs-copy h1 {
            margin: 14px 0 12px;
            font-size: 1.95rem;
            line-height: 1.12;
            letter-spacing: -0.03em;
          }
          .blogs-copy p {
            font-size: 14px;
            line-height: 1.65;
          }
          .blogs-hero-actions {
            margin-top: 16px;
            gap: 10px;
          }
          .blogs-hero-actions .tf-btn-1,
          .blogs-secondary-link {
            width: 100%;
            text-align: center;
          }
          .blogs-hero-actions .tf-btn-1 div {
            width: 100%;
          }
          .blogs-secondary-link {
            padding: 9px 12px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.03);
            font-size: 11px;
          }
          .blogs-card-media,
          .blogs-featured-media {
            min-height: 0;
            height: 190px;
          }
          .blogs-featured {
            border-radius: 16px;
          }
          .blogs-featured-content {
            padding: 14px 14px 16px;
            gap: 9px;
          }
          .blogs-featured h2 {
            font-size: 19px;
            line-height: 1.25;
          }
          .blogs-featured p {
            font-size: 13px;
            line-height: 1.6;
          }
          .blogs-featured-badge,
          .blogs-card-badge {
            top: 10px;
            left: 10px;
            font-size: 9px;
            padding: 5px 9px;
          }
          .blogs-stats {
            margin-top: 16px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          .blogs-stat {
            min-width: 0;
            width: 100%;
            padding: 10px 12px;
            border-radius: 12px;
          }
          .blogs-stat strong {
            font-size: 18px;
          }
          .blogs-stat span {
            font-size: 10px;
          }
          .blogs-grid-section {
            padding: 6px 0 72px;
          }
          .blogs-grid-head {
            margin-bottom: 16px;
          }
          .blogs-grid-head h2 {
            font-size: 1.7rem;
          }
          .blogs-grid-head p {
            font-size: 13px;
          }
          .blogs-card {
            border-radius: 16px;
          }
          .blogs-card-content {
            padding: 14px 14px 16px;
          }
          .blogs-card h3 {
            font-size: 16px;
            margin-bottom: 7px;
          }
          .blogs-card p {
            font-size: 12px;
            line-height: 1.6;
            margin-bottom: 12px;
          }
        }
      `}</style>

      <div className="tfmouseCursor cursor-outer"></div>
      <div className="tfmouseCursor cursor-inner"></div>

      <div id="wrapper">
        <div id="pagee">
          <Header />

          <main className="blogs-page">
            <section className="blogs-hero">
              <div className="container">
                <div className="blogs-hero-grid">
                  <div className="blogs-copy">
                    <span className="blogs-kicker">1111.tn Blog</span>
                    <h1>
                      Guides, tests et comparatifs pour acheter plus malin.
                    </h1>
                    <p>
                      Retrouvez nos guides sur la comparaison de prix, les
                      smartphones, le gaming, les laptops, les TV,
                      l&apos;electromenager et les achats du quotidien.
                    </p>

                    <div className="blogs-hero-actions">
                      <a
                        href={`/blog/${featuredArticle.slug}`}
                        className="tf-btn-1 light_skew_hover"
                      >
                        <div>Lire l&apos;article a la une</div>
                      </a>
                      <a href="/" className="blogs-secondary-link">
                        Retour a l&apos;accueil
                      </a>
                    </div>

                    <div className="blogs-stats">
                      <div className="blogs-stat">
                        <strong>{articles.length}</strong>
                        <span>Articles publies</span>
                      </div>
                      <div className="blogs-stat">
                        <strong>{categoryCount}+</strong>
                        <span>Categories couvertes</span>
                      </div>
                      <div className="blogs-stat">
                        <strong>100%</strong>
                        <span>Acces libre</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/blog/${featuredArticle.slug}`}
                    className="blogs-featured"
                  >
                    <div className="blogs-featured-media">
                      <span
                        className="blogs-featured-badge"
                        style={{ background: featuredArticle.categoryColor }}
                      >
                        A la une
                      </span>
                      <SafeImage
                        src={featuredArticle.img}
                        alt={featuredArticle.title}
                        fallbackSrc={BLOG_FALLBACK_IMG}
                      />
                    </div>
                    <div className="blogs-featured-content">
                      <div className="blogs-featured-meta">
                        <span>{featuredArticle.category}</span>
                        <span className="blogs-meta-dot"></span>
                        <span>{featuredArticle.date}</span>
                        <span className="blogs-meta-dot"></span>
                        <span>{featuredArticle.read} de lecture</span>
                      </div>
                      <h2>{featuredArticle.title}</h2>
                      <p>{featuredArticle.desc}</p>
                      <div className="blogs-link-row">Lire l&apos;article</div>
                    </div>
                  </a>
                </div>
              </div>
            </section>

            <section className="blogs-grid-section">
              <div className="container">
                <div className="blogs-grid-head">
                  <div>
                    <h2>Tous les articles</h2>
                    <p>
                      Chaque carte vous emmene directement vers la page complete
                      de l&apos;article.
                    </p>
                  </div>
                </div>

                <div className="blogs-grid">
                  {articles.map((article) => (
                    <a
                      key={article.slug}
                      href={`/blog/${article.slug}`}
                      className="blogs-card"
                    >
                      <div className="blogs-card-media">
                        <span
                          className="blogs-card-badge"
                          style={{ background: article.categoryColor }}
                        >
                          {article.category}
                        </span>
                        <SafeImage
                          src={article.img}
                          alt={article.title}
                          fallbackSrc={BLOG_FALLBACK_IMG}
                        />
                      </div>

                      <div className="blogs-card-content">
                        <div className="blogs-card-meta">
                          <span>{article.date}</span>
                          <span className="blogs-meta-dot"></span>
                          <span>{article.read} de lecture</span>
                        </div>
                        <h3>{article.title}</h3>
                        <p>{article.desc}</p>
                        <div className="blogs-link-row">
                          Ouvrir l&apos;article
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}
