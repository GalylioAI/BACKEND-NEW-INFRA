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
import { getCurrentUser, signinUser, signupUser } from "../api/auth";
import { is2FAPending } from "../api/types";
import type { AuthToken2FAPending, UserCreate, UserLogin, UserResponse } from "../api/types";

const TOKEN_KEY = "1111.auth.token";
const ROLE_KEY = "1111.auth.role";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  loading: boolean;
  token: string | null;
  user: UserResponse | null;
  login: (payload: UserLogin) => Promise<UserResponse | AuthToken2FAPending>;
  signup: (payload: UserCreate) => Promise<{ user_id: string; email: string }>;
  logout: () => void;
  refreshUser: () => Promise<UserResponse | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistToken(token: { access_token: string; role: string }) {
  window.localStorage.setItem(TOKEN_KEY, token.access_token);
  window.localStorage.setItem(ROLE_KEY, token.role);
}

function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const loading = status === "loading";

  const applyToken = useCallback(async (nextToken: string) => {
    setStatus("loading");
    setToken(nextToken);

    try {
      const currentUser = await getCurrentUser(nextToken);
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch (error) {
      clearToken();
      setToken(null);
      setUser(null);
      setStatus("anonymous");
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setStatus("anonymous");
      return;
    }

    applyToken(storedToken).catch(() => {
      setStatus("anonymous");
    });
  }, [applyToken]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY) return;
      if (event.newValue) {
        applyToken(event.newValue).catch(() => undefined);
      } else {
        setToken(null);
        setUser(null);
        setStatus("anonymous");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applyToken]);

  const login = useCallback(
    async (payload: UserLogin) => {
      const result = await signinUser(payload);
      // 2FA required — return the pending session to the caller to handle
      if (is2FAPending(result)) return result;
      persistToken(result);
      return applyToken(result.access_token);
    },
    [applyToken],
  );

  const signup = useCallback(async (payload: UserCreate) => signupUser(payload), []);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const currentUser = await getCurrentUser(token);
    setUser(currentUser);
    setStatus("authenticated");
    return currentUser;
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, loading, token, user, login, signup, logout, refreshUser }),
    [status, loading, token, user, login, signup, logout, refreshUser],
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
