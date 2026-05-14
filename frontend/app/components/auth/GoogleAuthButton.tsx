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

function GoogleGMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 533.5 544.3" width="22" height="22">
      <path
        fill="#4285f4"
        d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 62.4-54.7 81.6v67h88.3c51.7-47.6 80.8-117.8 80.8-198.1z"
      />
      <path
        fill="#34a853"
        d="M272.1 544.3c73.8 0 135.8-24.4 181.1-66.3l-88.3-67c-24.4 16.4-55.9 26-92.8 26-71.3 0-131.7-48.1-153.3-112.8H27.7v69.1c45.1 89.7 137.9 151 244.4 151z"
      />
      <path
        fill="#fbbc04"
        d="M118.8 324.3c-10.9-32.6-10.9-67.8 0-100.4v-69.1H27.7c-38.4 76.5-38.4 166.9 0 243.4l91.1-73.9z"
      />
      <path
        fill="#ea4335"
        d="M272.1 107.7c39.5-.6 77.6 14.1 106.5 41.2l79.2-79.2C407.6 22.6 341-3.2 272.1.1 165.6.1 72.8 61.4 27.7 151.1l91.1 70.8c21.6-64.7 82-114.2 153.3-114.2z"
      />
    </svg>
  );
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
        .auth-google-button {
          --google-button-size: 52px;
          --google-button-expanded: min(100%, 400px);
        }
        .auth-google-track {
          width: min(100%, 400px);
          max-width: 100%;
          height: var(--google-button-size);
          position: relative;
          overflow: hidden;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          background: ${isLight ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.06)"};
          box-shadow: ${isLight ? "0 14px 30px rgba(91,33,182,0.14)" : "0 14px 30px rgba(0,0,0,0.28)"};
          transition:
            width 0.42s cubic-bezier(.2,.9,.2,1),
            border-radius 0.34s ease,
            box-shadow 0.34s ease,
            transform 0.34s ease;
        }
        .auth-google-track::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.34) 45%, transparent 72%);
          transform: translateX(-120%);
          opacity: 0;
          transition: transform 0.55s ease, opacity 0.25s ease;
        }
        .auth-google-native {
          width: 400px;
          min-width: 400px;
          height: var(--google-button-size);
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .auth-google-native > div {
          width: 400px !important;
          display: flex;
          align-items: center;
        }
        .auth-google-orb {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--google-button-size);
          height: var(--google-button-size);
          border-radius: 999px;
          display: grid;
          place-items: center;
          pointer-events: none;
          background: #ffffff;
          border: 1px solid ${isLight ? "rgba(91,33,182,0.16)" : "rgba(255,255,255,0.16)"};
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.92);
          transform: scale(1);
          opacity: 1;
          transition: opacity 0.2s ease, transform 0.34s cubic-bezier(.2,.9,.2,1);
          z-index: 2;
        }
        .auth-google-orb svg {
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.12));
        }
        .auth-google-button iframe {
          border-radius: 999px !important;
        }
        @media (hover: hover) and (min-width: 560px) {
          .auth-google-track {
            width: var(--google-button-size);
          }
          .auth-google-button:hover .auth-google-track,
          .auth-google-button:focus-within .auth-google-track {
            width: var(--google-button-expanded);
            border-radius: 18px;
            transform: translateY(-1px);
            box-shadow: ${isLight ? "0 18px 38px rgba(91,33,182,0.2)" : "0 18px 38px rgba(0,0,0,0.36)"};
          }
          .auth-google-button:hover .auth-google-track::after,
          .auth-google-button:focus-within .auth-google-track::after {
            opacity: 1;
            transform: translateX(120%);
          }
          .auth-google-button:hover .auth-google-orb,
          .auth-google-button:focus-within .auth-google-orb {
            opacity: 0;
            transform: scale(0.72);
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
        <div className="auth-google-track">
          <div ref={containerRef} className="auth-google-native" />
          <span className="auth-google-orb">
            <GoogleGMark />
          </span>
        </div>
      </div>
    </>
  );
}
