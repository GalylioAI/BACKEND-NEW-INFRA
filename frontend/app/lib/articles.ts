export type SectionType = "h2" | "h3" | "p" | "ul" | "highlight";

export interface ArticleSection {
  type: SectionType;
  text?: string;
  items?: string[];
}

export interface Article {
  slug: string;
  category: string;
  categoryColor: string;
  title: string;
  desc: string;
  img: string;
  read: string;
  date: string;
  sections: ArticleSection[];
}

export const articles: Article[] = [
  {
    slug: "comparer-prix-tunisie-economiser-achats-2026",
    category: "Comparateur de prix",
    categoryColor: "#7DD3FC",
    title: "Comparez les prix en Tunisie et economisez sur vos achats en 2026",
    desc: "Le guide pratique pour verifier les vrais bons plans en Tunisie, comparer les e-shops et acheter au meilleur moment.",
    img: "/images/innerpage/Blog_list_v1.jpg",
    read: "9 min",
    date: "Avr 2026",
    sections: [
      {
        type: "p",
        text: "Acheter en ligne en Tunisie devient plus complique quand les prix changent souvent, que les promotions manquent de clarte et qu'il faut comparer plusieurs boutiques avant de trouver une bonne offre. Ce guide vous aide a acheter avec plus de recul et a verifier rapidement ou un produit est vraiment le moins cher.",
      },
      {
        type: "h2",
        text: "Pourquoi comparer les prix est devenu vital en Tunisie",
      },
      {
        type: "p",
        text: "En 2026, l'inflation et la hausse du cout de la vie poussent les consommateurs a faire attention a chaque dinar. Se contenter d'un seul site ou d'une seule enseigne augmente le risque de payer trop cher pour un meme produit.",
      },
      {
        type: "p",
        text: "La multiplication des boutiques en ligne rend la recherche manuelle longue et peu fiable. Un smartphone, un laptop ou un refrigerateur peut afficher un ecart de plusieurs centaines de dinars selon le vendeur, avec en plus des faux rabais affiches pendant les periodes de soldes.",
      },
      {
        type: "p",
        text: "C'est justement la promesse de 1111.tn : apporter plus de transparence sur le marche tunisien et montrer les ecarts de prix de maniere simple avant l'achat.",
      },
      { type: "h2", text: "Qu'est-ce qu'un comparateur de prix intelligent ?" },
      {
        type: "p",
        text: "Un simple annuaire de produits vous donne une liste. Un comparateur intelligent analyse les offres, les variations de prix et la credibilite des promotions pour aider a prendre une meilleure decision.",
      },
      {
        type: "p",
        text: "Sur 1111.tn, le systeme de monitoring scanne en temps reel les grands sites e-commerce du pays afin d'afficher rapidement les meilleures offres disponibles sur une meme fiche produit.",
      },
      {
        type: "p",
        text: "La detection des faux prix est un autre point cle. Lorsqu'un prix grimpe juste avant une soi-disant promotion, l'historique aide a voir que la remise n'est pas un vrai bon plan. Cette logique permet d'acheter avec plus de confiance.",
      },
      {
        type: "highlight",
        text: "Comparer le prix d'achat ne suffit plus toujours : verifier l'historique, la fiabilite de la promo et meme la consommation energetique d'un produit peut faire gagner sur le long terme.",
      },
      {
        type: "h2",
        text: "Les sites a suivre pour comparer les prix en Tunisie",
      },
      { type: "h3", text: "1. 1111.tn : le point de depart pour comparer" },
      {
        type: "p",
        text: "1111.tn evite d'ouvrir une dizaine d'onglets pour verifier un meme produit. La plateforme regroupe les offres de plusieurs e-shops tunisiens et aide a reperer rapidement le tarif le plus interessant.",
      },
      {
        type: "p",
        text: "C'est particulierement utile pour l'informatique, l'electromenager, la parapharmacie et les achats du quotidien, avec une vision plus claire des prix moyens et des promotions suspectes.",
      },
      {
        type: "h3",
        text: "2. Tdiscount pour l'informatique et l'electromenager",
      },
      {
        type: "p",
        text: "Tdiscount fait partie des enseignes a surveiller pour les laptops, smartphones, accessoires informatiques et produits electromenagers. Les prix peuvent varier selon les stocks, les arrivages et les campagnes promotionnelles.",
      },
      {
        type: "p",
        text: "Avant de commander, verifier le meme produit sur 1111.tn permet de savoir si l'offre Tdiscount est vraiment competitive ou si un autre vendeur fait mieux.",
      },
      { type: "h3", text: "3. Parahouse pour la parapharmacie" },
      {
        type: "p",
        text: "Pour les produits de soin, les protections solaires, les articles bebe ou les achats de parapharmacie, Parahouse est un reflexe utile a comparer regulierement.",
      },
      {
        type: "p",
        text: "Sur cette categorie, de petits ecarts unitaires finissent vite par peser lourd lorsque plusieurs produits sont commandes ensemble. La comparaison permet donc de proteger le budget sur des achats repetes.",
      },
      {
        type: "h2",
        text: "Les categories ou vous economiserez le plus en 2026",
      },
      { type: "h3", text: "Informatique et smartphones" },
      {
        type: "p",
        text: "Les ecarts de prix y sont souvent les plus visibles. Pour un ordinateur portable ou un smartphone, il n'est pas rare de trouver 100 a 300 DT de difference selon l'enseigne. Comparer MyTek, Spacenet, Tunisianet, Tdiscount et d'autres vendeurs devient donc indispensable.",
      },
      { type: "h3", text: "Gros electromenager" },
      {
        type: "p",
        text: "Un refrigerateur ou une machine a laver represente un achat important. Les tarifs bougent selon les stocks, les caracteristiques et les politiques commerciales des revendeurs. Verifier plusieurs boutiques avant achat peut faire gagner une somme importante.",
      },
      { type: "h3", text: "Parapharmacie" },
      {
        type: "p",
        text: "La parapharmacie est souvent sous-estimee, alors que les economies y sont tres concretes. Les soins bebe, les produits d'hygiene et les protections solaires affichent regulierement des ecarts de prix significatifs.",
      },
      { type: "h3", text: "Le Couffin Tounsi" },
      {
        type: "p",
        text: "Les courses quotidiennes pesent lourd sur le budget. Comparer les produits de base entre Carrefour, Monoprix et Geant permet d'optimiser les depenses hebdomadaires sur les articles les plus repetitifs.",
      },
      {
        type: "ul",
        items: [
          "Tomates fraiches : environ 3.100 DT / kg",
          "Huile vegetale Nejma : environ 7.500 DT / 1L",
          "Oeufs frais : environ 3.500 DT / 6 pieces",
          "Oignons blancs : environ 2.100 DT / kg",
        ],
      },
      {
        type: "h2",
        text: "Guide strategique : comment acheter au meilleur moment",
      },
      { type: "h3", text: "Utilisez les alertes de prix et les predictions" },
      {
        type: "p",
        text: "Le bon prix depend aussi du bon timing. Les alertes de prix permettent d'etre notifie des qu'un produit atteint un budget cible, tandis que la prediction aide a savoir s'il vaut mieux acheter maintenant ou attendre une baisse.",
      },
      { type: "h3", text: "Le cas particulier des packs mariage" },
      {
        type: "p",
        text: "Pour equiper une maison complete, comparer les articles un par un n'est pas toujours la meilleure strategie. Certains packs mariage proposent des remises groupees interessantes sur le salon, la chambre ou la salle a manger.",
      },
      { type: "h3", text: "Mefiez-vous des soldes saisonnieres" },
      {
        type: "p",
        text: "Black Friday, Blue Friday et soldes de janvier peuvent cacher des prix artificiellement gonfles avant reduction. L'historique reste le meilleur moyen de verifier qu'un prix barre correspond a une vraie baisse.",
      },
      {
        type: "h2",
        text: "Commencez a economiser avec le meilleur prix Tunisie",
      },
      {
        type: "p",
        text: "Comparer les prix en Tunisie est devenu un reflexe simple mais tres rentable. Les plus gros gains se trouvent dans l'informatique, l'electromenager, la parapharmacie et les produits du quotidien.",
      },
      {
        type: "p",
        text: "Avant de finaliser un achat, prendre quelques secondes pour verifier le produit sur 1111.tn peut eviter de payer plus cher que necessaire et aider a choisir avec davantage de confiance.",
      },
      { type: "h2", text: "Questions frequentes" },
      {
        type: "h3",
        text: "Comment etre sur de trouver les meilleures offres ?",
      },
      {
        type: "p",
        text: "Le comparateur agrege les donnees de plusieurs grands e-shops tunisiens pour afficher rapidement l'offre la plus avantageuse et aider a distinguer les vraies promotions des remises marketing trompeuses.",
      },
      {
        type: "h3",
        text: "Est-ce que 1111.tn compare aussi les produits alimentaires ?",
      },
      {
        type: "p",
        text: "Oui. La fonctionnalite Couffin Tounsi suit les produits de premiere necessite et permet de comparer les prix des courses entre plusieurs grandes enseignes.",
      },
      {
        type: "h3",
        text: "Pourquoi les prix changent-ils d'un jour a l'autre ?",
      },
      {
        type: "p",
        text: "Les variations de stock, les produits importes, les taux de change et les campagnes commerciales font bouger les prix tres vite. D'ou l'interet des alertes et du suivi historique.",
      },
      { type: "h3", text: "Comment detecter une fausse promotion ?" },
      {
        type: "p",
        text: "Il faut regarder l'historique du prix. Si le montant a ete augmente juste avant la remise, la promotion est suspecte meme si l'etiquette annonce une grosse reduction.",
      },
      { type: "h3", text: "Ou trouve-t-on les gains les plus importants ?" },
      {
        type: "p",
        text: "Les plus fortes economies se concentrent surtout sur les laptops, smartphones, gros electromenager et produits de parapharmacie, c'est-a-dire les univers ou plusieurs vendeurs se disputent les memes references.",
      },
      {
        type: "highlight",
        text: "Le bon reflexe avant achat : comparer, verifier l'historique, puis acheter seulement quand le prix est vraiment aligne avec la valeur du produit.",
      },
    ],
  },
  {
    slug: "top-5-cartes-graphiques-tunisie-2025",
    category: "Cartes Graphiques",
    categoryColor: "#3BDEB9",
    title: "Top 5 Cartes Graphiques disponibles en Tunisie en 2025",
    desc: "RTX 4060, RX 7600, Arc B580… on compare les meilleures GPUs accessibles pour le gaming et le créatif.",
    img: "/images/item-cart.png",
    read: "6 min",
    date: "Avr 2025",
    sections: [
      {
        type: "p",
        text: "Le marché des cartes graphiques en Tunisie a évolué rapidement en 2025. Que vous soyez gamer, créateur de contenu ou développeur, voici notre sélection des 5 meilleures GPUs disponibles chez les revendeurs tunisiens.",
      },
      {
        type: "h2",
        text: "1. NVIDIA GeForce RTX 4060 — Meilleur rapport qualité/prix",
      },
      {
        type: "p",
        text: "La RTX 4060 reste la référence pour le gaming 1080p en 2025. Avec 8 Go de VRAM GDDR6 et le support du DLSS 3, elle offre des performances exceptionnelles pour son prix. Disponible chez Mytek à partir de 1 290 DT.",
      },
      {
        type: "h2",
        text: "2. AMD Radeon RX 7600 — L'alternative AMD abordable",
      },
      {
        type: "p",
        text: "La RX 7600 propose des performances similaires à la RTX 4060 avec 8 Go de VRAM. Son avantage principal : elle est souvent moins chère. Disponible chez Spacenet autour de 1 150 DT.",
      },
      { type: "h2", text: "3. Intel Arc B580 — La surprise de l'année" },
      {
        type: "p",
        text: "Intel a frappé fort avec l'Arc B580 : 12 Go de VRAM à un prix agressif. Idéale pour la création 3D et les jeux en 1080p/1440p. Prix observé chez Tunisianet : 990 DT.",
      },
      { type: "h2", text: "4. RTX 4070 Super — Pour le gaming 1440p exigeant" },
      {
        type: "p",
        text: "Si votre budget s'étire vers 2 000 DT, la RTX 4070 Super offre des performances 1440p excellentes avec ray tracing fluide et DLSS 3.5. Disponible chez Oxtek et Batam.",
      },
      { type: "h2", text: "5. RX 7700 XT — Le choix polyvalent" },
      {
        type: "p",
        text: "Avec 12 Go de VRAM et d'excellentes performances en rasterisation, la RX 7700 XT est parfaite pour les créatifs et les gamers exigeants à budget intermédiaire.",
      },
      {
        type: "ul",
        items: [
          "RTX 4060 : meilleur choix 1080p sous 1 400 DT",
          "RX 7600 : alternative AMD souvent moins chère",
          "Arc B580 : 12 Go VRAM pour moins de 1 000 DT",
          "RTX 4070 Super : excellence en 1440p vers 2 000 DT",
          "RX 7700 XT : polyvalence créatifs/gaming",
        ],
      },
      {
        type: "highlight",
        text: "Conseil 1111.tn : utilisez notre comparateur pour suivre l'évolution des prix de ces GPUs en temps réel sur tous les e-shops tunisiens et être alerté lors d'une baisse de prix.",
      },
    ],
  },
  {
    slug: "meilleurs-laptops-etudiants-tunisie-2025",
    category: "PC & Laptops",
    categoryColor: "#CCFF9B",
    title: "Meilleurs laptops pour étudiants en Tunisie — Guide 2025",
    desc: "Budget serré ? On sélectionne les ordinateurs portables avec le meilleur rapport qualité/prix chez Mytek, Spacenet et Tunisianet.",
    img: "/images/item-cart.png",
    read: "5 min",
    date: "Mar 2025",
    sections: [
      {
        type: "p",
        text: "La rentrée universitaire approche et choisir le bon laptop avec un budget limité peut s'avérer compliqué. Voici notre guide pour les étudiants tunisiens en 2025, basé sur les prix réels relevés sur 1111.tn.",
      },
      { type: "h2", text: "Budget moins de 1 200 DT — Lenovo IdeaPad Slim" },
      {
        type: "p",
        text: 'Le Lenovo IdeaPad Slim 3 avec AMD Ryzen 5 est idéal pour les tâches bureautiques, le surf et la prise de notes. 8 Go RAM, SSD 512 Go, écran 15.6". Prix observé : 1 050 DT chez Tunisianet.',
      },
      { type: "h2", text: "Budget 1 200–1 800 DT — ASUS VivoBook 15 OLED" },
      {
        type: "p",
        text: "Pour les étudiants en informatique, design ou médias, l'ASUS VivoBook 15 OLED offre un écran magnifique et des performances solides avec Intel Core i5-12500H. Disponible à 1 490 DT chez Mytek.",
      },
      { type: "h2", text: "Budget +1 800 DT — HP Pavilion Gaming" },
      {
        type: "p",
        text: "Le HP Pavilion avec NVIDIA RTX 3050 convient aux étudiants qui veulent aussi profiter du gaming. GPU dédié, 16 Go RAM, prix autour de 1 950 DT chez Spacenet.",
      },
      {
        type: "ul",
        items: [
          "Préférez toujours un SSD NVMe — gain de vitesse x5 vs HDD",
          "16 Go RAM recommandés pour le multitâche confortable",
          "Vérifiez si la garantie est locale (SAV en Tunisie)",
          "Comparez les prix sur 1111.tn avant tout achat",
        ],
      },
      {
        type: "highlight",
        text: "Astuce : les prix des laptops varient de 50 à 200 DT entre magasins pour le même modèle. Utilisez 1111.tn pour trouver le meilleur prix en temps réel.",
      },
    ],
  },
  {
    slug: "samsung-galaxy-vs-iphone-tunisie",
    category: "Smartphones",
    categoryColor: "#A78BFA",
    title: "Comparatif : Samsung Galaxy vs iPhone en Tunisie",
    desc: "Prix, disponibilité et garantie — tout ce qu'il faut savoir avant d'acheter votre prochain smartphone en ligne.",
    img: "/images/item-cart.png",
    read: "7 min",
    date: "Mar 2025",
    sections: [
      {
        type: "p",
        text: "Samsung Galaxy ou iPhone ? C'est la question que se posent des milliers de Tunisiens avant chaque achat de smartphone. Voici notre comparatif objectif basé sur les prix réels observés sur 1111.tn.",
      },
      {
        type: "h2",
        text: "Gamme milieu de gamme : Galaxy A55 5G vs iPhone 15",
      },
      {
        type: "p",
        text: "Le Samsung Galaxy A55 5G est disponible entre 1 290 et 1 450 DT selon les revendeurs tunisiens. L'iPhone 15 commence à 2 800 DT. Performances comparables pour la photo quotidienne, mais l'iPhone l'emporte sur la durée de support logiciel (6 ans vs 4 ans).",
      },
      { type: "h2", text: "Gamme premium : Galaxy S24 vs iPhone 15 Pro" },
      {
        type: "p",
        text: "Le Galaxy S24 est disponible à partir de 2 990 DT. L'iPhone 15 Pro oscille entre 3 800 et 4 200 DT. Les deux offrent des performances photo et vidéo exceptionnelles avec zoom optique 3x et enregistrement ProRes (iPhone).",
      },
      { type: "h2", text: "Disponibilité et SAV en Tunisie" },
      {
        type: "p",
        text: "Samsung dispose d'un réseau SAV bien développé en Tunisie avec des centres agréés à Tunis, Sfax et Sousse. Les iPhones bénéficient d'une garantie internationale mais les réparations officielles restent limitées sur le territoire.",
      },
      {
        type: "ul",
        items: [
          "Samsung : meilleure disponibilité, SAV local étendu",
          "iPhone : support logiciel plus long, écosystème premium",
          "Vérifiez si le modèle est officiel ou importé (garantie!)",
          "Les prix varient de 200 à 400 DT entre revendeurs",
        ],
      },
      {
        type: "highlight",
        text: "Sur 1111.tn, suivez l'historique des prix et activez une alerte pour être notifié quand un Galaxy ou iPhone baisse de prix.",
      },
    ],
  },
  {
    slug: "oled-vs-qled-guide-2025",
    category: "Télévisions",
    categoryColor: "#F59E0B",
    title: "OLED vs QLED : lequel choisir pour votre salon en 2025 ?",
    desc: "Analyse technique et comparaison des prix sur les grandes enseignes tunisiennes — Carrefour, Géant, Mytek.",
    img: "/images/item-cart.png",
    read: "8 min",
    date: "Fév 2025",
    sections: [
      {
        type: "p",
        text: "OLED ou QLED ? Cette question divise les amateurs de home cinéma depuis des années. En 2025, les deux technologies ont considérablement évolué. Voici notre analyse pour vous aider à faire le bon choix selon votre usage et votre budget en Tunisie.",
      },
      {
        type: "h2",
        text: "Technologie OLED — Noirs parfaits, contraste infini",
      },
      {
        type: "p",
        text: "Les TV OLED (LG, Sony, Philips) offrent des noirs absolus car chaque pixel s'éteint individuellement. Idéales pour le cinéma dans une pièce sombre et le gaming HDR. Les modèles LG C3 55\" sont disponibles à partir de 3 900 DT chez Géant et Carrefour.",
      },
      {
        type: "h2",
        text: "Technologie QLED — Luminosité maximale pour salons éclairés",
      },
      {
        type: "p",
        text: 'Les TV QLED (Samsung, TCL) brillent en plein jour avec une luminosité atteignant 2 000 nits. Meilleures pour les salons bien éclairés et le sport. Le Samsung QN85B 55" est disponible à 3 200 DT chez Mytek.',
      },
      { type: "h2", text: "Comparaison par usage" },
      {
        type: "ul",
        items: [
          "Cinéma / gaming HDR en pièce sombre → OLED",
          "Salon lumineux / sport / actualité → QLED",
          "Budget limité → QLED (moins cher à taille égale)",
          "Gaming compétitif → OLED (temps de réponse 0.1ms)",
          "Taille maximale pour budget fixe → QLED",
        ],
      },
      { type: "h2", text: "Prix observés en Tunisie (2025)" },
      {
        type: "p",
        text: "Les prix varient considérablement selon les enseignes. On observe jusqu'à 600 DT de différence sur un même modèle entre Carrefour, Géant et Mytek. Utilisez 1111.tn pour comparer en temps réel et profiter des meilleures offres.",
      },
      {
        type: "highlight",
        text: 'Notre verdict : pour la plupart des usages, une QLED 65" à 2 800 DT offre plus de valeur qu\'une OLED 55" à 4 000 DT — sauf si vous regardez beaucoup de films en pièce sombre.',
      },
    ],
  },
  {
    slug: "meilleurs-casques-bluetooth-300dt",
    category: "Casques & Audio",
    categoryColor: "#FB7185",
    title: "Les meilleurs casques Bluetooth à moins de 300 DT en Tunisie",
    desc: "Sony, JBL, Xiaomi — on passe en revue les casques les plus populaires avec leurs prix réels sur 1111.tn.",
    img: "/images/item-cart.png",
    read: "4 min",
    date: "Fév 2025",
    sections: [
      {
        type: "p",
        text: "Le marché des casques Bluetooth en Tunisie s'est démocratisé. En 2025, il est possible d'obtenir une excellente qualité audio et une réduction de bruit active (ANC) pour moins de 300 DT.",
      },
      { type: "h2", text: "JBL Tune 770NC — Meilleur rapport qualité/prix" },
      {
        type: "p",
        text: "À moins de 270 DT chez plusieurs revendeurs, le JBL Tune 770NC offre une ANC efficace et jusqu'à 70 heures d'autonomie. Il s'impose comme notre recommandation principale dans cette gamme de prix.",
      },
      { type: "h2", text: "Xiaomi Redmi Buds 5 Pro — Les meilleurs intra" },
      {
        type: "p",
        text: "Pour ceux qui préfèrent les intra-auriculaires, les Redmi Buds 5 Pro offrent une qualité sonore surprenante avec ANC correcte pour moins de 180 DT chez Mytek.",
      },
      {
        type: "h2",
        text: "Sony WH-1000XM4 — Le roi hors budget (mais vaut le coup)",
      },
      {
        type: "p",
        text: "Disponible autour de 850 DT chez Tunisianet, le Sony WH-1000XM4 reste la référence absolue pour la réduction de bruit active. Si votre budget le permet, c'est le meilleur investissement audio du marché.",
      },
      {
        type: "ul",
        items: [
          "JBL Tune 770NC : meilleur rapport qualité/prix sous 300 DT",
          "Xiaomi Redmi Buds 5 Pro : meilleurs intra budget",
          "Sony WH-1000XM4 : meilleure ANC du marché",
          "Évitez les contrefaçons : achetez chez des revendeurs agréés",
        ],
      },
      {
        type: "highlight",
        text: "Les prix des casques Bluetooth varient de 50 à 150 DT entre revendeurs. Configurez une alerte prix sur 1111.tn pour ne rater aucune promo.",
      },
    ],
  },
  {
    slug: "pc-gaming-3000dt-tunisie",
    category: "Gaming",
    categoryColor: "#38BDF8",
    title: "Monter un PC Gaming à moins de 3 000 DT en Tunisie",
    desc: "Config complète — CPU, GPU, RAM, stockage — avec des composants disponibles et comparés sur les e-shops tunisiens.",
    img: "/images/item-cart.png",
    read: "10 min",
    date: "Jan 2025",
    sections: [
      {
        type: "p",
        text: "Monter un PC gaming en Tunisie avec un budget de 3 000 DT est tout à fait réalisable en 2025. Voici notre configuration optimisée, basée sur les prix réels relevés sur 1111.tn.",
      },
      { type: "h2", text: "Processeur — AMD Ryzen 5 7600 (~450 DT)" },
      {
        type: "p",
        text: "Le Ryzen 5 7600 offre 6 cœurs / 12 threads avec une fréquence boost à 5.1 GHz. C'est le processeur idéal pour le gaming 1080p/1440p sans goulot d'étranglement. Disponible chez Spacenet et Mytek.",
      },
      { type: "h2", text: "Carte Graphique — Intel Arc B580 (~990 DT)" },
      {
        type: "p",
        text: "Pour ce budget, l'Arc B580 avec 12 Go de VRAM GDDR6 est un choix remarquable. Ses performances rivalisent avec la RTX 4060 à un coût inférieur, surtout en DirectX 12.",
      },
      { type: "h2", text: "RAM — 32 Go DDR5 (~280 DT)" },
      {
        type: "p",
        text: "Un kit 32 Go DDR5-5600 pour passer les prochaines années sans contrainte mémoire. Kingston Fury Beast ou Corsair Vengeance disponibles chez Tunisianet.",
      },
      {
        type: "ul",
        items: [
          "CPU : AMD Ryzen 5 7600 — ~450 DT",
          "GPU : Intel Arc B580 12 Go — ~990 DT",
          "RAM : 32 Go DDR5-5600 — ~280 DT",
          "SSD : 1 To NVMe PCIe 4.0 — ~200 DT",
          "Carte mère B650 — ~480 DT",
          "Alimentation 650W 80+ Gold — ~280 DT",
          "Boîtier avec airflow — ~190 DT",
          "Total estimé : ~2 870 DT",
        ],
      },
      {
        type: "highlight",
        text: "Cette configuration permet de jouer en 1440p à plus de 60 FPS sur la majorité des jeux AAA 2025. Comparez chaque composant sur 1111.tn pour économiser jusqu'à 300 DT sur le total.",
      },
    ],
  },
  {
    slug: "meilleurs-ssd-tunisie-2025",
    category: "Stockage",
    categoryColor: "#34D399",
    title: "Meilleurs SSD disponibles en Tunisie — Comparatif 2025",
    desc: "NVMe, SATA, portable — on compare les meilleures options de stockage avec leurs prix chez les e-shops tunisiens.",
    img: "/images/item-cart.png",
    read: "5 min",
    date: "Jan 2025",
    sections: [
      {
        type: "p",
        text: "Un bon SSD transforme radicalement l'expérience informatique. Démarrage en 10 secondes, ouverture instantanée des applications, chargements de jeux divisés par 5. Voici les meilleures options disponibles en Tunisie en 2025.",
      },
      { type: "h2", text: "SSD NVMe PCIe 4.0 — Performance maximale" },
      {
        type: "p",
        text: "Le Samsung 980 Pro 1 To reste la référence absolue avec ses 7 000 Mo/s en lecture séquentielle. Disponible à 290 DT chez Mytek et Spacenet. Idéal pour les PC gaming, les workstations et les montages vidéo 4K.",
      },
      { type: "h2", text: "SSD NVMe PCIe 3.0 — Meilleur rapport qualité/prix" },
      {
        type: "p",
        text: "Le Kingston NV3 1 To à 185 DT offre 3 500 Mo/s — amplement suffisant pour la majorité des usages quotidiens et du gaming. Excellent choix pour upgrader un PC existant. Disponible chez Tunisianet.",
      },
      { type: "h2", text: "SSD SATA — Pour moderniser d'anciens PC" },
      {
        type: "p",
        text: "Le Crucial BX500 500 Go à 120 DT est parfait pour donner une seconde vie à un vieux laptop ou desktop. Vitesses jusqu'à 540 Mo/s, soit 5x plus rapide qu'un disque dur mécanique.",
      },
      {
        type: "ul",
        items: [
          "PC gaming neuf → Samsung 980 Pro ou WD Black SN850X (PCIe 4.0)",
          "Upgrade PC existant → Kingston NV3 (PCIe 3.0, bon prix)",
          "Vieux laptop/desktop → Crucial BX500 ou Kingston A400 (SATA)",
          "Stockage portable → Samsung T7 Shield USB-C (eau/chocs)",
        ],
      },
      {
        type: "highlight",
        text: "Conseil 1111.tn : les prix des SSD varient jusqu'à 60 DT entre revendeurs pour le même modèle. Comparez avant d'acheter et activez une alerte pour les promotions !",
      },
    ],
  },
  {
    slug: "guide-electromenager-tunisie-2025",
    category: "Électroménager",
    categoryColor: "#E879F9",
    title: "Guide Électroménager — Les meilleures marques en Tunisie 2025",
    desc: "Réfrigérateurs, machines à laver, climatiseurs — on compare les prix et marques dans les grandes surfaces tunisiennes.",
    img: "/images/item-cart.png",
    read: "6 min",
    date: "Jan 2025",
    sections: [
      {
        type: "p",
        text: "L'électroménager représente un investissement important pour chaque foyer tunisien. Les prix varient considérablement entre Carrefour, Géant, Aziza et les e-shops en ligne. Voici notre guide complet 2025 pour faire le bon choix.",
      },
      { type: "h2", text: "Réfrigérateurs — Samsung, LG et Beko en tête" },
      {
        type: "p",
        text: "Le Samsung RS68A Side-by-Side est disponible à partir de 3 200 DT chez Géant. Le LG GBB72 No-Frost est une excellente alternative à 1 890 DT. Beko propose les meilleurs tarifs d'entrée de gamme à partir de 980 DT chez Aziza et Carrefour.",
      },
      { type: "h2", text: "Machines à laver — Bosch et Samsung dominent" },
      {
        type: "p",
        text: "La Bosch WAN24263FF 8 kg à 1 350 DT chez Carrefour est notre recommandation premium. Pour un budget maîtrisé, la Samsung WW90T4540AX 9 kg est disponible à 1 150 DT chez MG Marché — excellent rapport capacité/prix.",
      },
      { type: "h2", text: "Climatiseurs — Gree Inverter en leader" },
      {
        type: "p",
        text: "Les climatiseurs Gree Inverter 1.5 CV sont disponibles à partir de 1 290 DT. La marque Aux propose des modèles WiFi à partir de 1 100 DT chez Aziza. L'Inverter est indispensable pour économiser sur la facture d'électricité.",
      },
      {
        type: "ul",
        items: [
          "Comparez toujours au moins 3 revendeurs avant l'achat",
          "Garantie minimum : 2 ans pour le gros électroménager",
          "Les prix en ligne sont souvent 10–15% moins chers qu'en magasin",
          "Inverter = économies sur l'électricité à long terme",
        ],
      },
      {
        type: "highlight",
        text: "Sur 1111.tn, comparez en temps réel les prix de l'électroménager dans toutes les grandes surfaces et boutiques en ligne de Tunisie.",
      },
    ],
  },
];
