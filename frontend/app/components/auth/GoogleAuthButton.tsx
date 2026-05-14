"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GoogleButtonText = "signin_with" | "signup_with" | "continue_with";

interface GoogleAuthButtonProps {
  text: GoogleButtonText;
  isLight: boolean;
  disabled?: boolean;
  onCredential: (idToken: string) => Promise<void> | void;
  onError: (message: string) => void;
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme: "outline" | "filled_black";
      size: "large";
      type: "standard";
      shape: "pill";
      text: GoogleButtonText;
      logo_alignment: "left";
      width: number;
    },
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("google-identity-services");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Google Identity Services failed to load."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

async function fetchGoogleClientId() {
  const response = await fetch("/api/runtime-config", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Google configuration is unavailable.");
  }

  const config = (await response.json()) as { google_client_id?: string };
  return config.google_client_id?.trim() || "";
}

export function GoogleAuthButton({
  text,
  isLight,
  disabled = false,
  onCredential,
  onError,
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const [clientId, setClientId] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let active = true;

    async function boot() {
      setLoading(true);
      try {
        const id = await fetchGoogleClientId();
        if (!active) return;
        setClientId(id);
        if (!id) {
          setReady(false);
          return;
        }
        await loadGoogleIdentityScript();
        if (!active) return;
        setReady(Boolean(window.google?.accounts?.id));
      } catch {
        if (active) setReady(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    boot();
    return () => {
      active = false;
    };
  }, []);

  const handleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      const credential = response.credential;
      if (!credential) {
        onError("Google n'a pas renvoye de jeton de connexion.");
        return;
      }
      void onCredentialRef.current(credential);
    },
    [onError],
  );

  useEffect(() => {
    const container = containerRef.current;
    const googleId = window.google?.accounts?.id;
    if (!container || !ready || !clientId || !googleId) return;

    container.innerHTML = "";
    googleId.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: "popup",
    });
    googleId.renderButton(container, {
      theme: isLight ? "outline" : "filled_black",
      size: "large",
      type: "standard",
      shape: "pill",
      text,
      logo_alignment: "left",
      width: 400,
    });
  }, [clientId, handleCredential, isLight, ready, text]);

  if (!ready || !clientId) {
    return (
      <button
        type="button"
        className="auth-google-fallback"
        disabled
        title={
          loading
            ? "Chargement de Google..."
            : "Configurez GOOGLE_CLIENT_ID pour activer Google."
        }
      >
        {loading ? "Chargement de Google..." : "Google indisponible"}
      </button>
    );
  }

  return (
    <>
      <style>{`
        .auth-google-button > div {
          width: min(100%, 400px);
          max-width: 100%;
          overflow: hidden;
          border-radius: 14px;
          transition: width 0.24s ease, border-radius 0.24s ease, box-shadow 0.24s ease;
        }
        .auth-google-button iframe {
          border-radius: 14px !important;
        }
        @media (hover: hover) and (min-width: 560px) {
          .auth-google-button > div {
            width: 52px;
            border-radius: 16px;
            box-shadow: 0 10px 24px rgba(0,0,0,0.18);
          }
          .auth-google-button:hover > div,
          .auth-google-button:focus-within > div {
            width: min(100%, 400px);
            border-radius: 14px;
          }
        }
      `}</style>
      <div
        aria-disabled={disabled}
        className="auth-google-button"
        style={{
          pointerEvents: disabled ? "none" : "auto",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <div ref={containerRef} />
      </div>
    </>
  );
}
