import { DashboardHeader } from "@/components/dashboard/header"
import { ShopDataWidget } from "@/components/dashboard/shop-data-widget"
import { getDataMarketStores } from "@/lib/data-market"

export const dynamic = "force-dynamic"

export default async function DataMarketPage() {
    const stores = await getDataMarketStores()

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Data Market" />

            <main className="p-6">
                <section className="dashboard-data-market-hero">
                    <div className="dashboard-data-market-copy">
                        <span className="dashboard-data-market-kicker">B2B store intelligence</span>
                        <h2>Turn tracked stores into revenue-ready datasets your clients actually want to buy.</h2>
                        <p>
                            Each pack includes structured pricing intelligence, availability monitoring, promo visibility,
                            and category coverage. Position every retailer as a premium data asset, not just a source.
                        </p>
                        <div className="dashboard-data-market-strip">
                            <span>8 premium store packs</span>
                            <span>Retail + parapharmacie coverage</span>
                            <span>Always-on full data access offer</span>
                        </div>
                    </div>

                    <aside className="dashboard-data-market-aside">
                        <span className="dashboard-data-market-aside-label">Best for B2B sales</span>
                        <strong>Full Data Access</strong>
                        <p>
                            Give buyers an immediate sense of exclusivity with logo-led cards, sharp value framing,
                            and clear access messaging on every store.
                        </p>
                    </aside>
                </section>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {stores.map((store) => (
                        <ShopDataWidget key={store.shopName} {...store} />
                    ))}
                </div>
            </main>
        </div>
    )
}
