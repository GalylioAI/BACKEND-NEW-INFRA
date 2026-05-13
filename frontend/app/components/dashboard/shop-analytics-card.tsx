import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, ShoppingCart, Percent } from "lucide-react"

interface ShopAnalyticsCardProps {
    shopName: string
    productCount: number
    availableCount: number
    averagePrice: number
    discountCount: number
    totalDiscountValue: number
    averageDiscountPercent: number
    cheapestProductCount: number
}

export function ShopAnalyticsCard({
    shopName,
    productCount,
    availableCount,
    averagePrice,
    discountCount,
    totalDiscountValue,
    averageDiscountPercent,
    cheapestProductCount
}: ShopAnalyticsCardProps) {
    const availabilityPercent = productCount > 0 ? ((availableCount / productCount) * 100).toFixed(1) : 0
    const discountPercent = productCount > 0 ? ((discountCount / productCount) * 100).toFixed(1) : 0

    return (
        <Card className="border-border bg-card">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-semibold capitalize">{shopName}</span>
                    {cheapestProductCount > 0 && (
                        <span className="flex items-center gap-1 text-sm font-medium text-stock">
                            <TrendingDown className="size-4" />
                            {cheapestProductCount} meilleurs prix
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Product Count */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="size-4" />
                        <span className="text-sm">Total produits</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{productCount}</span>
                </div>

                {/* Availability */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Disponibilité</span>
                        <span className="text-sm font-medium text-foreground">
                            {availableCount} / {productCount} ({availabilityPercent}%)
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple to-stock transition-all"
                            style={{ width: `${availabilityPercent}%` }}
                        />
                    </div>
                </div>

                {/* Average Price */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ShoppingCart className="size-4" />
                        <span className="text-sm">Prix moyen</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{averagePrice.toFixed(2)} DT</span>
                </div>

                {/* Discount Info */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Percent className="size-4" />
                            <span className="text-sm">Remises</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                            {discountCount} produits ({discountPercent}%)
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Total économies</span>
                        <span className="font-medium text-stock">{totalDiscountValue.toFixed(2)} DT</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Remise moyenne</span>
                        <span className="font-medium text-purple">{averageDiscountPercent.toFixed(2)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
