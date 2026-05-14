"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthToken,
  currentUser as fetchCurrentUser,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  logout as logoutRequest,
  session as restoreSession,
} from "../api/auth";
import { setUnauthorizedHandler } from "../api/client";
import { hasSessionMarker } from "../api/token-store";
import { signup as signupRequest } from "../api/users";
import type { LoginRequest, SignupRequest, UserResponse } from "../api/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

export type LoginResult =
  | { status: "authenticated"; user: UserResponse }
  | { status: "2fa_required"; pendingToken: string };

interface AuthContextValue {
  status: AuthStatus;
  loading: boolean;
  user: UserResponse | null;
  login: (payload: LoginRequest) => Promise<LoginResult>;
  loginWithGoogle: (idToken: string) => Promise<LoginResult>;
  signup: (payload: SignupRequest) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserResponse | null>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function shouldAttemptSessionRestore() {
  if (hasSessionMarker()) return true;
  if (typeof window === "undefined") return false;

  const protectedPrefixes = ["/compte", "/dashboard", "/admin"];
  return protectedPrefixes.some((prefix) =>
    window.location.pathname.startsWith(prefix),
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserResponse | null>(null);
  const loading = status === "loading";

  const clearSession = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    async function restore() {
      setStatus("loading");
      if (!shouldAttemptSessionRestore()) {
        if (!active) return;
        clearAuthToken();
        setUser(null);
        setStatus("anonymous");
        return;
      }

      try {
        const restored = await restoreSession();
        if (!active) return;
        setUser(restored.user);
        setStatus("authenticated");
      } catch {
        if (!active) return;
        clearSession();
      }
    }

    restore();
    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (payload: LoginRequest) => {
    const loginResult = await loginRequest(payload);
    if (
      loginResult.two_factor_required &&
      loginResult.two_factor_session_token
    ) {
      return {
        status: "2fa_required" as const,
        pendingToken: loginResult.two_factor_session_token,
      };
    }

    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setStatus("authenticated");
    return { status: "authenticated" as const, user: currentUser };
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const loginResult = await googleLoginRequest(idToken);
    if (
      loginResult.two_factor_required &&
      loginResult.two_factor_session_token
    ) {
      return {
        status: "2fa_required" as const,
        pendingToken: loginResult.two_factor_session_token,
      };
    }

    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setStatus("authenticated");
    return { status: "authenticated" as const, user: currentUser };
  }, []);

  const signup = useCallback(
    async (payload: SignupRequest) => signupRequest(payload),
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      loading,
      user,
      login,
      loginWithGoogle,
      signup,
      logout,
      refreshUser,
      clearSession,
    }),
    [
      status,
      loading,
      user,
      login,
      loginWithGoogle,
      signup,
      logout,
      refreshUser,
      clearSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
