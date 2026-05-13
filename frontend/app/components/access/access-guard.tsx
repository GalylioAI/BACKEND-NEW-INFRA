"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getPublicAccessRules } from "@/lib/api/admin"
import { canUserAccessRule, findActiveAccessRule } from "@/lib/access-rules"
import type { AccessRule } from "@/lib/api/types"

const AUTH_ROUTE_PREFIXES = ["/connexion", "/inscription"]
const CLIENT_HOME_PATH = "/products"

export function AppAccessGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [rules, setRules] = useState<AccessRule[]>([])
  const [rulesLoaded, setRulesLoaded] = useState(false)

  useEffect(() => {
    let active = true
    setRulesLoaded(false)

    getPublicAccessRules()
      .then((items) => {
        if (!active) return
        setRules(items)
      })
      .catch(() => {
        if (!active) return
        setRules([])
      })
      .finally(() => {
        if (!active) return
        setRulesLoaded(true)
      })

    return () => {
      active = false
    }
  }, [pathname])

  const activeRule = useMemo(() => findActiveAccessRule(rules, pathname), [rules, pathname])
  const canAccess = useMemo(() => canUserAccessRule(activeRule, user), [activeRule, user])
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  useEffect(() => {
    if (loading || !rulesLoaded || canAccess) return

    if (!user && !isAuthRoute) {
      router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    if (pathname.startsWith("/dashboard")) {
      router.replace(user?.role === "admin" || user?.role === "superadmin" ? "/dashboard" : CLIENT_HOME_PATH)
      return
    }

    router.replace(CLIENT_HOME_PATH)
  }, [canAccess, isAuthRoute, loading, pathname, router, rulesLoaded, user])

  if (loading || !rulesLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canAccess) return null

  return <>{children}</>
}
