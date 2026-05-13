const BASE = "https://1111-galylio-startup.vercel.app";

interface StoreCard {
  categories: string;
  href: string;
  logo: string;
  name: string;
  tags?: ("HOT" | "NEW")[];
  delay: string;
  prix: string;
  diff?: string;
  cheapest?: boolean;
}

const stores: StoreCard[] = [
  {
    categories: "ecommerce",
    href: "https://www.spacenet.tn",
    logo: `${BASE}/_next/image?url=%2Fimages%2Fspacenet-removebg-preview.png&w=256&q=75`,
    name: "Spacenet",
    delay: "0s",
    prix: "800.45",
    cheapest: true,
  },
  {
    categories: "ecommerce",
    href: "https://www.tunisianet.tn",
    logo: `${BASE}/_next/image?url=%2Fimages%2Ft%C3%A9l%C3%A9chargement%20(6).png&w=256&q=75`,
    name: "Tunisianet",
    delay: "0.1s",
    prix: "815.72",
    diff: "+1.9%",
  },
  {
    categories: "ecommerce",
    href: "https://www.batam.tn",
    logo: `${BASE}/_next/image?url=%2Fimages%2Flogo-batam.jpg&w=256&q=75`,
    name: "Batam",
    delay: "0.2s",
    prix: "828.38",
    diff: "+3.5%",
  },
  {
    categories: "ecommerce",
    href: "https://www.mytek.tn",
    logo: `${BASE}/_next/image?url=%2Fimages%2Ft%C3%A9l%C3%A9chargement%20(4).png&w=256&q=75`,
    name: "Mytek",
    tags: ["HOT"],
    delay: "0s",
    prix: "842.16",
    diff: "+5.2%",
  },
  {
    categories: "ecommerce new",
    href: "https://www.technopro.com.tn",
    logo: `${BASE}/_next/image?url=%2Fimages%2Ftechnopro-logo.jpg&w=256&q=75`,
    name: "TechnoPro",
    tags: ["NEW"],
    delay: "0.1s",
    prix: "855.93",
    diff: "+6.9%",
  },
  {
    categories: "ecommerce new",
    href: "https://www.darty.com.tn",
    logo: `https://www.google.com/s2/favicons?domain=darty.com.tn&sz=128`,
    name: "Darty",
    tags: ["NEW"],
    delay: "0.2s",
    prix: "867.54",
    diff: "+8.4%",
  },
];

function PrixBadge({ prix, diff, cheapest }: { prix: string; diff?: string; cheapest?: boolean }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: "10px",
      gap: "4px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: "4px",
        fontWeight: 700,
        fontSize: "18px",
        color: "#111",
        lineHeight: 1,
      }}>
        {prix}
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}>DT</span>
      </div>
      {cheapest ? (
        <span style={{
          fontSize: "10px",
          fontWeight: 700,
          background: "linear-gradient(90deg,#3BDEB9,#CCFF9B)",
          color: "#111",
          borderRadius: "20px",
          padding: "2px 8px",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}>
          Moins cher
        </span>
      ) : (
        <span style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "#e74c3c",
          background: "#fff0f0",
          borderRadius: "20px",
          padding: "2px 8px",
        }}>
          {diff}
        </span>
      )}
    </div>
  );
}

function StoreBox({ card }: { card: StoreCard }) {
  return (
    <div className={`${card.categories} item col-lg-4 col-6`}>
      <div className="home-box wow fadeInUp" data-wow-delay={card.delay}>
        <div className="innerbox">
          <div className="dot"><span></span><span></span><span></span></div>
          <div className="thumb">
            <a
              className="image"
              href={card.href}
              target="_blank"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
                minHeight: "180px",
                padding: "24px",
              }}
            >
              <img
                loading="lazy"
                src={card.logo}
                alt={card.name}
                style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain" }}
              />
              <PrixBadge prix={card.prix} diff={card.diff} cheapest={card.cheapest} />
            </a>
            <a className="tf-btn-3 light_skew_hover demo-full-link" href={card.href} target="_blank">Voir les prix</a>
          </div>
          <div className="content">
            <a href={card.href} target="_blank" className="title-box">{card.name}</a>
            {card.tags && card.tags.length > 0 && (
              <div className="tags">
                {card.tags.map((tag) => (
                  <div key={tag} className={`tag-item tag-${tag.toLowerCase()}`}>{tag}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CouffinSection() {
  return (
    <section className="section-demo" style={{ paddingTop: 0 }}>
      <div className="container-1">
        <div className="row">
          <div className="col-12">
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                Prix moyen global · Par catégorie · BUREAUTIQUE
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#fff" }}>
                Comparez les prix entre boutiques
              </div>
            </div>
          </div>
        </div>
        <div className="container-filter row">
          {stores.map((store) => (
            <StoreBox key={store.name} card={store} />
          ))}
        </div>
      </div>
    </section>
  );
}
