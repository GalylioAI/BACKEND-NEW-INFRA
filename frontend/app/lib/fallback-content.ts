export const FALLBACK_MARKET_NEWS = {
  left: [
    { tag: "Tendance", text: "Les produits les plus suivis changent selon les disponibilites boutique." },
    { tag: "Prix", text: "Les variations historiques ne sont pas encore exposees par l'API backend." },
    { tag: "Catalogue", text: "Les categories sans visuel officiel utilisent les assets locaux du template." },
  ],
  right: [
    { tag: "Parapharmacie", text: "Les top categories disponibles viennent du backend parapharmacie." },
    { tag: "Electromenager", text: "La page dediee filtre le catalogue par top category backend." },
    { tag: "Promos", text: "Aucun endpoint de banniere marketing n'est expose actuellement." },
  ],
};

export const FALLBACK_SUPERMARKET_STORES = [
  { name: "Carrefour", logo: "/images/carrefour.png", productCount: 0, averagePrice: 0 },
  { name: "Monoprix", logo: "/images/monoprix.png", productCount: 0, averagePrice: 0 },
  { name: "Geant", logo: "/images/geant.png", productCount: 0, averagePrice: 0 },
  { name: "MG", logo: "/images/mg.png", productCount: 0, averagePrice: 0 },
  { name: "Aziza", logo: "/images/aziza.png", productCount: 0, averagePrice: 0 },
];

export const FALLBACK_CATEGORY_VISUALS = [
  { name: "Smartphones", image: "/images/Smartphones.jpg", href: "/products?category=Telephonie%20%26%20Objets%20connectes" },
  { name: "Electromenager", image: "/images/Électroménager.jfif", href: "/electromenager" },
  { name: "Parapharmacie", image: "/images/home/skincare2.jpg", href: "/parapharmacie" },
  { name: "Televisions", image: "/images/télévisions.jfif", href: "/products?category=TV%20%2F%20Photo%20%2F%20Son" },
  { name: "Informatique", image: "/images/Laptops & Informatique.jpg", href: "/products?category=Informatique" },
];

export const FALLBACK_PRICE_INTELLIGENCE_ITEMS = [
  { name: "Refrigerateur combine", trend: "+2.4%", confidence: "Moyenne" },
  { name: "Creme solaire SPF50", trend: "-1.8%", confidence: "Faible" },
  { name: "Smartphone 256 Go", trend: "-3.1%", confidence: "Moyenne" },
];

export const FALLBACK_BASKET_ITEMS = [
  { name: "Lait", category: "Supermarche" },
  { name: "Cafe", category: "Supermarche" },
  { name: "Savon dermatologique", category: "Parapharmacie" },
];
