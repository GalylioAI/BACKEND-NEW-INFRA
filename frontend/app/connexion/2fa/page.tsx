"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api/client";
import { verifyLogin2FA } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";

const TWO_FACTOR_PENDING_KEY = "1111:2fa-pending";
const PENDING_TTL_MS = 10 * 60 * 1000;

interface PendingLogin {
  token: string;
  email?: string;
  createdAt: number;
}

function readPendingLogin(): PendingLogin | null {
  try {
    const raw = sessionStorage.getItem(TWO_FACTOR_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingLogin;
    if (!parsed.token || Date.now() - parsed.createdAt > PENDING_TTL_MS) {
      sessionStorage.removeItem(TWO_FACTOR_PENDING_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(TWO_FACTOR_PENDING_KEY);
    return null;
  }
}

function safeRedirect(value: string | null) {
  return value && value.startsWith("/") ? value : "/";
}

function getPostLoginDestination(role?: string) {
  if (role === "admin" || role === "superadmin") {
    return "/dashboard";
  }

  return "/compte";
}

export default function TwoFactorLoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [pending, setPending] = useState<PendingLogin | null>(null);
  const [redirectTo, setRedirectTo] = useState("/");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const value = readPendingLogin();
    setRedirectTo(
      safeRedirect(new URLSearchParams(window.location.search).get("redirect")),
    );
    setPending(value);
    if (!value) {
      router.replace("/connexion");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pending) return;
    const normalizedCode = code.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError("Le code doit contenir 6 chiffres.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyLogin2FA(normalizedCode, pending.token);
      sessionStorage.removeItem(TWO_FACTOR_PENDING_KEY);
      const currentUser = await refreshUser();
      router.replace(
        redirectTo === "/"
          ? getPostLoginDestination(currentUser?.role)
          : redirectTo,
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Verification 2FA impossible."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#0a0f0d",
        color: "#fff",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 24,
          padding: 24,
          background: "rgba(255,255,255,0.04)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 900 }}>
          Verification 2FA
        </h1>
        <p style={{ margin: "0 0 22px", color: "rgba(255,255,255,0.58)" }}>
          Entrez le code envoye a {pending?.email || "votre email"}.
        </p>
        {error && (
          <div
            style={{
              border: "1px solid rgba(248,113,113,0.35)",
              borderRadius: 14,
              background: "rgba(248,113,113,0.12)",
              color: "#fecaca",
              padding: "12px 14px",
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          disabled={loading}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            padding: "14px 16px",
            fontSize: 24,
            fontWeight: 800,
            textAlign: "center",
            letterSpacing: 8,
          }}
        />
        <button
          type="submit"
          disabled={loading || !pending}
          style={{
            width: "100%",
            marginTop: 18,
            border: "1px solid rgba(59,222,185,0.35)",
            borderRadius: 14,
            background: "rgba(59,222,185,0.12)",
            color: "#9ff5df",
            padding: "14px 16px",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Verification..." : "Valider le code"}
        </button>
      </form>
    </main>
  );
}
