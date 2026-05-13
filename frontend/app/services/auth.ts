import { changePassword, getCurrentUser, updateProfile } from "../lib/api/auth";
import type { ChangePasswordPayload, UserProfileUpdate, UserResponse } from "../lib/api/types";

const TOKEN_KEY = "1111.auth.token";

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export const authService = {
  async me(): Promise<{ data: UserResponse }> {
    const token = getStoredToken();

    if (!token) {
      throw new Error("Aucun jeton d'authentification disponible.");
    }

    const data = await getCurrentUser(token);
    return { data };
  },

  async updateProfile(payload: UserProfileUpdate): Promise<{ data: UserResponse }> {
    const token = getStoredToken();

    if (!token) {
      throw new Error("Aucun jeton d'authentification disponible.");
    }

    const data = await updateProfile(token, payload);
    return { data };
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ data: { message?: string } }> {
    const token = getStoredToken();

    if (!token) {
      throw new Error("Aucun jeton d'authentification disponible.");
    }

    const data = await changePassword(token, payload);
    return { data };
  },
};