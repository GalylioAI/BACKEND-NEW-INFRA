"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { BenchmarkingTable } from "@/components/dashboard/benchmarking-table"
import { PerformanceChart, PredictionChart } from "@/components/dashboard/dashboard-charts"
import { FakePromoAlerts } from "@/components/dashboard/fake-promo-alerts"
import { StatCards } from "@/components/dashboard/stat-cards"
import { getMergeStats, getShopDetails } from "@/lib/api/analytics"
import { getFakePromos } from "@/lib/api/products"
import type { DetailedAnalyticsResponse, FakePromoItem, MergeStatsResponse } from "@/lib/api/types"
import {
    buildDashboardShops,
    buildDashboardSummary,
    formatDashboardCurrency,
    formatDashboardNumber,
} from "@/lib/dashboard-analytics"

export function DashboardOverview() {
    const [mergeStats, setMergeStats] = useState<MergeStatsResponse | null>(null)
    const [details, setDetails] = useState<DetailedAnalyticsResponse | null>(null)
    const [fakePromos, setFakePromos] = useState<FakePromoItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadDashboardAnalytics() {
            try {
                const [mergeResponse, detailsResponse, promoResponse] = await Promise.all([
                    getMergeStats(),
                    getShopDetails(),
                    getFakePromos(6).catch(() => [] as FakePromoItem[]),
                ])
                setMergeStats(mergeResponse)
                setDetails(detailsResponse)
                setFakePromos(promoResponse)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Impossible de charger les statistiques.")
            } finally {
                setLoading(false)
            }
        }

        loadDashboardAnalytics()
    }, [])

    if (loading) {
        return (
            <main className="dashboard-main">
                <div className="dashboard-loading">
                    <Loader2 />
                </div>
            </main>
        )
    }

    if (error) {
        return (
            <main className="dashboard-main">
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500">
                    Erreur: {error}
                </div>
            </main>
        )
    }

    const shops = buildDashboardShops(mergeStats, details)
    const summary = buildDashboardSummary(mergeStats, shops)

    return (
        <main className="dashboard-main">
            <section className="dashboard-hero">
                <div className="dashboard-hero-panel">
                    <span className="dashboard-kicker">1111.tn analytics</span>
                    <h2>Pilotez les chiffres retail et parapharmacie depuis un seul cockpit.</h2>
                    <p>
                        Vue instantanee sur {formatDashboardNumber(summary.totalProducts)} references, {formatDashboardNumber(summary.totalShops)} boutiques suivies
                        et un prix moyen observe de {formatDashboardCurrency(summary.weightedAveragePrice)}.
                    </p>
                    <div className="dashboard-hero-strip">
                        <span className="dashboard-hero-chip">{formatDashboardNumber(summary.retailProducts)} produits e-commerce</span>
                        <span className="dashboard-hero-chip">{formatDashboardNumber(summary.paraProducts)} produits parapharmacie</span>
                        <span className="dashboard-hero-chip">{formatDashboardNumber(summary.totalDiscounts)} remises suivies</span>
                    </div>
                </div>

                <aside className="dashboard-focus-panel">
                    <div>
                        <span>Focus du jour</span>
                        <strong>{summary.focusValue}</strong>
                        <p>{summary.focusText}</p>
                    </div>
                    <div className="dashboard-progress">
                        <span style={{ width: `${summary.focusProgress}%` }} />
                    </div>
                </aside>
            </section>

            <StatCards mergeStats={mergeStats} shops={shops} />

            <FakePromoAlerts promos={fakePromos} />

            <section className="dashboard-overview-grid">
                <div className="dashboard-stack">
                    <PerformanceChart shops={shops} />
                    <PredictionChart shops={shops} />
                </div>

                <BenchmarkingTable shops={shops} />
            </section>
        </main>
    )
}
