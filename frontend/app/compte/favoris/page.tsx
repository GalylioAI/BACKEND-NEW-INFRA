"use client";

import { useEffect, useState, type CSSProperties } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  deleteAllFavorites,
  deleteFavorite,
  getFrenchApiErrorMessage,
  listFavorites,
  type Favorite,
} from "@/lib/api";
import {
  findStaticProductByBackendId,
  productLink,
  syntheticProductIdNote,
} from "@/lib/product-identity";

export default function FavoritesPage() {
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listFavorites({ per_page: 100 });
      setItems(response.items);
    } catch (err) {
      setError(
        getFrenchApiErrorMessage(err, "Impossible de charger les favoris."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productId: string) => {
    setMessage("");
    setError("");
    try {
      await deleteFavorite(productId);
      setItems((current) =>
        current.filter((item) => item.product_id !== productId),
      );
    } catch (err) {
      setError(getFrenchApiErrorMessage(err, "Suppression impossible."));
    }
  };

  const clear = async () => {
    if (!confirm("Supprimer tous les favoris ?")) return;
    setMessage("");
    setError("");
    try {
      await deleteAllFavorites();
      setItems([]);
      setMessage("Tous les favoris ont ete supprimes.");
    } catch (err) {
      setError(
        getFrenchApiErrorMessage(err, "Suppression globale impossible."),
      );
    }
  };

  return (
    <ProtectedRoute>
      <main className="tf-section" style={{ minHeight: "80vh" }}>
        <div className="tf-container">
          <div style={{ maxWidth: 920, margin: "0 auto", color: "#fff" }}>
            <h1 style={{ fontSize: 36, fontWeight: 900 }}>Mes favoris</h1>
            <p style={{ color: "rgba(255,255,255,0.55)" }}>
              Favoris sauvegardes via le backend. {syntheticProductIdNote}
            </p>
            {error && <p style={{ color: "#fecaca" }}>{error}</p>}
            {message && <p style={{ color: "#9ff5df" }}>{message}</p>}
            <button
              onClick={clear}
              disabled={!items.length}
              style={buttonStyle}
            >
              Tout supprimer
            </button>
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
                          <strong>
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
                              item.product_id
                            )}
                          </strong>
                          <p style={{ margin: "6px 0 0", opacity: 0.6 }}>
                            Ajoute le{" "}
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => remove(item.product_id)}
                        style={buttonStyle}
                      >
                        Supprimer
                      </button>
                    </article>
                  );
                })}
                {!items.length && <p>Aucun favori pour le moment.</p>}
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
