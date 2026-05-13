import {
  productUrls,
  renderUrlSet,
  sitemapResponse,
} from "../lib/sitemap-utils";

export const revalidate = 86400;

export async function GET() {
  return sitemapResponse(renderUrlSet(await productUrls("para")));
}
