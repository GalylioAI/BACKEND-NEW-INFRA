import { demoAsync } from "./async";
import type {
  CatalogProduct,
  CatalogSource,
  CategoryAnalytics,
  CategoryType,
  FakePromoItem,
  ParaProduct,
  Product,
  ProductListResponse,
  ProductListingParams,
  ProductSearchResult,
  ShopPrice,
} from "./types";

const retailProducts: Product[] = [
  {
    id: "retail-galaxy-s24",
    name: "Samsung Galaxy S24 256 Go",
    brand: "Samsung",
    bestPrice: 2799,
    originalPrice: 3099,
    image: "/images/samsung.png",
    images: ["/images/samsung.png", "/images/Smartphones.jpg"],
    description:
      "Smartphone premium avec ecran AMOLED, appareil photo avance et autonomie longue duree.",
    inStock: true,
    category: "Smartphones",
    specifications: {
      top_category: "Smartphones",
      low_category: "Android",
      storage: "256 Go",
    },
    shopPrices: [
      {
        shop: "mytek",
        price: 2799,
        oldPrice: 3099,
        available: true,
        url: "/products/retail-galaxy-s24?source=retail",
      },
      {
        shop: "tunisianet",
        price: 2849,
        oldPrice: 3099,
        available: true,
        url: "/products/retail-galaxy-s24?source=retail",
      },
      {
        shop: "spacenet",
        price: 2890,
        oldPrice: 3090,
        available: true,
        url: "/products/retail-galaxy-s24?source=retail",
      },
    ],
  },
  {
    id: "retail-iphone-15",
    name: "Apple iPhone 15 128 Go",
    brand: "Apple",
    bestPrice: 3299,
    originalPrice: 3499,
    image: "/images/Smartphones.webp",
    description:
      "iPhone nouvelle generation avec Dynamic Island, USB-C et puce A16 Bionic.",
    inStock: true,
    category: "Smartphones",
    specifications: {
      top_category: "Smartphones",
      low_category: "iOS",
      storage: "128 Go",
    },
    shopPrices: [
      {
        shop: "tunisianet",
        price: 3299,
        oldPrice: 3499,
        available: true,
        url: "/products/retail-iphone-15?source=retail",
      },
      {
        shop: "mytek",
        price: 3349,
        oldPrice: 3499,
        available: true,
        url: "/products/retail-iphone-15?source=retail",
      },
      {
        shop: "darty",
        price: 3380,
        oldPrice: null,
        available: false,
        url: "/products/retail-iphone-15?source=retail",
      },
    ],
  },
  {
    id: "retail-lenovo-ideapad",
    name: "Lenovo IdeaPad Slim 5 i5",
    brand: "Lenovo",
    bestPrice: 1899,
    originalPrice: 2199,
    image: "/images/laptops-informatique.webp",
    description:
      "Laptop fin pour travail, etudes et navigation intensive avec SSD rapide.",
    inStock: true,
    category: "Laptops & Informatique",
    specifications: {
      top_category: "Informatique",
      low_category: "Laptop",
      ram: "16 Go",
      storage: "512 Go SSD",
    },
    shopPrices: [
      {
        shop: "mytek",
        price: 1899,
        oldPrice: 2199,
        available: true,
        url: "/products/retail-lenovo-ideapad?source=retail",
      },
      {
        shop: "spacenet",
        price: 1959,
        oldPrice: 2199,
        available: true,
        url: "/products/retail-lenovo-ideapad?source=retail",
      },
      {
        shop: "technopro",
        price: 1999,
        oldPrice: null,
        available: true,
        url: "/products/retail-lenovo-ideapad?source=retail",
      },
    ],
  },
  {
    id: "retail-asus-gaming",
    name: "ASUS TUF Gaming F15 RTX 4060",
    brand: "ASUS",
    bestPrice: 3599,
    originalPrice: 3899,
    image: "/images/gaming.jpg",
    description:
      "PC portable gaming avec carte graphique RTX, ecran rapide et refroidissement renforce.",
    inStock: true,
    category: "Gaming",
    specifications: {
      top_category: "Informatique",
      low_category: "Gaming",
      gpu: "RTX 4060",
    },
    shopPrices: [
      {
        shop: "spacenet",
        price: 3599,
        oldPrice: 3899,
        available: true,
        url: "/products/retail-asus-gaming?source=retail",
      },
      {
        shop: "mytek",
        price: 3649,
        oldPrice: 3899,
        available: true,
        url: "/products/retail-asus-gaming?source=retail",
      },
      {
        shop: "tunisianet",
        price: 3720,
        oldPrice: 3890,
        available: false,
        url: "/products/retail-asus-gaming?source=retail",
      },
    ],
  },
  {
    id: "retail-tv-oled-55",
    name: "LG OLED 55 pouces 4K",
    brand: "LG",
    bestPrice: 3999,
    originalPrice: 4599,
    image: "/images/OLED.avif",
    description:
      "Television OLED 4K avec noirs profonds, HDMI 2.1 et mode cinema.",
    inStock: true,
    category: "Televisions",
    specifications: {
      top_category: "TV / Photo / Son",
      low_category: "OLED",
      size: "55 pouces",
    },
    shopPrices: [
      {
        shop: "darty",
        price: 3999,
        oldPrice: 4599,
        available: true,
        url: "/products/retail-tv-oled-55?source=retail",
      },
      {
        shop: "mytek",
        price: 4149,
        oldPrice: 4599,
        available: true,
        url: "/products/retail-tv-oled-55?source=retail",
      },
      {
        shop: "technopro",
        price: 4190,
        oldPrice: 4590,
        available: true,
        url: "/products/retail-tv-oled-55?source=retail",
      },
    ],
  },
  {
    id: "retail-fridge-samsung",
    name: "Refrigerateur Samsung No Frost",
    brand: "Samsung",
    bestPrice: 2399,
    originalPrice: 2699,
    image: "/images/Électroménager.jfif",
    description:
      "Refrigerateur familial No Frost avec grande capacite et economie d'energie.",
    inStock: true,
    category: "Refrigerateurs",
    specifications: {
      top_category: "Électroménager",
      low_category: "Froid",
      capacity: "400 L",
    },
    shopPrices: [
      {
        shop: "darty",
        price: 2399,
        oldPrice: 2699,
        available: true,
        url: "/products/retail-fridge-samsung?source=retail",
      },
      {
        shop: "mytek",
        price: 2460,
        oldPrice: 2690,
        available: true,
        url: "/products/retail-fridge-samsung?source=retail",
      },
      {
        shop: "tunisianet",
        price: 2515,
        oldPrice: null,
        available: true,
        url: "/products/retail-fridge-samsung?source=retail",
      },
    ],
  },
  {
    id: "retail-washing-lg",
    name: "Lave-linge LG 9 kg Inverter",
    brand: "LG",
    bestPrice: 1699,
    originalPrice: 1899,
    image: "/images/item-cart.jpeg",
    description:
      "Machine a laver silencieuse avec moteur inverter et programmes rapides.",
    inStock: true,
    category: "Lavage",
    specifications: {
      top_category: "Électroménager",
      low_category: "Lavage",
      capacity: "9 kg",
    },
    shopPrices: [
      {
        shop: "technopro",
        price: 1699,
        oldPrice: 1899,
        available: true,
        url: "/products/retail-washing-lg?source=retail",
      },
      {
        shop: "darty",
        price: 1760,
        oldPrice: null,
        available: true,
        url: "/products/retail-washing-lg?source=retail",
      },
      {
        shop: "mytek",
        price: 1799,
        oldPrice: 1899,
        available: false,
        url: "/products/retail-washing-lg?source=retail",
      },
    ],
  },
  {
    id: "retail-headset-sony",
    name: "Sony WH-1000XM5 Casque Bluetooth",
    brand: "Sony",
    bestPrice: 1199,
    originalPrice: 1399,
    image: "/images/casques-audio.webp",
    description:
      "Casque sans fil a reduction de bruit active et grande autonomie.",
    inStock: true,
    category: "Casques & Audio",
    specifications: {
      top_category: "TV / Photo / Son",
      low_category: "Audio",
      autonomy: "30 h",
    },
    shopPrices: [
      {
        shop: "tunisianet",
        price: 1199,
        oldPrice: 1399,
        available: true,
        url: "/products/retail-headset-sony?source=retail",
      },
      {
        shop: "spacenet",
        price: 1249,
        oldPrice: 1399,
        available: true,
        url: "/products/retail-headset-sony?source=retail",
      },
      {
        shop: "mytek",
        price: 1290,
        oldPrice: null,
        available: true,
        url: "/products/retail-headset-sony?source=retail",
      },
    ],
  },
];

