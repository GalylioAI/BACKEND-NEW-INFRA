"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../lib/auth/AuthProvider";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "anonymous") return;

    const query = window.location.search;
    const currentUrl = `${pathname}${query}`;
    router.replace(`/connexion?redirect=${encodeURIComponent(currentUrl)}`);
  }, [pathname, router, status]);

  if (status !== "authenticated") {
    return (
      <main
        className="tf-section"
        style={{ minHeight: "55vh", display: "grid", placeItems: "center" }}
      >
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div
            className="spinner-border text-light"
            role="status"
            aria-label="Chargement"
          />
          <p style={{ marginTop: 16, color: "rgba(255,255,255,0.72)" }}>
            Verification de la session...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
