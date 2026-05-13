import { apiRequest } from "./client";
import { endpoints } from "./endpoints";
import type { MessageResponse, SignupRequest, UserResponse } from "./types";
import { normalizeUser } from "./types";

export async function signup(payload: SignupRequest) {
  const user = await apiRequest<UserResponse>(endpoints.users.signup, {
    method: "POST",
    body: payload,
  });
  return normalizeUser(user);
}

export async function updateProfile(payload: {
  full_name?: string;
  username?: string;
  phone?: string | null;
  gouvernorat_id?: number | null;
}) {
  const user = await apiRequest<UserResponse>(endpoints.users.me, {
    method: "PUT",
    auth: true,
    body: payload,
  });
  return normalizeUser(user);
}

export function changePassword(payload: {
  current_password: string;
  new_password: string;
}) {
  return apiRequest<MessageResponse>(endpoints.users.changePassword, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function setPassword(payload: {
  new_password: string;
  new_password_confirm: string;
}) {
  return apiRequest<MessageResponse>(endpoints.users.setPassword, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function deleteOwnAccount() {
  return apiRequest<MessageResponse>(endpoints.users.deleteMe, {
    method: "DELETE",
    auth: true,
  });
}