const paraProducts: ParaProduct[] = [
  {
    id: "para-sunscreen-spf50",
    name: "La Roche-Posay Anthelios SPF50+",
    brand: "La Roche-Posay",
    bestPrice: 64.9,
    originalPrice: 78,
    image: "/images/para-banner-solaire.png",
    description: "Protection solaire haute tolerance pour visage sensible.",
    inStock: true,
    category: "Solaire",
    topCategory: "Solaire",
    specifications: { low_category: "Protection visage", format: "50 ml" },
    shopPrices: [
      {
        shop: "parashop",
        price: 64.9,
        oldPrice: 78,
        available: true,
        url: "/products/para-sunscreen-spf50?source=para",
      },
      {
        shop: "pharma_shop",
        price: 67.5,
        oldPrice: 78,
        available: true,
        url: "/products/para-sunscreen-spf50?source=para",
      },
      {
        shop: "parafendri",
        price: 69.9,
        oldPrice: null,
        available: true,
        url: "/products/para-sunscreen-spf50?source=para",
      },
    ],
  },
  {
    id: "para-vitamin-c-serum",
    name: "Vichy Liftactiv Vitamine C Serum",
    brand: "Vichy",
    bestPrice: 92,
    originalPrice: 109,
    image: "/images/para-banner-visage.webp",
    description: "Serum eclat anti-oxydant pour routine visage quotidienne.",
    inStock: true,
    category: "Visage",
    topCategory: "Visage",
    specifications: { low_category: "Serums", format: "20 ml" },
    shopPrices: [
      {
        shop: "pharma_shop",
        price: 92,
        oldPrice: 109,
        available: true,
        url: "/products/para-vitamin-c-serum?source=para",
      },
      {
        shop: "parashop",
        price: 95,
        oldPrice: 109,
        available: true,
        url: "/products/para-vitamin-c-serum?source=para",
      },
      {
        shop: "parafendri",
        price: 99,
        oldPrice: null,
        available: false,
        url: "/products/para-vitamin-c-serum?source=para",
      },
    ],
  },
  {
    id: "para-baby-wipes",
    name: "Mustela Lingettes Douces Bebe",
    brand: "Mustela",
    bestPrice: 18.5,
    originalPrice: 22,
    image: "/images/para-banner-hygiene.png",
    description: "Lingettes nettoyantes pour la toilette quotidienne de bebe.",
    inStock: true,
    category: "Bebe",
    topCategory: "Hygiene",
    specifications: { low_category: "Bebe", count: "70 lingettes" },
    shopPrices: [
      {
        shop: "parafendri",
        price: 18.5,
        oldPrice: 22,
        available: true,
        url: "/products/para-baby-wipes?source=para",
      },
      {
        shop: "parashop",
        price: 19.2,
        oldPrice: 22,
        available: true,
        url: "/products/para-baby-wipes?source=para",
      },
      {
        shop: "pharma_shop",
        price: 20,
        oldPrice: null,
        available: true,
        url: "/products/para-baby-wipes?source=para",
      },
    ],
  },
  {
    id: "para-hydrating-cream",
    name: "CeraVe Creme Hydratante",
    brand: "CeraVe",
    bestPrice: 52.8,
    originalPrice: 61,
    image: "/images/parahouse.png",
    description: "Creme hydratante aux ceramides pour visage et corps.",
    inStock: true,
    category: "Hydratation",
    topCategory: "Visage",
    specifications: { low_category: "Hydratants", format: "340 g" },
    shopPrices: [
      {
        shop: "parashop",
        price: 52.8,
        oldPrice: 61,
        available: true,
        url: "/products/para-hydrating-cream?source=para",
      },
      {
        shop: "parafendri",
        price: 54.4,
        oldPrice: 61,
        available: true,
        url: "/products/para-hydrating-cream?source=para",
      },
      {
        shop: "pharma_shop",
        price: 55.9,
        oldPrice: null,
        available: true,
        url: "/products/para-hydrating-cream?source=para",
      },
    ],
  },
  {
    id: "para-shaving-gel",
    name: "Avène Mousse a Raser",
    brand: "Avène",
    bestPrice: 34.5,
    originalPrice: 41,
    image: "/images/shaving.webp",
    description: "Mousse a raser apaisante pour peaux sensibles.",
    inStock: true,
    category: "Homme",
    topCategory: "Hygiene",
    specifications: { low_category: "Rasage", format: "200 ml" },
    shopPrices: [
      {
        shop: "pharma_shop",
        price: 34.5,
        oldPrice: 41,
        available: true,
        url: "/products/para-shaving-gel?source=para",
      },
      {
        shop: "parashop",
        price: 36,
        oldPrice: 41,
        available: true,
        url: "/products/para-shaving-gel?source=para",
      },
      {
        shop: "parafendri",
        price: 37,
        oldPrice: null,
        available: false,
        url: "/products/para-shaving-gel?source=para",
      },
    ],
  },
  {
    id: "para-magnesium",
    name: "Magnesium B6 60 Comprimes",
    brand: "NutriPlus",
    bestPrice: 29.9,
    originalPrice: 36,
    image: "/images/parafendri.jpg",
    description:
      "Complement alimentaire pour fatigue passagere et confort musculaire.",
    inStock: true,
    category: "Vitamines",
    topCategory: "Complement",
    specifications: { low_category: "Mineraux", count: "60 comprimes" },
    shopPrices: [
      {
        shop: "parafendri",
        price: 29.9,
        oldPrice: 36,
        available: true,
        url: "/products/para-magnesium?source=para",
      },
      {
        shop: "pharma_shop",
        price: 31.5,
        oldPrice: 36,
        available: true,
        url: "/products/para-magnesium?source=para",
      },
      {
        shop: "parashop",
        price: 32,
        oldPrice: null,
        available: true,
        url: "/products/para-magnesium?source=para",
      },
    ],
  },
];

