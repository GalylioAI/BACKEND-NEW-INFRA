"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Eye, EyeOff, Filter, LayoutGrid, Loader2, Plus, Search, Shield, Trash2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/header"
import { PageAccessCard } from "@/components/dashboard/page-access-card"
import { UserSelector } from "@/components/dashboard/user-selector"
import { useAuth } from "@/contexts/AuthContext"
import { deleteAccessRule, getAccessRules, upsertAccessRule } from "@/lib/api/admin"
import { normalizeAccessRulePath } from "@/lib/access-rules"
import type { AccessRule } from "@/lib/api/types"

type PageDefinition = {
  name: string
  path: string
  category: "Main" | "Dashboard" | "Auth" | "Products"
  visible: boolean
  role: "client" | "admin" | "superadmin" | "both"
}

const pages: PageDefinition[] = [
  { name: "Home", path: "/", category: "Main", visible: true, role: "both" },
  { name: "Solutions", path: "/solutions", category: "Main", visible: true, role: "both" },
  { name: "Products", path: "/products", category: "Main", visible: true, role: "both" },
  { name: "Para Products", path: "/para", category: "Main", visible: true, role: "both" },
  { name: "Pricing", path: "/pricing", category: "Main", visible: true, role: "both" },
  { name: "Account", path: "/compte", category: "Main", visible: true, role: "client" },
  { name: "Coming Soon", path: "/coming-soon", category: "Main", visible: false, role: "both" },
  { name: "Dashboard Overview", path: "/dashboard", category: "Dashboard", visible: true, role: "both" },
  { name: "Product Monitoring", path: "/dashboard/veille", category: "Dashboard", visible: true, role: "both" },
  { name: "Advanced Benchmarking", path: "/dashboard/benchmarking", category: "Dashboard", visible: true, role: "admin" },
  { name: "Data Market", path: "/dashboard/data-market", category: "Dashboard", visible: true, role: "admin" },
  { name: "Accessibility Control", path: "/dashboard/accessibility-control", category: "Dashboard", visible: true, role: "superadmin" },
  { name: "Blogs CMS", path: "/dashboard/blogs", category: "Dashboard", visible: true, role: "superadmin" },
  { name: "Settings", path: "/dashboard/parametre", category: "Dashboard", visible: true, role: "both" },
  { name: "Blogs", path: "/blogs", category: "Main", visible: true, role: "both" },
  { name: "Sign In", path: "/connexion", category: "Auth", visible: true, role: "both" },
  { name: "Sign Up", path: "/inscription", category: "Auth", visible: true, role: "both" },
  { name: "Forgot Password", path: "/forgot-password", category: "Auth", visible: true, role: "both" },
  { name: "Reset Password", path: "/reset-password", category: "Auth", visible: true, role: "both" },
  { name: "Verify Email", path: "/verify", category: "Auth", visible: true, role: "both" },
  { name: "Product Details", path: "/products/[id]", category: "Products", visible: true, role: "both" },
  { name: "Para Product Details", path: "/para/[id]", category: "Products", visible: true, role: "both" },
]

const categoryOrder = ["all", "Main", "Dashboard", "Auth", "Products", "Custom"] as const

const categoryDescriptions: Record<string, string> = {
  all: "View every route and switch between sections without losing context.",
  Main: "Control the public entry points and landing pages.",
  Dashboard: "Manage admin and operational dashboard routes.",
  Auth: "Keep authentication pages clear and role-safe.",
  Products: "Tune product detail screens and catalog routes.",
  Custom: "Any new URL you add for targeted access or exceptions.",
}

function getInitialRole(rule?: AccessRule) {
  const roles = rule?.allowed_roles || []
  if (roles.length === 0) return "both"
  if (roles.length === 1) return roles[0]
  if (roles.includes("client") && roles.includes("admin") && roles.length === 2) return "both"
  return "both"
}

