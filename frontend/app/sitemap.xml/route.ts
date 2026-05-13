import {
  absoluteUrl,
  renderSitemapIndex,
  sitemapResponse,
} from "../lib/sitemap-utils";

export const revalidate = 86400;

export function GET() {
  return sitemapResponse(
    renderSitemapIndex([
      { loc: absoluteUrl("/sitemap-static.xml") },
      { loc: absoluteUrl("/sitemap-blog.xml") },
      { loc: absoluteUrl("/sitemap-categories.xml") },
      { loc: absoluteUrl("/sitemap-products-retail.xml") },
      { loc: absoluteUrl("/sitemap-products-para.xml") },
    ]),
  );
}
