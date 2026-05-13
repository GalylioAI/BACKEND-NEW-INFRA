import type { Metadata } from "next"
import React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardGuard } from "@/components/dashboard/dashboard-guard"

export const metadata: Metadata = {
    title: "Tableau de Bord",
    description: "Votre tableau de bord 1111.tn — Suivez vos prix, benchmarking et veille tarifaire.",
    robots: { index: false, follow: false },
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardGuard>
            <div className="dashboard-shell">
                <DashboardSidebar />
                <div className="dashboard-content">
                    {children}
                </div>
            </div>
        </DashboardGuard>
    )
}
