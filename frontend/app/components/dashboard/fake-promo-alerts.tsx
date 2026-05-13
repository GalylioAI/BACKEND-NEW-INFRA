"use client"

import { AlertTriangle, BadgePercent, ExternalLink, ShieldAlert, TrendingUp } from "lucide-react"

import type { FakePromoItem } from "@/lib/api/types"
import { formatDashboardCurrency, formatDashboardNumber } from "@/lib/dashboard-analytics"

interface FakePromoAlertsProps {
    promos: FakePromoItem[]
}

function promoShopName(value: string) {
    return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
}

function promoBrandLabel(value?: string | null) {
    const brand = value?.trim()
    return brand ? brand.toUpperCase() : "MARQUE INCONNUE"
}

export function FakePromoAlerts({ promos }: FakePromoAlertsProps) {
    if (promos.length === 0) {
        return (
            <section className="dashboard-card dashboard-card-body">
                <div className="dashboard-store-section-head">
                    <div>
                        <h3 className="dashboard-card-title">Alertes faux prix</h3>
                        <p className="dashboard-card-subtitle">Aucune fausse promotion n&apos;a ete remontee par le backend pour le moment.</p>
                    </div>
                </div>
            </section>
        )
    }

    const highestInflation = promos.reduce((best, promo) =>
        promo.old_price_inflated_by_pct > best.old_price_inflated_by_pct ? promo : best, promos[0])
    const avgInflation = promos.reduce((sum, promo) => sum + promo.old_price_inflated_by_pct, 0) / promos.length
    const totalAdvertisedDiscount = promos.reduce((sum, promo) => sum + promo.advertised_discount, 0)

    return (
        <section className="dashboard-card dashboard-card-body dashboard-fakePromoSection">
            <div className="dashboard-store-section-head">
                <div>
                    <h3 className="dashboard-card-title">Alertes faux prix</h3>
                    <p className="dashboard-card-subtitle">Signal automatique issu de `Retails.fake_promos` pour detecter les reductions affichees alors que l&apos;ancien prix a ete gonfle.</p>
                </div>
                <span className="dashboard-badge">{formatDashboardNumber(promos.length)} alertes actives</span>
            </div>

            <div className="dashboard-fakePromoHero">
                <div className="dashboard-fakePromoLead">
                    <div className="dashboard-fakePromoLeadBadge">
                        <AlertTriangle className="size-4" />
                        Alerte critique
                    </div>
                    <h4>{highestInflation.title}</h4>
                    <p>{highestInflation.verdict || "Le prix de reference semble artificiellement augmente avant l annonce de la remise."}</p>
                    <div className="dashboard-fakePromoLeadStats">
                        <span><ShieldAlert className="size-4" /> Inflation: {highestInflation.old_price_inflated_by_pct.toFixed(2)}%</span>
                        <span><BadgePercent className="size-4" /> Remise affichee: {highestInflation.advertised_discount_pct.toFixed(2)}%</span>
                        <span><TrendingUp className="size-4" /> Hausse reelle: {highestInflation.real_increase_pct.toFixed(2)}%</span>
                    </div>
                </div>

                <div className="dashboard-fakePromoSummary">
                    <div className="dashboard-fakePromoMiniStat">
                        <span>Inflation moyenne</span>
                        <strong>{avgInflation.toFixed(2)}%</strong>
                    </div>
                    <div className="dashboard-fakePromoMiniStat">
                        <span>Remises affichees</span>
                        <strong>{formatDashboardCurrency(totalAdvertisedDiscount)}</strong>
                    </div>
                    <div className="dashboard-fakePromoMiniStat">
                        <span>Store le plus signale</span>
                        <strong>{promoShopName(highestInflation.shop)}</strong>
                    </div>
                </div>
            </div>

            <div className="dashboard-fakePromoGrid">
                {promos.map((promo) => (
                    <article key={promo.id} className="dashboard-fakePromoCard">
                        <div className="dashboard-fakePromoTop">
                            <img src={promo.image} alt={promo.title} />
                            <div>
                                <div className="dashboard-fakePromoChipRow">
                                    <span className="dashboard-badge">{promo.category || "Catalogue"}</span>
                                    <span className="dashboard-fakePromoStore">{promoShopName(promo.shop)}</span>
                                </div>
                                <h4>{promo.title}</h4>
                                <p>{promoBrandLabel(promo.brand)}{promo.sku ? ` · SKU ${promo.sku}` : ""}</p>
                            </div>
                        </div>

                        <div className="dashboard-fakePromoMetrics">
                            <span>Ancien prix affiche: {formatDashboardCurrency(promo.new_scrap_old_price)}</span>
                            <span>Nouveau prix: {formatDashboardCurrency(promo.new_scrap_price)}</span>
                            <span>Prix gonfle de: {formatDashboardCurrency(promo.old_price_inflated_by)}</span>
                            <span>Fausse remise: {promo.advertised_discount_pct.toFixed(2)}%</span>
                        </div>

                        <a href={promo.url} target="_blank" rel="noreferrer" className="dashboard-fakePromoLink">
                            Voir la fiche produit
                            <ExternalLink className="size-4" />
                        </a>
                    </article>
                ))}
            </div>
        </section>
    )
}
