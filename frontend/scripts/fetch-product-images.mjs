/**
 * Fetches real og:image URLs for products whose backend image is a shop placeholder.
 * Writes results to data/product-images.json (productId → imageUrl).
 *
 * Run:  node scripts/fetch-product-images.mjs
 *
 * Re-run whenever new products are added to the catalogue.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "data", "product-images.json");
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://back-27em.onrender.com";

const PLACEHOLDER_SIGNALS = [
  "/assets/img/refrigerateur",
  "medicine_theme",
  "no-image",
  "no_image",
  "noimage",
  "placeholder",
  "default-product",
  "default_product",
  "/assets/img/default",
  "/images/default",
];

function isPlaceholder(url) {
  if (!url || !url.startsWith("http")) return true;
  const u = url.toLowerCase();
  return PLACEHOLDER_SIGNALS.some((s) => u.includes(s));
}

const OG_RE1 = /<meta[^>]+property=["']og:image["'][^>]+content=["'](https?:\/\/[^"']+)["']/i;
const OG_RE2 = /<meta[^>]+content=["'](https?:\/\/[^"']+)["'][^>]+property=["']og:image["']/i;

async function fetchOgImage(shopUrl) {
  try {
    const res = await fetch(shopUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; 1111bot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(OG_RE1) || html.match(OG_RE2);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function fetchAllProducts(category, categoryType) {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${API_BASE}/api/v1/products/listing?category=${encodeURIComponent(category)}&category_type=${categoryType}&limit=100&page=${page}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) break;
    const data = await res.json();
    const batch = data.products || [];
    all.push(...batch);
    if (all.length >= (data.total || 0) || batch.length < 100) break;
    page++;
  }
  return all;
}

const APPLIANCE_CATEGORIES = [
  // subcategories
  { cat: "Réfrigérateur", type: "subcategory" },
  { cat: "Refrigerateur", type: "subcategory" },
  { cat: "Mini-Refrigerateur", type: "subcategory" },
  { cat: "Congelateur", type: "subcategory" },
  { cat: "Lave Vaisselle", type: "subcategory" },
  { cat: "Lave-Vaisselle", type: "subcategory" },
  { cat: "Lave-vaisselle", type: "subcategory" },
  { cat: "Lave vaisselle", type: "subcategory" },
  { cat: "Lave-Linge", type: "subcategory" },
  { cat: "Lave-linge Top", type: "subcategory" },
  { cat: "Lave-linge frontal", type: "subcategory" },
  { cat: "Lave-linge séchant", type: "subcategory" },
  { cat: "Machine à laver", type: "subcategory" },
  { cat: "Machine À Laver", type: "subcategory" },
  { cat: "Machine A Laver", type: "subcategory" },
  { cat: "Machine à Laver", type: "subcategory" },
  { cat: "Machine à laver - Sèche linge", type: "subcategory" },
  // top category
  { cat: "Électroménager", type: "top_category" },
];

async function run() {
  // Load existing store
  let store = {};
  if (fs.existsSync(OUTPUT)) {
    try {
      store = JSON.parse(fs.readFileSync(OUTPUT, "utf-8"));
    } catch {
      store = {};
    }
  }

  let totalScanned = 0;
  let totalUpdated = 0;
  const seen = new Set();

  for (const { cat, type } of APPLIANCE_CATEGORIES) {
    console.log(`\nFetching category: ${cat} (${type})`);
    let products;
    try {
      products = await fetchAllProducts(cat, type);
    } catch (e) {
      console.log(`  Error fetching category: ${e.message}`);
      continue;
    }
    console.log(`  ${products.length} products`);

    for (const p of products) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      totalScanned++;

      // Already have a good image
      if (store[p.id] && !isPlaceholder(store[p.id])) continue;
      // Backend has a real image
      if (!isPlaceholder(p.image)) {
        store[p.id] = p.image;
        continue;
      }

      // Need to scrape
      const shopUrls = (p.shopPrices || []).map((s) => s.url).filter(Boolean);
      let found = null;
      for (const shopUrl of shopUrls) {
        console.log(`    Scraping ${p.id} from ${shopUrl.slice(0, 60)}...`);
        found = await fetchOgImage(shopUrl);
        if (found && !isPlaceholder(found)) break;
      }

      if (found && !isPlaceholder(found)) {
        store[p.id] = found;
        totalUpdated++;
        console.log(`    ✓ ${found.slice(0, 60)}`);
      } else {
        console.log(`    ✗ No image found for ${p.name.slice(0, 40)}`);
      }

      // Write incrementally so partial progress is saved
      fs.writeFileSync(OUTPUT, JSON.stringify(store, null, 2), "utf-8");
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(store, null, 2), "utf-8");
  console.log(`\nDone. Scanned ${totalScanned} products, updated ${totalUpdated} images.`);
  console.log(`Store: ${Object.keys(store).length} entries → ${OUTPUT}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
