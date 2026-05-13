"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { getPublicAccessRules } from "@/lib/api/admin"
import { canUserAccessRule, findActiveAccessRule } from "@/lib/access-rules"
import type { AccessRule } from "@/lib/api/types"

interface DashboardGuardProps {
    children: React.ReactNode
}

export function DashboardGuard({ children }: DashboardGuardProps) {
    const { user, loading, token } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [accessRules, setAccessRules] = useState<AccessRule[]>([])
    const [rulesLoaded, setRulesLoaded] = useState(false)
    const isFixedSuperadminRoute = pathname.startsWith("/dashboard/accessibility-control") || pathname.startsWith("/dashboard/users") || pathname.startsWith("/dashboard/blogs")

    const activeRule = useMemo(() => findActiveAccessRule(accessRules, pathname), [accessRules, pathname])

    const isDashboardRoute = pathname.startsWith("/dashboard")

    useEffect(() => {
        if (loading) return

        let active = true
        setRulesLoaded(false)

        getPublicAccessRules()
            .then((rules) => {
                if (!active) return
                setAccessRules(rules)
            })
            .catch(() => {
                if (!active) return
                setAccessRules([])
            })
            .finally(() => {
                if (!active) return
                setRulesLoaded(true)
            })

        return () => {
            active = false
        }
    }, [loading, pathname, token])

    useEffect(() => {
        if (loading || !rulesLoaded) return

        if (!user) return

        if (user.role === "client") {
            router.replace("/products")
            return
        }

        if (user.role === "superadmin") return

        if (isFixedSuperadminRoute) {
            router.replace("/dashboard")
            return
        }

        if (!isDashboardRoute) return

        if (!canUserAccessRule(activeRule, user)) {
            router.replace("/dashboard")
        }
    }, [activeRule, isDashboardRoute, isFixedSuperadminRoute, loading, rulesLoaded, router, user])

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!rulesLoaded) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (user?.role === "client" && isDashboardRoute) {
        return null
    }

    if (user && user.role !== "superadmin" && isDashboardRoute) {
        if (isFixedSuperadminRoute) {
            return null
        }

        if (!canUserAccessRule(activeRule, user)) {
            return null
        }
    }

    if (isFixedSuperadminRoute && user?.role !== "superadmin") {
        return null
    }

    return <>{children}</>
}
