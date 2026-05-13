import { apiRequest } from "./client";
import { endpoints } from "./endpoints";
import type { Favorite, FavoriteCheck, PaginatedItems } from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidProductId(value: string | null | undefined) {
  return Boolean(value && UUID_RE.test(value));
}

export function listFavorites(query?: { page?: number; per_page?: number }) {
  return apiRequest<PaginatedItems<Favorite>>(endpoints.favorites.collection, {
    method: "GET",
    auth: true,
    query,
  });
}

export function addFavorite(productId: string) {
  return apiRequest<Favorite>(endpoints.favorites.collection, {
    method: "POST",
    auth: true,
    body: { product_id: productId },
  });
}

export function checkFavorite(productId: string) {
  return apiRequest<FavoriteCheck>(endpoints.favorites.item(productId), {
    method: "GET",
    auth: true,
  });
}

export function deleteFavorite(productId: string) {
  return apiRequest<{ message: string }>(endpoints.favorites.item(productId), {
    method: "DELETE",
    auth: true,
  });
}

export function deleteAllFavorites() {
  return apiRequest<{ message: string }>(endpoints.favorites.clear, {
    method: "DELETE",
    auth: true,
    headers: { "X-Confirm": "clear-all-favorites" },
  });
}
