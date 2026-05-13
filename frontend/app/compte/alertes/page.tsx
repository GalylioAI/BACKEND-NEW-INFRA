"use client";

import { useEffect, useState, type CSSProperties } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  alertTypeLabels,
  deleteAlert,
  getApiErrorMessage,
  listAlerts,
  toggleAlert,
  type Alert,
} from "@/lib/api";

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
      setError(getApiErrorMessage(err, "Impossible de charger les alertes."));
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
      setError(getApiErrorMessage(err, "Mise a jour impossible."));
    }
  };

  const remove = async (alert: Alert) => {
    setError("");
    try {
      await deleteAlert(alert.id);
      setItems((current) => current.filter((item) => item.id !== alert.id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Suppression impossible."));
    }
  };

  return (
    <ProtectedRoute>
      <main className="tf-section" style={{ minHeight: "80vh" }}>
        <div className="tf-container">
          <div style={{ maxWidth: 920, margin: "0 auto", color: "#fff" }}>
            <h1 style={{ fontSize: 36, fontWeight: 900 }}>Mes alertes</h1>
            <p style={{ color: "rgba(255,255,255,0.55)" }}>
              Alertes creees pour des produits ayant un UUID backend valide.
            </p>
            {error && <p style={{ color: "#fecaca" }}>{error}</p>}
            {loading ? (
              <p>Chargement...</p>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                {items.map((item) => (
                  <article key={item.id} style={cardStyle}>
                    <div>
                      <strong>{alertTypeLabels[item.type]}</strong>
                      <p style={{ margin: "6px 0", opacity: 0.7 }}>
                        Produit: {item.product_id}
                      </p>
                      <p style={{ margin: 0, opacity: 0.55 }}>
                        {item.threshold
                          ? `Seuil: ${item.threshold}`
                          : "Sans seuil"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => flip(item)} style={buttonStyle}>
                        {item.is_active ? "Desactiver" : "Activer"}
                      </button>
                      <button onClick={() => remove(item)} style={buttonStyle}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
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
