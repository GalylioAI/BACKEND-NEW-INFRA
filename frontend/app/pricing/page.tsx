import Header from "../components/Header";
import Footer from "../components/Footer";

type Plan = {
  name: string;
  tagline: string;
  price: string;
  period: string;
  badge?: string;
  cta: string;
  ctaHref: string;
  accent: string;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Gratuit",
    tagline: "Pour les particuliers qui comparent occasionnellement",
    price: "0 DT",
    period: "pour toujours",
    cta: "Commencer gratuitement",
    ctaHref: "/inscription",
    accent: "#111111",
    features: [
      "Comparaison de prix en temps réel",
      "Accès à 50K+ produits",
      "Recherche basique",
      "Historique 7 jours",
      "Alertes prix (3 max)",
    ],
  },
  {
    name: "Pro",
    tagline: "Pour les acheteurs réguliers et les petites entreprises",
    price: "99 DT",
    period: "/mois",
    badge: "Plus populaire",
    cta: "Essai gratuit 14 jours",
    ctaHref: "/inscription",
    accent: "#e31e24",
    features: [
      "Comparaison de prix en temps réel",
      "Accès à 50K+ produits",
      "Recherche avancée + filtres",
      "Historique 90 jours",
      "Alertes prix illimitées",
      "Support prioritaire",
      "API Access (1000 req/jour)",
    ],
  },
  {
    name: "Business",
    tagline: "Pour les entreprises et les revendeurs",
    price: "199 DT",
    period: "/mois",
    cta: "Contacter les ventes",
    ctaHref: "/connexion",
    accent: "#3BDEB9",
    features: [
      "Comparaison de prix en temps réel",
      "Accès à 50K+ produits",
      "Recherche avancée + filtres",
      "Historique illimité",
      "Support dédié 24/7",
      "API Access illimité",
      "Export tous formats",
    ],
  },
  {
    name: "Entreprise",
    tagline: "Solution sur mesure pour les grandes organisations",
    price: "Sur devis",
    period: "",
    cta: "Demander un devis",
    ctaHref: "/connexion",
    accent: "#f39c12",
    features: [
      "Tout de Business +",
      "Intégration ERP/CRM",
      "Dashboard personnalisé",
      "SLA garanti 99.9%",
      "Formation équipe",
      "Account Manager dédié",
      "White-label disponible",
    ],
  },
];

const includedFeatures = [
  {
    title: "Economies garanties",
    text: "Economisez en moyenne 40% grace a notre comparaison en temps reel.",
  },
  {
    title: "Alertes intelligentes",
    text: "Recevez des notifications instantanees quand les prix baissent.",
  },
  {
    title: "Analytics avances",
    text: "Analysez les tendances pour des decisions d'achat mieux informees.",
  },
  {
    title: "Donnees securisees",
    text: "Vos donnees sont protegees avec des standards de securite eleves.",
  },
  {
    title: "Support reactif",
    text: "Notre equipe vous accompagne pour optimiser votre experience.",
  },
  {
    title: "Export des rapports",
    text: "Recuperez vos rapports et bilans pour suivre vos performances.",
  },
];

export default function PricingPage() {
  return (
    <>
      <div className="tfmouseCursor cursor-outer"></div>
      <div className="tfmouseCursor cursor-inner"></div>

      <div id="wrapper">
        <div id="pagee">
          <Header />

          <main style={{ background: "#fafbff" }}>
            <section
              style={{
                background:
                  "linear-gradient(135deg, #0f172a 0%, #111827 45%, #e31e24 100%)",
                color: "#ffffff",
                padding: "180px 0 90px",
                textAlign: "center",
              }}
            >
              <div className="container">
                <div
                  style={{
                    display: "inline-block",
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: "999px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "20px",
                  }}
                >
                  Plans flexibles pour tous les besoins
                </div>
                <h1
                  style={{
                    fontSize: "clamp(32px, 5vw, 58px)",
                    fontWeight: 800,
                    marginBottom: "16px",
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                    textShadow: "0 2px 10px rgba(0,0,0,0.28)",
                  }}
                >
                  Choisissez votre plan
                </h1>
                <p
                  style={{
                    maxWidth: "760px",
                    margin: "0 auto",
                    opacity: 0.9,
                    fontSize: "18px",
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                    textShadow: "0 1px 8px rgba(0,0,0,0.22)",
                  }}
                >
                  Des solutions adaptees aux particuliers comme aux entreprises.
                  Commencez gratuitement et evoluez selon vos besoins.
                </p>
              </div>
            </section>

            <section style={{ padding: "70px 0 40px" }}>
              <div className="container">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {plans.map((plan) => (
                    <article
                      key={plan.name}
                      style={{
                        position: "relative",
                        background: "#ffffff",
                        border: `2px solid ${plan.badge ? plan.accent : "#e7e7ef"}`,
                        borderRadius: "24px",
                        padding: "24px",
                        boxShadow: plan.badge
                          ? "0 12px 30px rgba(227,30,36,0.18)"
                          : "0 8px 22px rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {plan.badge ? (
                        <div
                          style={{
                            position: "absolute",
                            top: "-12px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background:
                              "linear-gradient(90deg, #e31e24, #ff5a5f)",
                            color: "#fff",
                            borderRadius: "999px",
                            padding: "4px 12px",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {plan.badge}
                        </div>
                      ) : null}

                      <h3
                        style={{
                          fontSize: "24px",
                          fontWeight: 800,
                          color: "#111827",
                          marginBottom: "4px",
                        }}
                      >
                        {plan.name}
                      </h3>
                      <p
                        style={{
                          color: "#5b6476",
                          fontSize: "14px",
                          minHeight: "40px",
                        }}
                      >
                        {plan.tagline}
                      </p>

                      <div style={{ margin: "18px 0 20px" }}>
                        <span
                          style={{
                            fontSize: "40px",
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          {plan.price}
                        </span>
                        {plan.period ? (
                          <span style={{ color: "#5b6476", marginLeft: "6px" }}>
                            {plan.period}
                          </span>
                        ) : null}
                      </div>

                      <ul
                        style={{
                          margin: 0,
                          padding: 0,
                          listStyle: "none",
                          flex: 1,
                        }}
                      >
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                              marginBottom: "10px",
                              color: "#1f2937",
                              fontSize: "14px",
                            }}
                          >
                            <span
                              style={{ color: plan.accent, fontWeight: 800 }}
                            >
                              ✓
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <a
                        href={plan.ctaHref}
                        style={{
                          marginTop: "16px",
                          borderRadius: "999px",
                          textAlign: "center",
                          padding: "12px 16px",
                          fontWeight: 700,
                          color: "#ffffff",
                          textDecoration: "none",
                          background: plan.accent,
                        }}
                      >
                        {plan.cta}
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section style={{ padding: "40px 0 80px" }}>
              <div className="container">
                <div style={{ textAlign: "center", marginBottom: "26px" }}>
                  <h2
                    style={{
                      fontSize: "clamp(28px, 3.8vw, 42px)",
                      color: "#111827",
                      fontWeight: 800,
                    }}
                  >
                    Tout ce dont vous avez besoin
                  </h2>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {includedFeatures.map((item) => (
                    <div
                      key={item.title}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #ebedf3",
                        borderRadius: "18px",
                        padding: "18px",
                      }}
                    >
                      <h3
                        style={{
                          fontWeight: 800,
                          color: "#121926",
                          marginBottom: "8px",
                          fontSize: "18px",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          color: "#606b81",
                          margin: 0,
                          fontSize: "14px",
                        }}
                      >
                        {item.text}
                      </p>
                    </div>
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
