import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"

export default function DashboardPage() {
    return (
        <div className="dashboard-page">
            <DashboardHeader title="Vue generale" />
            <DashboardOverview />
        </div>
    )
}
