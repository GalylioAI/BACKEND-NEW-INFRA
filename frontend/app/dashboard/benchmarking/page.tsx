"use client"

import { useEffect, useState } from "react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts"
import { DashboardHeader } from "@/components/dashboard/header"

function useIsLight() {
    const [isLight, setIsLight] = useState(false)
    useEffect(() => {
        const check = () => setIsLight(document.documentElement.dataset.theme === "light")
        check()
        const obs = new MutationObserver(check)
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
        return () => obs.disconnect()
    }, [])
    return isLight
}

const brandsPerSectorData = [
    { name: "Tech", debit: 350, credit: 280 },
    { name: "Magasins", debit: 200, credit: 320 },
    { name: "Para", debit: 280, credit: 220 },
    { name: "Mode", debit: 180, credit: 250 },
]

const pieData = [
    { name: "Tech", value: 35, color: "#7c3aed" },
    { name: "Alimentation", value: 30, color: "#22d3d8" },
    { name: "Para", value: 20, color: "#a78bfa" },
    { name: "Mode", value: 15, color: "#c4b5fd" },
]

const productComparisonData = [
    { name: "TV", value: 3000 },
    { name: "PC", value: 2500 },
    { name: "Electro", value: 4000 },
    { name: "Para", value: 5500 },
    { name: "Smartphone", value: 12500 },
]

const topFamilleData = [
    { nbrMarque: "10.000", secteur: "Tech", famille: "Smartphones", type: "leader" },
    { nbrMarque: "20.000", secteur: "Tech", famille: "Pc portable", type: "moyenne" },
    { nbrMarque: "30.000", secteur: "Tech", famille: "Imprimantes", type: "moyenne" },
    { nbrMarque: "30.000", secteur: "Tech", famille: "Tv", type: "challenger" },
    { nbrMarque: "30.000", secteur: "Tech", famille: "Gaming", type: "leader" },
    { nbrMarque: "25.000", secteur: "Alimentaire", famille: "Huile", type: "challenger" },
    { nbrMarque: "25.000", secteur: "Alimentaire", famille: "Tomates", type: "challenger" },
    { nbrMarque: "25.000", secteur: "Alimentaire", famille: "Tomates", type: "challenger" },
    { nbrMarque: "30.000", secteur: "Tech", famille: "Imprimantes", type: "moyenne" },
    { nbrMarque: "30.000", secteur: "Tech", famille: "Tv", type: "challenger" },
]

function getFamilleStyle(type: string) {
    switch (type) {
        case "leader":
            return "bg-amber-100 text-amber-700"
        case "moyenne":
            return "bg-blue-100 text-blue-700"
        case "challenger":
            return "bg-teal-100 text-teal-700"
        default:
            return "bg-muted text-muted-foreground"
    }
}

export default function BenchmarkingPage() {
    const isLight = useIsLight()
    const gridStroke = isLight ? "#f0f0f0" : "rgba(255,255,255,0.06)"
    const tickFill = isLight ? "#6b7280" : "#7a9080"
    const tooltipStyle = {
        backgroundColor: isLight ? "#ffffff" : "#111815",
        border: `1px solid ${isLight ? "#e5e7eb" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "8px",
        fontSize: "12px",
        color: isLight ? "#14201a" : "#e8f0eb",
    }

    return (
        <div className="min-h-screen">
            <DashboardHeader title="Benchmarking avancé" />
            <main className="dashboard-main space-y-6">
                <section className="dashboard-card overflow-hidden">
                    <div className="dashboard-card-body space-y-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="max-w-3xl space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-purple/20 bg-purple/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-purple">
                                    Benchmark cockpit
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground md:text-3xl">Benchmarking avancé</h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                        Le tableau ci-dessous compare les secteurs, les familles et les signaux de marché dans un bloc séparé, pour éviter que la navigation supérieure ne masque les visualisations.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 xl:w-[430px]">
                                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Secteurs</span>
                                    <strong className="mt-3 block text-2xl font-black text-foreground">4</strong>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Tech, magasins, para et mode.</p>
                                </div>
                                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Signals</span>
                                    <strong className="mt-3 block text-2xl font-black text-foreground">10</strong>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Familles et tendances suivies.</p>
                                </div>
                                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Clarity</span>
                                    <strong className="mt-3 block text-2xl font-black text-foreground">Clear</strong>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Top spacing for charts.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Nombre de brands par secteur */}
                    <div className="rounded-xl bg-card p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-card-foreground">
                                Nombre de brands par secteur
                            </h3>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="size-2.5 rounded-full bg-blue-500" />
                                    <span className="text-muted-foreground">Debit</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="size-2.5 rounded-full bg-teal-400" />
                                    <span className="text-muted-foreground">Credit</span>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={brandsPerSectorData} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: tickFill }}
                                />
                                <YAxis hide />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="debit" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={28} />
                                <Bar dataKey="credit" fill="#22d3d8" radius={[4, 4, 0, 0]} barSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top famille par secteur */}
                    <div className="rounded-xl bg-card p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-card-foreground">
                            Top famille par secteur
                        </h3>
                        <div className="max-h-[280px] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="pb-3 font-medium text-muted-foreground">Nbr marque</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Secteur</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Famille</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topFamilleData.map((row, index) => (
                                        <tr key={index} className="border-b border-border/50">
                                            <td className="py-2.5 text-card-foreground">{row.nbrMarque}</td>
                                            <td className="py-2.5 text-card-foreground">{row.secteur}</td>
                                            <td className="py-2.5">
                                                <span
                                                    className={`rounded-md px-2 py-1 text-xs font-medium ${getFamilleStyle(row.type)}`}
                                                >
                                                    {row.famille}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-amber-400" />
                                <span className="text-muted-foreground">Leader</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-blue-500" />
                                <span className="text-muted-foreground">Moyenne</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="size-2.5 rounded-full bg-teal-400" />
                                <span className="text-muted-foreground">Challenger</span>
                            </div>
                        </div>
                    </div>

                    {/* Répartition des marques par secteur */}
                    <div className="rounded-xl bg-card p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-card-foreground">
                            Répartition des marques par secteur
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={100}
                                    paddingAngle={0}

                                    dataKey="value"
                                    label={({ name, value }: { name?: string; value?: number }) => `${value ?? ""}%\n${name ?? ""}`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => [`${value}%`, "Part"]}
                                    contentStyle={tooltipStyle}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Comparaison par produit */}
                    <div className="rounded-xl bg-card p-6 shadow-sm">
                        <h3 className="mb-4 font-semibold text-card-foreground">
                            Comparaison par produit
                        </h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={productComparisonData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: tickFill }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: tickFill }}
                                    tickFormatter={(value: number) => value.toLocaleString()}
                                />
                                <Tooltip
                                    formatter={(value: any) => [value.toLocaleString(), "Valeur"]}
                                    contentStyle={tooltipStyle}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={45}>
                                    {productComparisonData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                index === productComparisonData.length - 1
                                                    ? "#7c3aed"
                                                    : index === productComparisonData.length - 2
                                                        ? "#fbbf24"
                                                        : "#e5e7eb"
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    )
}
