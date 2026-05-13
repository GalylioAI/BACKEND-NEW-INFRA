"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, DatabaseZap, Eye, FileText, Home, Settings, ShieldCheck, Users } from "lucide-react"
import type { ComponentType } from "react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

interface NavItem {
    name: string
    href: string
    icon: ComponentType
    requiredRole?: string
}

const navItems: NavItem[] = [
    { name: "Vue generale", href: "/dashboard", icon: Home },
    { name: "Veille produits", href: "/dashboard/veille", icon: Eye },
    { name: "Benchmarking", href: "/dashboard/benchmarking", icon: BarChart3 },
    { name: "Accessibility Control", href: "/dashboard/accessibility-control", icon: ShieldCheck, requiredRole: "superadmin" },
    { name: "Blogs", href: "/dashboard/blogs", icon: FileText, requiredRole: "superadmin" },
    { name: "Users", href: "/dashboard/users", icon: Users, requiredRole: "superadmin" },
    { name: "Data Market", href: "/dashboard/data-market", icon: DatabaseZap },
    { name: "Parametres", href: "/dashboard/parametre", icon: Settings },
]

export function DashboardSidebar() {
    const pathname = usePathname()
    const { user } = useAuth()
    const userRole = user?.role || "client"

    const visibleNavItems = navItems.filter((item) => {
        if (!item.requiredRole) return true
        if (item.requiredRole === "admin") {
            return userRole === "admin" || userRole === "superadmin"
        }
        return userRole === item.requiredRole
    })

    return (
        <aside className="dashboard-sidebar">
            <Link href="/" className="dashboard-brand">
                <span className="dashboard-brand-mark">11</span>
                <span>
                    <span className="dashboard-brand-title">1111.tn</span>
                    <span className="dashboard-brand-subtitle">Market cockpit</span>
                </span>
            </Link>

            <nav className="dashboard-nav">
                {visibleNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn("dashboard-nav-link", isActive && "is-active")}
                        >
                            <Icon />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="dashboard-sidebar-footer">
                <strong>{user ? user.email : "Mode public"}</strong>
                <span>Acces direct aux indicateurs de prix, veille et benchmarking.</span>
            </div>
        </aside>
    )
}