function normalize(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function productTopCategory(product: CatalogProduct) {
  return String(
    product.specifications?.top_category ||
      ("topCategory" in product ? product.topCategory : "") ||
      product.category ||
      "",
  );
}

function productLowCategory(product: CatalogProduct) {
  return String(
    product.specifications?.low_category ||
      product.category ||
      productTopCategory(product),
  );
}

function matchesCategory(
  product: CatalogProduct,
  category: string,
  type: CategoryType = "subcategory",
) {
  const wanted = normalize(category);
  if (!wanted) return true;
  const candidates =
    type === "top_category"
      ? [
          productTopCategory(product),
          "topCategory" in product ? product.topCategory : "",
        ]
      : type === "low_category"
        ? [productLowCategory(product), product.category]
        : [product.category, productLowCategory(product)];
  return candidates.some((candidate) => normalize(candidate).includes(wanted));
}

function matchesSearch(product: CatalogProduct, search?: string) {
  const term = normalize(search);
  if (!term) return true;
  return [
    product.name,
    product.brand,
    product.category,
    productTopCategory(product),
  ].some((value) => normalize(value).includes(term));
}

function filterProducts<T extends CatalogProduct>(
  items: T[],
  params: ProductListingParams,
) {
  return items.filter((product) => {
    if (
      params.category &&
      !matchesCategory(product, params.category, params.category_type)
    )
      return false;
    if (!matchesSearch(product, params.search)) return false;
    if (
      typeof params.min_price === "number" &&
      product.bestPrice < params.min_price
    )
      return false;
    if (
      typeof params.max_price === "number" &&
      product.bestPrice > params.max_price
    )
      return false;
    if (params.in_stock && !product.inStock) return false;
    return true;
  });
}

function paginate<T extends CatalogProduct>(
  items: T[],
  params: ProductListingParams,
): ProductListResponse<T> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 12);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    products: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
}

