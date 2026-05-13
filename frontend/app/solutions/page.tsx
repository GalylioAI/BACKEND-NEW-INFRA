import Header from "../components/Header";
import Footer from "../components/Footer";

const stats = [
  { value: "50K+", label: "Produits suivis" },
  { value: "10+", label: "Boutiques partenaires" },
  { value: "40%", label: "Economies moyennes" },
  { value: "24/7", label: "Mise a jour des prix" },
];

const features = [
  {
    title: "Recherche Intelligente",
    text: "Trouvez instantanement n'importe quel produit parmi des milliers de references tunisiennes.",
  },
  {
    title: "Comparaison de Prix",
    text: "Comparez les prix en temps reel entre les principales boutiques de Tunisie.",
  },
  {
    title: "Alertes Prix",
    text: "Recevez des notifications quand le prix d'un produit baisse.",
  },
  {
    title: "Detection Prix Mensongers",
    text: "Notre algorithme detecte les fausses promotions et les prix gonfles.",
  },
  {
    title: "Historique des Prix",
    text: "Visualisez l'evolution des prix pour acheter au meilleur moment.",
  },
  {
    title: "Prediction de Prix",
    text: "Notre IA anticipe les hausses pour vous aider a economiser.",
  },
];

const categories = [
  {
    name: "Electronique & High-Tech",
    stores: ["Spacenet", "Mytek", "Tunisianet", "TechnoPro", "Darty"],
    products: ["PC Portables", "Smartphones", "Televiseurs", "Electromenager"],
  },
  {
    name: "Parapharmacie",
    stores: ["Parashop", "Pharma-Shop", "Parafendri"],
    products: ["Soins Visage", "Hygiene", "Bebe & Maman", "Solaire"],
  },
  {
    name: "Supermarches",
    stores: ["Monoprix", "Carrefour", "Geant"],
    products: ["Alimentation", "Produits frais", "Epicerie", "Boissons"],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <style>{`
        .solutions-hero-title,
        .solutions-hero-text,
        .solutions-features .solutions-heading,
        .solutions-features .solutions-subheading,
        .solutions-features .solutions-feature-title,
        .solutions-features .solutions-feature-text,
        .solutions-categories .solutions-heading,
        .solutions-categories .solutions-subheading,
        .solutions-categories .solutions-category-title,
        .solutions-categories .solutions-category-list,
        .solutions-mission-wrap .solutions-heading,
        .solutions-mission-wrap .solutions-mission-text,
        .solutions-mission-wrap .solutions-mission-foot {
          color: #ffffff !important;
        }
        .solutions-categories .solutions-chip {
          color: #ffffff !important;
          border: 1px solid rgba(255,255,255,0.24);
        }
        .solutions-categories p {
          color: rgba(255,255,255,0.9) !important;
        }
        @media (max-width: 767px) {
          .solutions-hero { padding: 128px 0 58px !important; }
          .solutions-hero-badge { font-size: 11px !important; padding: 7px 12px !important; margin-bottom: 14px !important; }
          .solutions-hero-title { font-size: clamp(28px, 8vw, 36px) !important; line-height: 1.16 !important; }
          .solutions-hero-text { font-size: 14px !important; margin-top: 14px !important; max-width: 100% !important; line-height: 1.65 !important; }
          .solutions-hero-cta { margin-top: 18px !important; gap: 8px !important; }
          .solutions-hero-cta a { width: 100%; text-align: center; padding: 11px 16px !important; font-size: 13px !important; }

          .solutions-stats { padding: 38px 0 !important; }
          .solutions-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 14px !important; }
          .solutions-stat-value { font-size: 28px !important; }
          .solutions-stat-label { font-size: 12px !important; margin-top: 4px !important; }

          .solutions-features { padding: 56px 0 !important; }
          .solutions-heading-wrap { margin-bottom: 22px !important; }
          .solutions-heading { font-size: clamp(24px, 7vw, 30px) !important; margin: 0 !important; line-height: 1.2 !important; }
          .solutions-subheading { font-size: 13px !important; margin-top: 6px !important; line-height: 1.55 !important; }
          .solutions-feature-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .solutions-feature-card { border-radius: 16px !important; padding: 16px !important; }
          .solutions-feature-title { font-size: 17px !important; margin-bottom: 6px !important; }
          .solutions-feature-text { font-size: 13px !important; line-height: 1.55 !important; }

          .solutions-categories { padding: 56px 0 !important; }
          .solutions-category-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .solutions-category-card { border-radius: 16px !important; padding: 16px !important; }
          .solutions-category-title { font-size: 18px !important; margin-bottom: 10px !important; }
          .solutions-chip-wrap { gap: 6px !important; margin-bottom: 10px !important; }
          .solutions-chip { font-size: 12px !important; padding: 4px 10px !important; }
          .solutions-category-list { font-size: 13px !important; padding-left: 16px !important; }
          .solutions-category-list li { margin-bottom: 4px !important; }

          .solutions-mission-wrap { padding: 56px 0 68px !important; }
          .solutions-mission-card { border-radius: 18px !important; padding: 26px 16px !important; }
          .solutions-mission-text { font-size: 14px !important; margin: 10px auto 14px !important; line-height: 1.6 !important; }
          .solutions-mission-foot { font-size: 13px !important; }
        }
      `}</style>
      <div className="tfmouseCursor cursor-outer"></div>
      <div className="tfmouseCursor cursor-inner"></div>

      <div id="wrapper">
        <div id="pagee">
          <Header />

          <main
            style={{
              background:
                "linear-gradient(180deg, #070b14 0%, #0b1220 55%, #0a0f1a 100%)",
            }}
          >
            <section
              className="solutions-hero"
              style={{
                padding: "170px 0 90px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-120px",
                  right: "-120px",
                  width: "330px",
                  height: "330px",
                  background: "rgba(59,130,246,0.26)",
                  borderRadius: "999px",
                  filter: "blur(30px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-120px",
                  left: "-120px",
                  width: "330px",
                  height: "330px",
                  background: "rgba(20,184,166,0.24)",
                  borderRadius: "999px",
                  filter: "blur(30px)",
                }}
              />
              <div
                className="container"
                style={{ position: "relative", textAlign: "center" }}
              >
                <div
                  className="solutions-hero-badge"
                  style={{
                    display: "inline-block",
                    background: "rgba(59,130,246,0.14)",
                    color: "#93c5fd",
                    borderRadius: "999px",
                    padding: "8px 16px",
                    fontWeight: 700,
                    fontSize: "13px",
                    marginBottom: "20px",
                  }}
                >
                  Plateforme de comparaison de prix #1 en Tunisie
                </div>
                <h1
                  className="solutions-hero-title"
                  style={{
                    fontSize: "clamp(34px, 5vw, 62px)",
                    lineHeight: 1.1,
                    fontWeight: 900,
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                    textShadow: "0 2px 10px rgba(0,0,0,0.28)",
                  }}
                >
                  Economisez sur chaque achat
                  <br />
                  en Tunisie
                </h1>
                <p
                  className="solutions-hero-text"
                  style={{
                    maxWidth: "860px",
                    margin: "24px auto 0",
                    fontSize: "19px",
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                    textShadow: "0 1px 8px rgba(0,0,0,0.22)",
                  }}
                >
                  111.tn compare les prix de milliers de produits dans les
                  meilleures boutiques tunisiennes pour vous aider a trouver les
                  meilleures offres en quelques secondes.
                </p>
                <div
                  className="solutions-hero-cta"
                  style={{
                    marginTop: "30px",
                    display: "flex",
                    justifyContent: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <a
                    href="/products"
                    style={{
                      background: "#e31e24",
                      color: "#ffffff",
                      textDecoration: "none",
                      borderRadius: "999px",
                      padding: "12px 24px",
                      fontWeight: 700,
                    }}
                  >
                    Comparer les prix
                  </a>
                  <a
                    href="/parapharmacie"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "#e2e8f0",
                      textDecoration: "none",
                      border: "1px solid rgba(148,163,184,0.35)",
                      borderRadius: "999px",
                      padding: "12px 24px",
                      fontWeight: 700,
                    }}
                  >
                    Explorer parapharmacie
                  </a>
                </div>
              </div>
            </section>

            <section
              className="solutions-stats"
              style={{
                padding: "60px 0",
                background: "rgba(9,14,24,0.75)",
                borderTop: "1px solid rgba(148,163,184,0.18)",
                borderBottom: "1px solid rgba(148,163,184,0.18)",
              }}
            >
              <div className="container">
                <div
                  className="solutions-stats-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "22px",
                  }}
                >
                  {stats.map((stat) => (
                    <div key={stat.label} style={{ textAlign: "center" }}>
                      <div
                        className="solutions-stat-value"
                        style={{
                          fontSize: "42px",
                          fontWeight: 900,
                          color: "#2563eb",
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </div>
                      <div
                        className="solutions-stat-label"
                        style={{
                          marginTop: "6px",
                          color: "#9db0c9",
                          fontSize: "14px",
                        }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="solutions-features"
              style={{ padding: "85px 0" }}
            >
              <div className="container">
                <div
                  className="solutions-heading-wrap"
                  style={{ textAlign: "center", marginBottom: "34px" }}
                >
                  <h2
                    className="solutions-heading"
                    style={{
                      fontSize: "clamp(28px, 4vw, 44px)",
                      color: "#f8fafc",
                      fontWeight: 900,
                    }}
                  >
                    Fonctionnalites puissantes
                  </h2>
                  <p
                    className="solutions-subheading"
                    style={{ color: "#9db0c9", marginTop: "8px" }}
                  >
                    Des outils intelligents pour vous aider a prendre les
                    meilleures decisions d'achat.
                  </p>
                </div>
                <div
                  className="solutions-feature-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {features.map((feature) => (
                    <article
                      key={feature.title}
                      className="solutions-feature-card"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(10,16,30,0.9) 100%)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "22px",
                        padding: "22px",
                        boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
                      }}
                    >
                      <h3
                        className="solutions-feature-title"
                        style={{
                          fontSize: "21px",
                          color: "#f8fafc",
                          fontWeight: 800,
                          marginBottom: "8px",
                        }}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="solutions-feature-text"
                        style={{
                          margin: 0,
                          color: "#a3b3c9",
                          fontSize: "15px",
                        }}
                      >
                        {feature.text}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="solutions-categories"
              style={{
                padding: "85px 0",
                background: "linear-gradient(180deg, #090f1c 0%, #0a1222 100%)",
              }}
            >
              <div className="container">
                <div
                  className="solutions-heading-wrap"
                  style={{ textAlign: "center", marginBottom: "34px" }}
                >
                  <h2
                    className="solutions-heading"
                    style={{
                      fontSize: "clamp(28px, 4vw, 44px)",
                      color: "#f8fafc",
                      fontWeight: 900,
                    }}
                  >
                    Categories couvertes
                  </h2>
                  <p
                    className="solutions-subheading"
                    style={{ color: "#9db0c9", marginTop: "8px" }}
                  >
                    Nous comparons les prix dans les principales boutiques
                    tunisiennes.
                  </p>
                </div>
                <div
                  className="solutions-category-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {categories.map((category) => (
                    <article
                      key={category.name}
                      className="solutions-category-card"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(10,16,30,0.9) 100%)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        borderRadius: "22px",
                        padding: "22px",
                        boxShadow: "0 10px 28px rgba(0,0,0,0.3)",
                      }}
                    >
                      <h3
                        className="solutions-category-title"
                        style={{
                          fontSize: "22px",
                          color: "#f8fafc",
                          fontWeight: 800,
                          marginBottom: "12px",
                        }}
                      >
                        {category.name}
                      </h3>

                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#9db0c9",
                          letterSpacing: "0.08em",
                        }}
                      >
                        BOUTIQUES
                      </p>
                      <div
                        className="solutions-chip-wrap"
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                          marginBottom: "14px",
                        }}
                      >
                        {category.stores.map((store) => (
                          <span
                            key={store}
                            className="solutions-chip"
                            style={{
                              background: "rgba(148,163,184,0.14)",
                              borderRadius: "999px",
                              padding: "5px 12px",
                              fontSize: "13px",
                              color: "#dbe7fb",
                              fontWeight: 600,
                            }}
                          >
                            {store}
                          </span>
                        ))}
                      </div>

                      <p
                        style={{
                          margin: "0 0 8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#9db0c9",
                          letterSpacing: "0.08em",
                        }}
                      >
                        PRODUITS
                      </p>
                      <ul
                        className="solutions-category-list"
                        style={{
                          margin: 0,
                          paddingLeft: "18px",
                          color: "#c5d3e8",
                        }}
                      >
                        {category.products.map((product) => (
                          <li key={product} style={{ marginBottom: "6px" }}>
                            {product}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="solutions-mission-wrap"
              style={{ padding: "80px 0 95px" }}
            >
              <div className="container">
                <div
                  className="solutions-mission-card"
                  style={{
                    borderRadius: "30px",
                    padding: "40px 30px",
                    textAlign: "center",
                    background: "linear-gradient(135deg, #e31e24, #7c3aed)",
                    color: "#ffffff",
                  }}
                >
                  <h2
                    className="solutions-heading"
                    style={{
                      fontSize: "clamp(28px, 4vw, 44px)",
                      fontWeight: 900,
                      color: "#fff",
                    }}
                  >
                    Notre mission
                  </h2>
                  <p
                    className="solutions-mission-text"
                    style={{
                      maxWidth: "900px",
                      margin: "14px auto 22px",
                      fontSize: "18px",
                      opacity: 0.94,
                    }}
                  >
                    Aider les consommateurs tunisiens a faire des achats
                    intelligents avec une comparaison de prix transparente et en
                    temps reel.
                  </p>
                  <div
                    className="solutions-mission-foot"
                    style={{ opacity: 0.92, fontWeight: 600 }}
                  >
                    Developpe en Tunisie, pour les Tunisiens
                  </div>
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
