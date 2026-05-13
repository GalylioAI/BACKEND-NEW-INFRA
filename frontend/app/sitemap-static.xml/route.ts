import {
  renderUrlSet,
  sitemapResponse,
  staticPageUrls,
} from "../lib/sitemap-utils";

export const revalidate = 86400;

export function GET() {
  return sitemapResponse(renderUrlSet(staticPageUrls()));
}