function categoriesFor(items: CatalogProduct[], type: CategoryType) {
  const values = items.map((product) => {
    if (type === "top_category") return productTopCategory(product);
    if (type === "low_category") return productLowCategory(product);
    return product.category || productLowCategory(product);
  });
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function searchResult(
  product: CatalogProduct,
  relevance = 1,
): ProductSearchResult {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    bestPrice: product.bestPrice,
    image: product.image,
    inStock: product.inStock,
    relevance,
  };
}

function analyticsFor(
  items: CatalogProduct[],
  category: string,
  type: CategoryType,
): CategoryAnalytics {
  const products = filterProducts(items, { category, category_type: type });
  const rows = new Map<string, { prices: number[]; available: number }>();

  for (const product of products) {
    for (const price of product.shopPrices || []) {
      const current = rows.get(price.shop) || { prices: [], available: 0 };
      current.prices.push(price.price);
      if (price.available ?? product.inStock) current.available += 1;
      rows.set(price.shop, current);
    }
  }

  const shop_rankings = [...rows.entries()]
    .map(([shop, row]) => ({
      shop,
      avg_price:
        row.prices.reduce((sum, value) => sum + value, 0) /
        Math.max(row.prices.length, 1),
      min_price: Math.min(...row.prices),
      max_price: Math.max(...row.prices),
      product_count: row.prices.length,
    }))
    .sort((a, b) => a.avg_price - b.avg_price);

  return {
    category,
    cheapest_shop: shop_rankings[0]?.shop || "Demo",
    cheapest_avg_price: shop_rankings[0]?.avg_price || 0,
    shop_rankings,
    only_available: false,
  };
}

