"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface DashboardGuardProps {
  children: React.ReactNode;
}

const superadminOnlyRoutes = [
  "/dashboard/accessibility-control",
  "/dashboard/blogs",
  "/dashboard/users",
];

export function DashboardGuard({ children }: DashboardGuardProps) {
  const { user, loading, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isSuperadminOnlyRoute = superadminOnlyRoutes.some((route) =>
    pathname.startsWith(route),
  );

  useEffect(() => {
    if (loading) return;
    if (status === "anonymous") {
      router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!user) return;
    if (user.role === "user") {
      router.replace("/products");
      return;
    }
    if (isSuperadminOnlyRoute && user.role !== "superadmin") {
      router.replace("/dashboard");
    }
  }, [isSuperadminOnlyRoute, loading, pathname, router, status, user]);

  if (loading || status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role === "user") return null;
  if (isSuperadminOnlyRoute && user.role !== "superadmin") return null;

  return <>{children}</>;
}