export default function AccessibilityControlPage() {
  const { token } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [rules, setRules] = useState<AccessRule[]>([])
  const [loadingRules, setLoadingRules] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [customPath, setCustomPath] = useState("")
  const [customLabel, setCustomLabel] = useState("")
  const [customCategory, setCustomCategory] = useState<AccessRule["category"]>("Custom")
  const [customVisible, setCustomVisible] = useState(true)
  const [customRole, setCustomRole] = useState<"client" | "admin" | "superadmin" | "both">("both")
  const [customAllowedUsers, setCustomAllowedUsers] = useState<string[]>([])

  useEffect(() => {
    if (!token) {
      setLoadingRules(false)
      return
    }

    let active = true
    setLoadingRules(true)
    setLoadError(null)

    getAccessRules(token)
      .then((items) => {
        if (!active) return
        setRules(items)
      })
      .catch((error) => {
        if (!active) return
        setLoadError(error instanceof Error ? error.message : "Unable to load access rules")
      })
      .finally(() => {
        if (!active) return
        setLoadingRules(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const ruleByPath = useMemo(() => new Map(rules.map((rule) => [rule.path, rule])), [rules])

  const mergedPages = useMemo(() => {
    return pages.map((page) => {
      const savedRule = ruleByPath.get(page.path)
      return {
        ...page,
        visible: savedRule?.visible ?? page.visible,
        role: getInitialRole(savedRule) as PageDefinition["role"],
        selectedUsers: savedRule?.allowed_emails || [],
      }
    })
  }, [ruleByPath])

  const customRules = useMemo(() => {
    return rules.filter((rule) => !pages.some((page) => page.path === rule.path))
  }, [rules])

  const filteredPages = mergedPages.filter((page) => {
    const search = searchQuery.toLowerCase()
    const matchesSearch = page.name.toLowerCase().includes(search) || page.path.toLowerCase().includes(search)
    const matchesCategory = selectedCategory === "all" || page.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredCustomRules = customRules.filter((rule) => {
    const search = searchQuery.toLowerCase()
    const matchesSearch = rule.label.toLowerCase().includes(search) || rule.path.toLowerCase().includes(search)
    const matchesCategory = selectedCategory === "all" || rule.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const visibleCount = mergedPages.filter((page) => page.visible).length + customRules.filter((rule) => rule.visible).length
  const restrictedCount = pages.filter((page) => page.role !== "both").length
  const dashboardCount = pages.filter((page) => page.category === "Dashboard").length

  const sections = categoryOrder
    .filter((category) => category !== "all" && category !== "Custom")
    .map((category) => ({
      category,
      pages: filteredPages.filter((page) => page.category === category),
    }))
    .filter((section) => selectedCategory === "all" || selectedCategory === section.category)

  const handleCreateCustomRule = async () => {
    if (!token || !customPath.trim() || !customLabel.trim()) return

    setSaving(true)
    setLoadError(null)

    try {
      const normalizedPath = normalizeAccessRulePath(customPath)
      const savedRule = await upsertAccessRule(token, {
        path: normalizedPath,
        label: customLabel.trim(),
        category: customCategory,
        visible: customVisible,
        allowed_roles: customRole === "both" ? ["client", "admin"] : [customRole],
        allowed_emails: customAllowedUsers,
      })

      setRules((currentRules) => {
        const withoutPrevious = currentRules.filter((rule) => rule.path !== savedRule.path)
        return [...withoutPrevious, savedRule]
      })

      setCustomPath("")
      setCustomLabel("")
      setCustomCategory("Custom")
      setCustomVisible(true)
      setCustomRole("both")
      setCustomAllowedUsers([])
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to create access rule")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCustomRule = async (path: string) => {
    if (!token) return

    setSaving(true)
    setLoadError(null)

    try {
      await deleteAccessRule(token, path)
      setRules((currentRules) => currentRules.filter((rule) => rule.path !== path))
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to delete access rule")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen space-y-6 pb-8">
      <DashboardHeader title="Accessibility Control" />

      <main className="dashboard-main space-y-6">
        <section className="dashboard-card overflow-hidden">
          <div className="dashboard-card-body space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple/20 bg-purple/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-purple">
                  <LayoutGrid className="size-3.5" />
                  Superadmin access map
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground md:text-3xl">Page Access Management</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Control visibility, roles, and user-specific access from one clear overview. Save each route to persist it in MongoDB, or add a brand new URL below.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[430px]">
                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Managed</span>
                    <Shield className="size-4 text-purple" />
                  </div>
                  <strong className="mt-3 block text-2xl font-black text-foreground">{pages.length + customRules.length}</strong>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Total routes under access control.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visible</span>
                    <Eye className="size-4 text-emerald-500" />
                  </div>
                  <strong className="mt-3 block text-2xl font-black text-foreground">{visibleCount}</strong>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Pages currently available to users.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Restricted</span>
                    <EyeOff className="size-4 text-red-500" />
                  </div>
                  <strong className="mt-3 block text-2xl font-black text-foreground">{restrictedCount}</strong>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Routes using role-based access.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-blue-500" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-500">How it works</h4>
                    <p className="mt-1 text-sm leading-6 text-blue-500/80">
                      Edit a page, choose a role, attach user emails, then save. If you need a brand new URL, use the form below and it will be created in the same collection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                  <Filter className="size-4 text-purple" />
                  Current focus
                </div>
                <div className="mt-3 text-sm font-bold text-foreground">{selectedCategory === "all" ? "All categories" : selectedCategory}</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{categoryDescriptions[selectedCategory]}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Add custom URL</h3>
              <p className="dashboard-card-subtitle">Create a new route rule without leaving the page.</p>
            </div>
          </div>

          <div className="dashboard-card-body space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={customPath}
                    onChange={(event) => setCustomPath(event.target.value)}
                    placeholder="/dashboard/reports"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple/20"
                  />
                  <input
                    type="text"
                    value={customLabel}
                    onChange={(event) => setCustomLabel(event.target.value)}
                    placeholder="Reports"
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple/20"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <select
                    value={customCategory}
                    onChange={(event) => setCustomCategory(event.target.value as AccessRule["category"])}
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                  >
                    <option value="Custom">Custom</option>
                    <option value="Main">Main</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="Auth">Auth</option>
                    <option value="Products">Products</option>
                  </select>

                  <select
                    value={customRole}
                    onChange={(event) => setCustomRole(event.target.value as typeof customRole)}
                    className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple/20"
                  >
                    <option value="both">Client + Admin</option>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>

                  <label className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm text-muted-foreground shadow-sm">
                    <input type="checkbox" checked={customVisible} onChange={(event) => setCustomVisible(event.target.checked)} />
                    Visible
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <UserSelector selectedUsers={customAllowedUsers} onUsersChange={setCustomAllowedUsers} />
              </div>
            </div>

            <button
              onClick={handleCreateCustomRule}
              disabled={saving || !customPath.trim() || !customLabel.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-purple px-4 py-2.5 text-sm font-semibold text-purple-foreground transition-all hover:bg-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add URL access
            </button>

            {loadError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">{loadError}</div>
            )}
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">Filters</h3>
              <p className="dashboard-card-subtitle">Search by page name or route, then narrow the control surface by section.</p>
            </div>
          </div>

          <div className="dashboard-card-body space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search pages or routes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple/20"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categoryOrder.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${selectedCategory === category
                      ? "border-purple bg-purple/10 text-purple shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-purple/50 hover:text-foreground"
                      }`}
                  >
                    {category === "all" ? "All" : category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-3 py-1">{filteredPages.length} pages shown</span>
              <span className="rounded-full border border-border bg-background px-3 py-1">{dashboardCount} dashboard pages</span>
              <span className="rounded-full border border-border bg-background px-3 py-1">Live updates apply instantly after save</span>
            </div>
          </div>
        </section>

        {loadingRules ? (
          <section className="dashboard-card">
            <div className="flex items-center justify-center px-6 py-14 text-muted-foreground">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading access rules...
            </div>
          </section>
        ) : filteredPages.length === 0 && filteredCustomRules.length === 0 ? (
          <section className="dashboard-card">
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <Search className="mb-3 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-bold text-foreground">No pages found</h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Try another search term or switch category to reveal the pages you want to manage.
              </p>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.category} className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h3 className="dashboard-card-title">{section.category}</h3>
                    <p className="dashboard-card-subtitle">{categoryDescriptions[section.category]}</p>
                  </div>
                  <span className="dashboard-badge">{section.pages.length} pages</span>
                </div>
                <div className="dashboard-card-body">
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                    {section.pages.map((page) => (
                      <PageAccessCard
                        key={page.path}
                        pageName={page.name}
                        pagePath={page.path}
                        category={page.category}
                        initialVisible={page.visible}
                        initialRole={page.role}
                        initialSelectedUsers={ruleByPath.get(page.path)?.allowed_emails || []}
                      />
                    ))}
                  </div>
                </div>
              </section>
            ))}

            {filteredCustomRules.length > 0 && (
              <section className="dashboard-card">
                <div className="dashboard-card-header">
                  <div>
                    <h3 className="dashboard-card-title">Custom URLs</h3>
                    <p className="dashboard-card-subtitle">Rules that do not belong to the default page catalog.</p>
                  </div>
                  <span className="dashboard-badge">{filteredCustomRules.length} rules</span>
                </div>
                <div className="dashboard-card-body">
                  <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                    {filteredCustomRules.map((rule) => (
                      <div key={rule.path} className="space-y-3">
                        <PageAccessCard
                          pageName={rule.label}
                          pagePath={rule.path}
                          category={(rule.category || "Custom") as "Main" | "Dashboard" | "Auth" | "Products" | "Custom"}
                          initialVisible={rule.visible}
                          initialRole={getInitialRole(rule) as "client" | "admin" | "superadmin" | "both"}
                          initialSelectedUsers={rule.allowed_emails || []}
                        />
                        <button
                          onClick={() => handleDeleteCustomRule(rule.path)}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-red-500/40 hover:text-red-500"
                          title="Delete rule"
                        >
                          <Trash2 className="size-4" />
                          Delete custom rule
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