function fakePromoFromProduct(
  product: CatalogProduct,
  index: number,
): FakePromoItem {
  const shop =
    product.shopPrices?.[index % (product.shopPrices?.length || 1)]?.shop ||
    "demo-shop";
  const oldPrice = product.originalPrice || product.bestPrice * 1.18;
  const inflated = Math.round(oldPrice * 1.08);
  return {
    id: `promo-${product.id}`,
    product_id: product.id,
    sku: product.id.toUpperCase(),
    title: product.name,
    brand: product.brand,
    shop,
    image: product.image,
    url: `/products/${product.id}`,
    old_scrap_old_price: oldPrice,
    old_scrap_price: product.bestPrice,
    new_scrap_price: product.bestPrice,
    new_scrap_old_price: inflated,
    price_change: product.bestPrice - oldPrice,
    price_change_pct: Math.round(
      ((product.bestPrice - oldPrice) / oldPrice) * 100,
    ),
    real_increase: inflated - oldPrice,
    real_increase_pct: Math.round(((inflated - oldPrice) / oldPrice) * 100),
    old_price_inflated_by: inflated - oldPrice,
    old_price_inflated_by_pct: Math.round(
      ((inflated - oldPrice) / oldPrice) * 100,
    ),
    advertised_discount: inflated - product.bestPrice,
    advertised_discount_pct: Math.round(
      ((inflated - product.bestPrice) / inflated) * 100,
    ),
    verdict: "Demo alert",
    top_category: productTopCategory(product),
    subcategory: product.category,
    category: product.category,
    updated_at: new Date(Date.now() - index * 3600_000).toISOString(),
  };
}

export function getProductCategories(type: CategoryType = "subcategory") {
  return demoAsync(categoriesFor(retailProducts, type));
}

export function getParaCategories(type: CategoryType = "top_category") {
  return demoAsync(categoriesFor(paraProducts, type));
}

export function listProducts(
  params: ProductListingParams = {},
  _init?: unknown,
) {
  return demoAsync(paginate(filterProducts(retailProducts, params), params));
}

export function listParaProducts(
  params: ProductListingParams = {},
  _init?: unknown,
) {
  return demoAsync(paginate(filterProducts(paraProducts, params), params));
}

