import { apiFetch } from "./client";
import type { AccessRule, AccessRulePayload, DashboardRole, UserResponse } from "./types";

export function getAdminUsers(token: string, page = 1, per_page = 20) {
  return apiFetch<UserResponse[]>("/users", {
    token,
    cache: "no-store",
    query: { page, per_page },
  });
}

export function getAdminUser(token: string, userId: string) {
  return apiFetch<UserResponse>(`/users/${userId}`, {
    token,
    cache: "no-store",
  });
}

export function updateAdminUserRole(token: string, userId: string, role: DashboardRole) {
  return apiFetch<UserResponse>(`/users/${userId}/role`, {
    method: "PUT",
    token,
    body: { role },
  });
}

export function banUser(token: string, userId: string, is_banned: boolean, reason?: string) {
  return apiFetch<UserResponse>(`/users/${userId}/ban`, {
    method: "PUT",
    token,
    body: { is_banned, reason },
  });
}

export function deleteUser(token: string, userId: string) {
  return apiFetch<{ message?: string }>(`/users/${userId}`, {
    method: "DELETE",
    token,
  });
}

// Access rules are not implemented in the new backend — return empty so all routes pass through
export function getAccessRules(_token: string): Promise<AccessRule[]> {
  return Promise.resolve([]);
}

export function getPublicAccessRules(): Promise<AccessRule[]> {
  return Promise.resolve([]);
}

export function upsertAccessRule(_token: string, _payload: AccessRulePayload): Promise<AccessRule> {
  return Promise.reject(new Error("Access rules not supported in this backend"));
}

export function deleteAccessRule(_token: string, _path: string): Promise<{ message?: string }> {
  return Promise.reject(new Error("Access rules not supported in this backend"));
}
