import { NextRequest, NextResponse } from "next/server";
import { getStoredProductImage, saveProductImage } from "../../lib/product-image-store";

const ALLOWED_DOMAINS = [
  "technopro-online.com",
  "tunisianet.com.tn",
  "spacenet.tn",
  "zoom.com.tn",
  "mytek.tn",
  "electrotounes.tn",
  "bms.tn",
  "darty.tn",
  "wiki.tn",
];

const OG_IMAGE_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["'](https?:\/\/[^"']+)["']/i;
const OG_IMAGE_RE2 = /<meta[^>]+content=["'](https?:\/\/[^"']+)["'][^>]+property=["']og:image["']/i;

function isAllowedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return ALLOWED_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

async function fetchOgImage(shopUrl: string): Promise<string | null> {
  try {
    const res = await fetch(shopUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; 1111bot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(OG_IMAGE_RE) || html.match(OG_IMAGE_RE2);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("id");
  const shopUrl = req.nextUrl.searchParams.get("url");

  if (!shopUrl || !shopUrl.startsWith("http") || !isAllowedDomain(shopUrl)) {
    return NextResponse.json({ image: null }, { status: 400 });
  }

  // Check persistent file store first
  if (productId) {
    const stored = getStoredProductImage(productId);
    if (stored) return NextResponse.json({ image: stored });
  }

  const image = await fetchOgImage(shopUrl);
  if (image && productId) {
    saveProductImage(productId, image);
  }

  return NextResponse.json({ image: image ?? null });
}