export function listCatalogProducts(
  source: CatalogSource,
  params: ProductListingParams = {},
  init?: unknown,
) {
  return source === "para"
    ? listParaProducts(params, init)
    : listProducts(params, init);
}

export function getRandomProducts(
  category: string,
  category_type: CategoryType = "subcategory",
  limit = 8,
  _init?: unknown,
) {
  return demoAsync(
    filterProducts(retailProducts, { category, category_type }).slice(0, limit),
  );
}

export function getRandomParaProducts(
  category: string,
  category_type: CategoryType = "top_category",
  limit = 8,
  _init?: unknown,
) {
  return demoAsync(
    filterProducts(paraProducts, { category, category_type }).slice(0, limit),
  );
}

export function searchProducts(
  q: string,
  limit = 10,
  shop?: string,
  _init?: unknown,
) {
  const results = filterProducts(retailProducts, { search: q })
    .filter(
      (product) =>
        !shop ||
        product.shopPrices?.some(
          (price) => normalize(price.shop) === normalize(shop),
        ),
    )
    .slice(0, limit)
    .map(searchResult);
  return demoAsync(results);
}

export function searchParaProducts(
  q: string,
  limit = 10,
  shop?: string,
  _init?: unknown,
) {
  const results = filterProducts(paraProducts, { search: q })
    .filter(
      (product) =>
        !shop ||
        product.shopPrices?.some(
          (price) => normalize(price.shop) === normalize(shop),
        ),
    )
    .slice(0, limit)
    .map(searchResult);
  return demoAsync(results);
}

export function getProduct(productId: string) {
  const product = retailProducts.find((item) => item.id === productId);
  if (!product)
    return Promise.reject(new Error("Product not found in demo catalog."));
  return demoAsync(product);
}

export function getParaProduct(productId: string) {
  const product = paraProducts.find((item) => item.id === productId);
  if (!product)
    return Promise.reject(
      new Error("Product not found in demo parapharmacy catalog."),
    );
  return demoAsync(product);
}

export function getProductBySku(sku: string) {
  return getProduct(sku.toLowerCase());
}

export function getParaProductBySku(sku: string) {
  return getParaProduct(sku.toLowerCase());
}

export function getProductCategoryAnalytics(category: string) {
  return demoAsync(analyticsFor(retailProducts, category, "subcategory"));
}

export function getParaCategoryAnalytics(category: string) {
  return demoAsync(analyticsFor(paraProducts, category, "top_category"));
}

export function getFakePromos(limit = 10) {
  return demoAsync(
    [...retailProducts, ...paraProducts]
      .slice(0, limit)
      .map(fakePromoFromProduct),
  );
}

export async function getCatalogProduct(
  productId: string,
  preferredSource?: CatalogSource,
): Promise<{ product: CatalogProduct; source: CatalogSource } | null> {
  if (preferredSource === "para") {
    const product = paraProducts.find((item) => item.id === productId);
    return product ? { product, source: "para" } : null;
  }

  if (preferredSource === "retail") {
    const product = retailProducts.find((item) => item.id === productId);
    return product ? { product, source: "retail" } : null;
  }

  const retail = retailProducts.find((item) => item.id === productId);
  if (retail) return { product: retail, source: "retail" };
  const para = paraProducts.find((item) => item.id === productId);
  if (para) return { product: para, source: "para" };
  return null;
}

export async function enrichCatalogProductImages(
  products: CatalogProduct[],
  _signal?: unknown,
): Promise<CatalogProduct[]> {
  return demoAsync(products);
}

export function getAllCatalogProducts() {
  return { retail: retailProducts, para: paraProducts };
}

export function getShopPricesFor(
  shop: string,
  source: CatalogSource,
): Array<{ product: CatalogProduct; price: ShopPrice }> {
  const items = source === "para" ? paraProducts : retailProducts;
  return items.flatMap((product) =>
    (product.shopPrices || [])
      .filter((price) => normalize(price.shop) === normalize(shop))
      .map((price) => ({ product, price })),
  );
}
