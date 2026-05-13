import {
  blogUrls,
  renderUrlSet,
  sitemapResponse,
} from "../lib/sitemap-utils";

export const revalidate = 86400;

export function GET() {
  return sitemapResponse(renderUrlSet(blogUrls()));
}
