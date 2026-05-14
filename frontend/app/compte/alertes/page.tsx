"use client";

import { useEffect, useState, type CSSProperties } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  alertTypeLabels,
  deleteAlert,
  getFrenchApiErrorMessage,
  listAlerts,
  toggleAlert,
  type Alert,
} from "@/lib/api";
import {
  findStaticProductByBackendId,
  productLink,
  syntheticProductIdNote,
} from "@/lib/product-identity";

export default function AlertsPage() {
  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listAlerts({ per_page: 100 });
      setItems(response.items);
    } catch (err) {
      setError(
        getFrenchApiErrorMessage(err, "Impossible de charger les alertes."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flip = async (alert: Alert) => {
    setError("");
    try {
      const updated = await toggleAlert(alert.id, !alert.is_active);
      setItems((current) =>
        current.map((item) => (item.id === alert.id ? updated : item)),
      );
    } catch (err) {
      setError(getFrenchApiErrorMessage(err, "Mise a jour impossible."));
    }
  };

  const remove = async (alert: Alert) => {
    setError("");
    try {
      await deleteAlert(alert.id);
      setItems((current) => current.filter((item) => item.id !== alert.id));
    } catch (err) {
      setError(getFrenchApiErrorMessage(err, "Suppression impossible."));
    }
  };

  return (
    <ProtectedRoute>
      <main className="tf-section" style={{ minHeight: "80vh" }}>
        <div className="tf-container">
          <div style={{ maxWidth: 920, margin: "0 auto", color: "#fff" }}>
            <h1 style={{ fontSize: 36, fontWeight: 900 }}>Mes alertes</h1>
            <p style={{ color: "rgba(255,255,255,0.55)" }}>
              Alertes prix et stock creees depuis les fiches produit.{" "}
              {syntheticProductIdNote}
            </p>
            {error && (
              <p style={{ color: "#fecaca" }}>
                {error}{" "}
                <button onClick={load} style={inlineButtonStyle}>
                  Reessayer
                </button>
              </p>
            )}
            {loading ? (
              <p>Chargement...</p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                {items.map((item) => {
                  const mapped = findStaticProductByBackendId(item.product_id);
                  return (
                    <article key={item.id} style={cardStyle}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        {mapped?.product.image && (
                          <img
                            src={mapped.product.image}
                            alt=""
                            style={{
                              width: 64,
                              height: 64,
                              borderRadius: 12,
                              objectFit: "contain",
                              background: "rgba(255,255,255,0.08)",
                            }}
                          />
                        )}
                        <div>
                          <strong>{alertTypeLabels[item.type]}</strong>
                          <p style={{ margin: "6px 0", opacity: 0.78 }}>
                            {mapped ? (
                              <a
                                href={productLink(
                                  mapped.product,
                                  mapped.source,
                                )}
                                style={{
                                  color: "#fff",
                                  textDecoration: "none",
                                }}
                              >
                                {mapped.product.name}
                              </a>
                            ) : (
                              `Produit: ${item.product_id}`
                            )}
                          </p>
                          <p style={{ margin: 0, opacity: 0.55 }}>
                            {item.threshold
                              ? `Seuil: ${item.threshold}`
                              : "Sans seuil"}{" "}
                            - {item.is_active ? "active" : "inactive"}
                          </p>
                        </div>
                      </div>
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        <button onClick={() => flip(item)} style={buttonStyle}>
                          {item.is_active ? "Desactiver" : "Activer"}
                        </button>
                        <button
                          onClick={() => remove(item)}
                          style={buttonStyle}
                        >
                          Supprimer
                        </button>
                      </div>
                    </article>
                  );
                })}
                {!items.length && <p>Aucune alerte pour le moment.</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

const cardStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.04)",
} satisfies CSSProperties;

const buttonStyle = {
  border: "1px solid rgba(59,222,185,0.35)",
  borderRadius: 12,
  background: "rgba(59,222,185,0.1)",
  color: "#9ff5df",
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
} satisfies CSSProperties;

const inlineButtonStyle = {
  border: "0",
  background: "transparent",
  color: "#9ff5df",
  fontWeight: 900,
  cursor: "pointer",
} satisfies CSSProperties;
