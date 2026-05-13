"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  Lock,
  MinusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Trophy,
} from "lucide-react";

import type { DataMarketDetail } from "@/lib/data-market";
import { formatPrice, safeImageUrl } from "@/lib/product-utils";

interface StoreDataDetailProps {
  detail: DataMarketDetail;
}

function paymentStorageKey(slug: string) {
  return `1111.data-market.paid.${slug}`;
}

export function StoreDataDetail({ detail }: StoreDataDetailProps) {
  const { store } = detail;
  const [isPaid, setIsPaid] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const initials = store.shopName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsPaid(
      window.localStorage.getItem(paymentStorageKey(store.slug)) === "paid",
    );
  }, [store.slug]);

  const dataset = useMemo(() => detail.dataset, [detail.dataset]);

  async function handleUnlock() {
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    window.localStorage.setItem(paymentStorageKey(store.slug), "paid");
    setIsPaid(true);
    setProcessing(false);
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${store.slug}-full-data-access.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="dashboard-main">
      <div className="dashboard-detail-back">
        <Link href="/dashboard/data-market">Retour au Data Market</Link>
      </div>

      <section className={`dashboard-store-detail-hero is-${store.accent}`}>
        <div className="dashboard-store-detail-copy">
          <div className="dashboard-store-detail-brand">
            <div className="dashboard-store-detail-logo">
              {store.shopLogo ? (
                <Image
                  src={store.shopLogo}
                  alt={store.shopName}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              ) : (
                <span className="dashboard-store-detail-logoFallback">
                  {initials}
                </span>
              )}
            </div>
            <div>
              <span className="dashboard-store-detail-sector">
                {store.sector}
              </span>
              <h2>{store.shopName} Full Data Access</h2>
              <p>{store.highlight}</p>
            </div>
          </div>

          <div className="dashboard-store-detail-strip">
            <span>
              <Database className="size-4" /> {store.coverage}
            </span>
            <span>
              <Clock3 className="size-4" /> {store.refreshRate}
            </span>
            <span>
              <ShieldCheck className="size-4" /> JSON export included
            </span>
          </div>
        </div>

        <aside className="dashboard-store-pricing-card">
          <span className="dashboard-store-pricing-label">
            Premium B2B license
          </span>
          <strong>{store.priceValue}</strong>
          <p>
            {store.datasets}. Built from live analytics, listing, category and
            product endpoints.
          </p>
          <div className="dashboard-store-pricing-proof">
            <BadgeCheck className="size-4" />
            Verified store intelligence pack
          </div>
        </aside>
      </section>

      <section className="dashboard-store-detail-grid">
        <div className="dashboard-store-detail-main">
          <section className="dashboard-card dashboard-card-body">
            <div className="dashboard-store-section-head">
              <div>
                <h3 className="dashboard-card-title">
                  Store analytics overview
                </h3>
                <p className="dashboard-card-subtitle">
                  All demo metrics currently available for this store.
                </p>
              </div>
            </div>
            <div className="dashboard-store-kpis">
              <div className="dashboard-store-kpi">
                <span>Catalog total</span>
                <strong>{detail.catalogTotal.toLocaleString("fr-FR")}</strong>
              </div>
              <div className="dashboard-store-kpi">
                <span>Compared products</span>
                <strong>{detail.productCount.toLocaleString("fr-FR")}</strong>
              </div>
              <div className="dashboard-store-kpi">
                <span>Available now</span>
                <strong>{detail.availableCount.toLocaleString("fr-FR")}</strong>
              </div>
              <div className="dashboard-store-kpi">
                <span>Average price</span>
                <strong>{formatPrice(detail.averagePrice)}</strong>
              </div>
              <div className="dashboard-store-kpi">
                <span>Cheapest wins</span>
                <strong>
                  {detail.cheapestProductCount.toLocaleString("fr-FR")}
                </strong>
              </div>
              <div className="dashboard-store-kpi">
                <span>Discounted items</span>
                <strong>{detail.discountCount.toLocaleString("fr-FR")}</strong>
              </div>
              <div className="dashboard-store-kpi">
                <span>Total discount value</span>
                <strong>{formatPrice(detail.totalDiscountValue)}</strong>
              </div>
              <div className="dashboard-store-kpi">
                <span>Avg discount %</span>
                <strong>{detail.averageDiscountPercent.toFixed(2)}%</strong>
              </div>
            </div>
          </section>

          {detail.featuredProduct && (
            <section className="dashboard-card dashboard-card-body">
              <div className="dashboard-store-section-head">
                <div>
                  <h3 className="dashboard-card-title">
                    Featured product from the static catalog sample
                  </h3>
                  <p className="dashboard-card-subtitle">
                    This block is built from the per-product detail function for
                    the store source.
                  </p>
                </div>
              </div>
              <div className="dashboard-store-featured">
                <img
                  src={safeImageUrl(detail.featuredProduct.image)}
                  alt={detail.featuredProduct.name}
                />
                <div>
                  <span className="dashboard-badge">
                    {detail.featuredProduct.category}
                  </span>
                  <h4>{detail.featuredProduct.name}</h4>
                  <p>{detail.featuredProduct.description}</p>
                  <div className="dashboard-store-featured-stats">
                    <span>
                      Store price:{" "}
                      {formatPrice(detail.featuredProduct.storePrice)}
                    </span>
                    <span>
                      Best market price:{" "}
                      {formatPrice(detail.featuredProduct.bestPrice)}
                    </span>
                    <span>
                      {detail.featuredProduct.comparedOffers} compared offers
                    </span>
                    <span>
                      {detail.featuredProduct.inStock
                        ? "In stock"
                        : "Out of stock"}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="dashboard-card dashboard-card-body">
            <div className="dashboard-store-section-head">
              <div>
                <h3 className="dashboard-card-title">
                  Preview of the store data
                </h3>
                <p className="dashboard-card-subtitle">
                  Rows built from the static catalog sample, filtered on this
                  store inside `shopPrices`.
                </p>
              </div>
              <span className="dashboard-badge">Sample rows only</span>
            </div>
            <div className="dashboard-store-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Offers</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.previewRows.map((record) => (
                    <tr key={record.productId}>
                      <td>{record.title}</td>
                      <td>{record.brand}</td>
                      <td>{record.category}</td>
                      <td>{formatPrice(record.price)}</td>
                      <td>{record.inStock ? "In stock" : "Out of stock"}</td>
                      <td>{record.comparedOffers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {detail.categoryAnalytics && (
            <section className="dashboard-card dashboard-card-body">
              <div className="dashboard-store-section-head">
                <div>
                  <h3 className="dashboard-card-title">Category analytics</h3>
                  <p className="dashboard-card-subtitle">
                    Live ranking from the category analytics function for{" "}
                    {detail.selectedCategory}.
                  </p>
                </div>
                <span className="dashboard-badge">
                  {detail.categoryAnalytics.cheapest_shop}
                </span>
              </div>
              <div className="dashboard-store-rankingGrid">
                {detail.categoryAnalytics.shop_rankings.map((ranking) => (
                  <div
                    key={ranking.shop}
                    className="dashboard-store-rankingCard"
                  >
                    <div className="dashboard-store-rankingTop">
                      <span>{ranking.shop}</span>
                      <Trophy className="size-4" />
                    </div>
                    <strong>{formatPrice(ranking.avg_price)}</strong>
                    <p>{ranking.product_count} products in category</p>
                    <div className="dashboard-store-rankingMeta">
                      <span>Min {formatPrice(ranking.min_price)}</span>
                      <span>Max {formatPrice(ranking.max_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="dashboard-card dashboard-card-body">
            <div className="dashboard-store-section-head">
              <div>
                <h3 className="dashboard-card-title">
                  Products added for this store
                </h3>
                <p className="dashboard-card-subtitle">
                  Demo rows from the local products_added sample for this store.
                </p>
              </div>
            </div>
            {detail.productsAdded.length > 0 ? (
              <div className="dashboard-store-addedGrid">
                {detail.productsAdded.map((product) => (
                  <article
                    key={product.id}
                    className="dashboard-store-addedCard"
                  >
                    <div className="dashboard-store-addedTop">
                      <img
                        src={safeImageUrl(
                          product.images?.[0] || product.brand_logo || "",
                        )}
                        alt={product.title}
                      />
                      <div>
                        <span className="dashboard-badge">
                          {product.subcategory ||
                            product.low_category ||
                            product.top_category ||
                            "Catalogue"}
                        </span>
                        <h4>{product.title}</h4>
                        <p>
                          {product.overview ||
                            "Product row captured from the products_added collection."}
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-store-addedMeta">
                      <span>SKU: {product.sku || "N/A"}</span>
                      <span>
                        Price:{" "}
                        {product.price != null
                          ? formatPrice(product.price)
                          : "N/A"}
                      </span>
                      <span>Brand: {product.brand || "N/A"}</span>
                      <span>Scraped: {product.scraped_at || "N/A"}</span>
                    </div>

                    <div className="dashboard-store-fields">
                      {Object.entries(product.specifications || {})
                        .slice(0, 6)
                        .map(([key, value]) => (
                          <span
                            key={`${product.id}-${key}`}
                            className="dashboard-store-field"
                          >
                            {key}: {value}
                          </span>
                        ))}
                    </div>

                    {!!product.store_availability?.length && (
                      <div className="dashboard-store-availabilityList">
                        {product.store_availability.slice(0, 4).map((item) => (
                          <div
                            key={`${product.id}-${item.store}`}
                            className="dashboard-store-availabilityItem"
                          >
                            <strong>{item.store}</strong>
                            <span>
                              {item.status ||
                                (item.available ? "Available" : "Unavailable")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : detail.productsAddedError ? (
              <div className="dashboard-store-usecase">
                <CheckCircle2 className="size-5" />
                <span>
                  products_added demo data unavailable:{" "}
                  {detail.productsAddedError}.
                </span>
              </div>
            ) : (
              <div className="dashboard-store-usecase">
                <CheckCircle2 className="size-5" />
                <span>
                  No products_added demo rows are currently available for this
                  store.
                </span>
              </div>
            )}
          </section>

          <section className="dashboard-card dashboard-card-body">
            <div className="dashboard-store-section-head">
              <div>
                <h3 className="dashboard-card-title">
                  JSON structure included
                </h3>
                <p className="dashboard-card-subtitle">
                  Communicate exactly what the buyer receives after payment.
                </p>
              </div>
            </div>
            <div className="dashboard-store-fields">
              {detail.includedFields.map((field) => (
                <span key={field} className="dashboard-store-field">
                  {field}
                </span>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-store-detail-side">
          <section className="dashboard-card dashboard-card-body">
            <div className="dashboard-store-lockup">
              <div className="dashboard-store-lock-icon">
                {isPaid ? (
                  <CheckCircle2 className="size-6" />
                ) : (
                  <Lock className="size-6" />
                )}
              </div>
              <h3>
                {isPaid ? "Download unlocked" : "Download locked until payment"}
              </h3>
              <p>
                {isPaid
                  ? "Your access is active. You can now download the full live JSON package for this store."
                  : "The visitor can inspect all the value and preview rows, but only paid access unlocks the raw JSON export."}
              </p>
            </div>

            {!isPaid ? (
              <div className="dashboard-store-payment">
                <label className="dashboard-store-inputGroup">
                  <span>Company name</span>
                  <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Your company"
                  />
                </label>
                <label className="dashboard-store-inputGroup">
                  <span>Work email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                  />
                </label>
                <button
                  type="button"
                  className="dashboard-store-buyButton"
                  onClick={handleUnlock}
                  disabled={processing || !company || !email}
                >
                  <Sparkles className="size-4" />
                  {processing
                    ? "Processing payment..."
                    : `Pay ${store.priceValue}`}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="dashboard-store-downloadButton"
                onClick={handleDownload}
              >
                <Download className="size-4" />
                Download JSON dataset
              </button>
            )}
          </section>

          <section className="dashboard-card dashboard-card-body">
            <div className="dashboard-store-deliverables">
              <h3 className="dashboard-card-title">
                Search and category signals
              </h3>
              <div className="dashboard-store-deliverable">
                <Search className="size-4" />
                <span>
                  {detail.searchResults.length} search hits returned from the
                  local demo query flow.
                </span>
              </div>
              <div className="dashboard-store-deliverable">
                <Tags className="size-4" />
                <span>
                  {detail.categories.length} categories available for this store
                  source.
                </span>
              </div>
              <div className="dashboard-store-deliverable">
                <Database className="size-4" />
                <span>
                  {detail.randomProducts.length} random products used to enrich
                  the category preview.
                </span>
              </div>
            </div>
          </section>

          <section className="dashboard-card dashboard-card-body">
            <div className="dashboard-store-section-head">
              <div>
                <h3 className="dashboard-card-title">
                  Products removed for this store
                </h3>
                <p className="dashboard-card-subtitle">
                  Demo rows from the local products_removed sample for this
                  store.
                </p>
              </div>
              <span className="dashboard-badge">
                {detail.productsRemoved.length} rows
              </span>
            </div>

            {detail.productsRemoved.length > 0 ? (
              <div className="dashboard-store-removedList">
                {detail.productsRemoved.map((product) => (
                  <article
                    key={product.id}
                    className="dashboard-store-removedItem"
                  >
                    <img
                      src={safeImageUrl(
                        product.images?.[0] || product.brand_logo || "",
                      )}
                      alt={product.title}
                    />
                    <div>
                      <strong>{product.title}</strong>
                      <span>
                        {product.brand || "Unknown brand"} ·{" "}
                        {product.sku || "No SKU"}
                      </span>
                      <span>
                        {product.subcategory ||
                          product.low_category ||
                          product.top_category ||
                          "Catalogue"}
                      </span>
                    </div>
                    <div className="dashboard-store-removedMeta">
                      <span>
                        {product.price != null
                          ? formatPrice(product.price)
                          : "Price N/A"}
                      </span>
                      <span>
                        {product.scraped_at || product.updated_at || "No date"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : detail.productsRemovedError ? (
              <div className="dashboard-store-usecase">
                <MinusCircle className="size-5" />
                <span>
                  products_removed demo data unavailable:{" "}
                  {detail.productsRemovedError}.
                </span>
              </div>
            ) : (
              <div className="dashboard-store-usecase">
                <MinusCircle className="size-5" />
                <span>
                  No products_removed demo rows are currently available for this
                  store.
                </span>
              </div>
            )}
          </section>

          {detail.searchResults.length > 0 && (
            <section className="dashboard-card dashboard-card-body">
              <div className="dashboard-store-deliverables">
                <h3 className="dashboard-card-title">Live search hits</h3>
                {detail.searchResults.slice(0, 4).map((item) => (
                  <div key={item.id} className="dashboard-store-searchHit">
                    <img src={safeImageUrl(item.image)} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.brand} · {formatPrice(item.bestPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
