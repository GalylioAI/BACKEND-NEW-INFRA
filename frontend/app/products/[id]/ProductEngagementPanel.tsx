"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Heart, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  addFavorite,
  alertTypeLabels,
  checkFavorite,
  createAlert,
  deleteFavorite,
  getApiErrorCode,
  getFrenchApiErrorMessage,
  type AlertType,
} from "../../lib/api";
import { useAuth } from "../../lib/auth/AuthProvider";
import type { CatalogProduct } from "../../lib/demo-data/types";
import {
  productBackendId,
  syntheticProductIdNote,
} from "../../lib/product-identity";

const alertOptions: AlertType[] = [
  "price_drop",
  "price_above",
  "back_in_stock",
  "discount",
];

function needsThreshold(type: AlertType) {
  return type === "price_drop" || type === "price_above";
}

export default function ProductEngagementPanel({
  product,
  tone,
}: {
  product: CatalogProduct;
  tone: "dark" | "light";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const [favorite, setFavorite] = useState(false);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState<"favorite" | "alert" | null>(null);
  const [alertType, setAlertType] = useState<AlertType>("price_drop");
  const [threshold, setThreshold] = useState(String(product.bestPrice || ""));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const backendProductId = useMemo(
    () => productBackendId(product.id),
    [product.id],
  );

  const loginRedirect = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const colors =
    tone === "light"
      ? {
          text: "#1e1b4b",
          muted: "rgba(30,27,75,0.58)",
          border: "rgba(91,33,182,0.14)",
          soft: "rgba(91,33,182,0.05)",
          accent: "#7C3AED",
          accentSoft: "rgba(124,58,237,0.1)",
          error: "#b91c1c",
          success: "#047857",
        }
      : {
          text: "#f0f0f5",
          muted: "rgba(240,240,245,0.58)",
          border: "rgba(255,255,255,0.14)",
          soft: "rgba(255,255,255,0.035)",
          accent: "#3BDEB9",
          accentSoft: "rgba(59,222,185,0.11)",
          error: "#fecaca",
          success: "#9ff5df",
        };

  useEffect(() => {
    let active = true;
    if (status !== "authenticated") {
      setFavorite(false);
      return;
    }

    setChecking(true);
    checkFavorite(backendProductId)
      .then((result) => {
        if (active) setFavorite(Boolean(result.is_favorited));
      })
      .catch(() => {
        if (active) setFavorite(false);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [backendProductId, status]);

  const requireAuth = () => {
    if (status === "authenticated") return true;
    router.push(`/connexion?redirect=${encodeURIComponent(loginRedirect)}`);
    return false;
  };

  const toggleFavorite = async () => {
    if (!requireAuth()) return;
    setBusy("favorite");
    setError("");
    setMessage("");
    try {
      if (favorite) {
        await deleteFavorite(backendProductId);
        setFavorite(false);
        setMessage("Produit retire de vos favoris.");
      } else {
        await addFavorite(backendProductId);
        setFavorite(true);
        setMessage("Produit ajoute a vos favoris.");
      }
    } catch (err) {
      if (getApiErrorCode(err) === "ALREADY_FAVORITED") {
        setFavorite(true);
        setMessage("Produit deja dans vos favoris.");
      } else {
        setError(getFrenchApiErrorMessage(err, "Action favori impossible."));
      }
    } finally {
      setBusy(null);
    }
  };

  const submitAlert = async () => {
    if (!requireAuth()) return;
    const parsedThreshold = Number(threshold);
    if (
      needsThreshold(alertType) &&
      (!Number.isFinite(parsedThreshold) || parsedThreshold <= 0)
    ) {
      setError("Saisissez un seuil de prix valide.");
      return;
    }

    setBusy("alert");
    setError("");
    setMessage("");
    try {
      await createAlert({
        product_id: backendProductId,
        type: alertType,
        threshold: needsThreshold(alertType) ? parsedThreshold : null,
      });
      setMessage("Alerte creee pour ce produit.");
    } catch (err) {
      setError(
        getFrenchApiErrorMessage(err, "Creation de l'alerte impossible."),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={busy === "favorite" || checking || status === "loading"}
          style={{
            minHeight: 42,
            border: `1px solid ${favorite ? colors.accent : colors.border}`,
            borderRadius: 12,
            background: favorite ? colors.accentSoft : colors.soft,
            color: favorite ? colors.accent : colors.text,
            padding: "0 14px",
            fontWeight: 900,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {busy === "favorite" || checking ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Heart size={16} fill={favorite ? "currentColor" : "none"} />
          )}
          {favorite ? "Favori" : "Ajouter aux favoris"}
        </button>

        <a
          href="/compte/favoris"
          style={{
            minHeight: 42,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            color: colors.muted,
            textDecoration: "none",
            padding: "0 14px",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Mes favoris
        </a>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 130px auto",
          gap: 8,
          alignItems: "center",
        }}
        className="product-engagement-alert"
      >
        <select
          value={alertType}
          onChange={(event) => setAlertType(event.target.value as AlertType)}
          disabled={busy === "alert"}
          style={{
            minHeight: 40,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.soft,
            color: colors.text,
            padding: "0 12px",
            fontWeight: 800,
          }}
        >
          {alertOptions.map((option) => (
            <option key={option} value={option}>
              {alertTypeLabels[option]}
            </option>
          ))}
        </select>
        <input
          value={threshold}
          onChange={(event) => setThreshold(event.target.value)}
          disabled={!needsThreshold(alertType) || busy === "alert"}
          inputMode="decimal"
          placeholder="Seuil"
          style={{
            minHeight: 40,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.soft,
            color: colors.text,
            padding: "0 12px",
            fontWeight: 800,
          }}
        />
        <button
          type="button"
          onClick={submitAlert}
          disabled={busy === "alert" || status === "loading"}
          style={{
            minHeight: 40,
            border: `1px solid ${colors.accent}`,
            borderRadius: 12,
            background: colors.accentSoft,
            color: colors.accent,
            padding: "0 13px",
            fontWeight: 900,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          {busy === "alert" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Bell size={15} />
          )}
          Alerte
        </button>
      </div>

      {(message || error) && (
        <p
          style={{
            margin: "10px 0 0",
            color: error ? colors.error : colors.success,
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.45,
          }}
        >
          {error || message}
        </p>
      )}
      <p
        style={{
          margin: "8px 0 0",
          color: colors.muted,
          fontSize: 11,
          lineHeight: 1.45,
        }}
      >
        {syntheticProductIdNote}
      </p>
      <style>{`
        @media (max-width: 680px) {
          .product-engagement-alert {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
