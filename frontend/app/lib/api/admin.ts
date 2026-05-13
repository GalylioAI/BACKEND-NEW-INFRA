import { apiRequest } from "./client";
import { endpoints } from "./endpoints";
import type {
  Alert,
  PaginatedItems,
  PopularFavorite,
  UserResponse,
  UserRole,
} from "./types";
import { normalizeUser } from "./types";

export async function listAdminUsers(query?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  const data = await apiRequest<
    PaginatedItems<UserResponse> | { items: UserResponse[] }
  >(endpoints.users.list, { method: "GET", auth: true, query });
  const items = "items" in data ? data.items : [];
  return {
    ...data,
    items: items.map(normalizeUser),
  };
}

export async function getAdminUser(id: string) {
  const user = await apiRequest<UserResponse>(endpoints.users.detail(id), {
    method: "GET",
    auth: true,
  });
  return normalizeUser(user);
}

export async function updateAdminUserRole(id: string, role: UserRole) {
  const user = await apiRequest<UserResponse>(endpoints.users.role(id), {
    method: "PUT",
    auth: true,
    body: { role },
  });
  return normalizeUser(user);
}

export async function setAdminUserBan(
  id: string,
  isBanned: boolean,
  reason?: string,
) {
  const user = await apiRequest<UserResponse>(endpoints.users.ban(id), {
    method: "PUT",
    auth: true,
    body: { is_banned: isBanned, reason: reason || undefined },
  });
  return normalizeUser(user);
}

export function deleteAdminUser(id: string) {
  return apiRequest<{ message?: string }>(endpoints.users.detail(id), {
    method: "DELETE",
    auth: true,
  });
}

export function listPopularFavorites(limit = 10) {
  return apiRequest<{ items: PopularFavorite[] }>(endpoints.favorites.popular, {
    method: "GET",
    auth: true,
    query: { limit },
  });
}

export function listAdminAlerts(query?: { page?: number; per_page?: number }) {
  return apiRequest<PaginatedItems<Alert>>(endpoints.alerts.admin, {
    method: "GET",
    auth: true,
    query,
  });
}
