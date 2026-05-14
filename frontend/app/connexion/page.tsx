"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleAuthButton } from "../components/auth/GoogleAuthButton";
import { getApiErrorMessage } from "../lib/api/client";
import { sendPasswordReset } from "../lib/api/otp";
import { useAuth } from "../lib/auth/AuthProvider";

const TWO_FACTOR_PENDING_KEY = "1111:2fa-pending";

function useIsLight() {
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsLight(document.documentElement.dataset.theme === "light");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  return isLight;
}

function redirectAfterLogin() {
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  return redirect && redirect.startsWith("/") ? redirect : "/";
}

function getPostLoginDestination(role?: string) {
  if (role === "admin" || role === "superadmin") {
    return "/dashboard";
  }

  return "/compte";
}

export default function ConnexionPage() {
  const router = useRouter();
  const isLight = useIsLight();
  const { login, loginWithGoogle, status, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(getPostLoginDestination(user?.role));
    }
  }, [router, status, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Email et mot de passe sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      if (result.status === "2fa_required") {
        sessionStorage.setItem(
          TWO_FACTOR_PENDING_KEY,
          JSON.stringify({
            token: result.pendingToken,
            email: email.trim(),
            createdAt: Date.now(),
          }),
        );
        router.replace(
          `/connexion/2fa?redirect=${encodeURIComponent(redirectAfterLogin())}`,
        );
        return;
      }

      router.replace(getPostLoginDestination(result.user.role));
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Connexion impossible. Verifiez vos identifiants.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError("");
    setSuccess("");
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(idToken);
      if (result.status === "2fa_required") {
        sessionStorage.setItem(
          TWO_FACTOR_PENDING_KEY,
          JSON.stringify({
            token: result.pendingToken,
            email: "votre compte Google",
            createdAt: Date.now(),
          }),
        );
        router.replace(
          `/connexion/2fa?redirect=${encodeURIComponent(redirectAfterLogin())}`,
        );
        return;
      }

      router.replace(getPostLoginDestination(result.user.role));
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Connexion Google impossible pour le moment."),
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Saisissez votre email avant de demander la reinitialisation.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSuccess(
        "Si cet email existe, un code de reinitialisation vient d'etre envoye.",
      );
      router.push(
        `/mot-de-passe-oublie?email=${encodeURIComponent(email.trim())}`,
      );
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Reinitialisation impossible pour le moment."),
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isLight
          ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f4ff 100%)"
          : "#0a0f0d",
        display: "flex",
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .auth-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          padding: 14px 18px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.25); }
        .auth-input:focus {
          border-color: rgba(59,222,185,0.62);
          background: rgba(59,222,185,0.07);
          box-shadow: 0 0 0 3px rgba(59,222,185,0.14);
        }
        .auth-input:disabled { opacity: 0.55; cursor: not-allowed; }
        .auth-btn {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.38);
          background: rgba(255,255,255,0.04);
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.22s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
          font-family: 'Inter', system-ui, sans-serif;
          letter-spacing: 0.02em;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
          backdrop-filter: blur(6px);
        }
        .auth-btn:hover {
          transform: translateY(-2px) scale(1.01);
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.75);
          box-shadow: 0 12px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.34);
        }
        .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .auth-link {
          color: #3BDEB9;
          text-decoration: none;
          font-weight: 700;
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.2s ease, text-decoration-color 0.2s ease;
        }
        .auth-link:hover { color: #84efce; text-decoration: underline; }
        .show-pass-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .show-pass-btn:hover { color: rgba(255,255,255,0.7); }
        .auth-form-shell{
          width: 100%;
          max-width: 440px;
          border-radius: 26px;
          padding: 28px 24px 22px;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            radial-gradient(120% 140% at 0% 0%, rgba(59,222,185,0.14) 0%, rgba(59,222,185,0.03) 38%, transparent 62%),
            linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          box-shadow: 0 26px 48px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.1);
          backdrop-filter: blur(14px);
          position: relative;
          overflow: hidden;
        }
        .auth-form-shell::after{
          content:"";
          position:absolute;
          left: 18%;
          right: 18%;
          top: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59,222,185,0.85), transparent);
          pointer-events:none;
        }
        .auth-subtle{
          color: rgba(255,255,255,0.45);
          font-size: 14px;
          margin: 0;
          line-height: 1.55;
        }
        .auth-title{
          font-size: 32px;
          font-weight: 900;
          color: #fff;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }
        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .auth-top-logo{
          position: absolute;
          top: 16px;
          left: 18px;
          z-index: 30;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 8px 13px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(8px);
        }
        @media (min-width: 901px) {
          .auth-top-logo {
            display: none !important;
          }
        }
        .auth-panel-logo {
          position: relative;
          z-index: 1;
          display: none;
          align-items: baseline;
          gap: 3px;
          text-decoration: none;
          margin: 0 0 28px;
          width: fit-content;
        }
        @media (min-width: 901px) {
          .auth-panel-logo {
            display: inline-flex;
          }
        }
        .auth-panel-logo:hover .auth-panel-logo-num {
          opacity: 0.92;
        }
        .auth-top-back{
          position: absolute;
          top: 16px;
          right: 18px;
          z-index: 30;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.25);
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(8px);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }
        .auth-top-back:hover{
          transform: translateY(-1px);
          border-color: rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.1);
        }
        .auth-alert {
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.5;
        }
        .auth-google-button,
        .auth-google-fallback {
          width: 100%;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-google-button > div {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .auth-google-fallback {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 18px 0;
          color: rgba(255,255,255,0.32);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: rgba(255,255,255,0.1);
        }
        @media (max-width: 900px) {
          .auth-left-panel { display: none !important; }
          .auth-right-panel {
            width: 100% !important;
            padding: 24px 14px !important;
          }
          .auth-form-shell{
            max-width: 520px;
            margin: 0 auto;
          }
          .auth-title{
            font-size: 28px;
          }
        }
        @media (max-width: 520px){
          .auth-top-logo{
            top: 12px;
            left: 12px;
            padding: 6px 10px;
          }
          .auth-top-back{
            top: 12px;
            right: 12px;
            padding: 7px 11px;
            font-size: 11px;
            gap: 5px;
          }
          .auth-form-shell{
            border-radius: 18px;
            padding: 20px 14px 16px;
          }
          .auth-title{
            font-size: 24px;
          }
          .auth-subtle{
            font-size: 13px;
          }
          .auth-btn{
            padding: 13px;
            font-size: 14px;
          }
          .auth-input{
            border-radius: 12px;
            padding: 12px 14px;
            font-size: 13px;
          }
          .auth-alert{
            border-radius: 12px;
            font-size: 12px;
          }
        }

        /* Light mode */
        [data-theme="light"] .auth-input {
          background: rgba(91,33,182,0.04);
          border-color: rgba(91,33,182,0.18);
          color: #1e1b4b;
        }
        [data-theme="light"] .auth-input::placeholder { color: rgba(30,27,75,0.35); }
        [data-theme="light"] .auth-input:focus {
          border-color: rgba(124,58,237,0.6);
          background: rgba(124,58,237,0.06);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        [data-theme="light"] .auth-btn {
          border-color: rgba(91,33,182,0.35);
          background: rgba(91,33,182,0.05);
          color: #5B21B6;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
        }
        [data-theme="light"] .auth-btn:hover {
          background: rgba(91,33,182,0.1);
          border-color: rgba(91,33,182,0.6);
          box-shadow: 0 8px 18px rgba(91,33,182,0.15), inset 0 1px 0 rgba(255,255,255,0.7);
        }
        [data-theme="light"] .auth-link { color: #7C3AED; }
        [data-theme="light"] .auth-link:hover { color: #5B21B6; }
        [data-theme="light"] .show-pass-btn { color: rgba(30,27,75,0.35); }
        [data-theme="light"] .show-pass-btn:hover { color: rgba(30,27,75,0.7); }
        [data-theme="light"] .auth-form-shell {
          border-color: rgba(91,33,182,0.14);
          background:
            radial-gradient(120% 140% at 0% 0%, rgba(124,58,237,0.1) 0%, rgba(124,58,237,0.03) 38%, transparent 62%),
            linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,243,255,0.95));
          box-shadow: 0 26px 48px rgba(91,33,182,0.14), inset 0 1px 0 rgba(255,255,255,0.9);
        }
        [data-theme="light"] .auth-form-shell::after {
          background: linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent);
        }
        [data-theme="light"] .auth-title { color: #1e1b4b; }
        [data-theme="light"] .auth-subtle { color: rgba(30,27,75,0.55); }
        [data-theme="light"] .auth-top-logo {
          border-color: rgba(91,33,182,0.2);
          background: rgba(255,255,255,0.85);
        }
        [data-theme="light"] .auth-top-back {
          border-color: rgba(91,33,182,0.25);
          background: rgba(255,255,255,0.85);
          color: #5B21B6;
        }
        [data-theme="light"] .auth-top-back:hover {
          border-color: rgba(91,33,182,0.5);
          background: rgba(255,255,255,0.98);
        }
        [data-theme="light"] .auth-form-shell label {
          color: rgba(30,27,75,0.55) !important;
        }
        [data-theme="light"] .auth-google-fallback {
          border-color: rgba(91,33,182,0.18);
          background: rgba(91,33,182,0.04);
          color: rgba(30,27,75,0.45);
        }
        [data-theme="light"] .auth-divider {
          color: rgba(30,27,75,0.35);
        }
        [data-theme="light"] .auth-divider::before,
        [data-theme="light"] .auth-divider::after {
          background: rgba(91,33,182,0.12);
        }
      `}</style>

      <div
        className="glow-orb"
        style={{
          width: 400,
          height: 400,
          background: isLight
            ? "rgba(124,58,237,0.06)"
            : "rgba(59,222,185,0.07)",
          top: -100,
          left: -100,
        }}
      />
      <div
        className="glow-orb"
        style={{
          width: 300,
          height: 300,
          background: isLight
            ? "rgba(91,33,182,0.05)"
            : "rgba(204,255,155,0.05)",
          bottom: -80,
          right: -80,
        }}
      />
      <a href="/" className="auth-top-logo" aria-label="Retour a l'accueil">
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "1.9rem",
            fontWeight: 900,
            letterSpacing: "-2.6px",
            color: isLight ? "#1e1b4b" : "#ffffff",
            lineHeight: 1,
          }}
        >
          1111
        </span>
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "0.88rem",
            fontWeight: 700,
            color: isLight ? "#7C3AED" : "#3BDEB9",
            lineHeight: 1,
            marginTop: "3px",
          }}
        >
          .tn
        </span>
      </a>
      <a href="/" className="auth-top-back" aria-label="Retour">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Retour
      </a>

      <div
        className="auth-left-panel"
        style={{
          width: "45%",
          background: isLight
            ? "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(91,33,182,0.04) 100%)"
            : "linear-gradient(135deg, rgba(59,222,185,0.08) 0%, rgba(204,255,155,0.04) 100%)",
          borderRight: isLight
            ? "1px solid rgba(91,33,182,0.1)"
            : "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: isLight
              ? "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)"
              : "linear-gradient(rgba(59,222,185,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,222,185,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <a href="/" className="auth-panel-logo" aria-label="Retour a l'accueil">
          <span
            className="auth-panel-logo-num"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "2.2rem",
              fontWeight: 900,
              letterSpacing: "-3px",
              color: isLight ? "#1e1b4b" : "#ffffff",
              lineHeight: 1,
            }}
          >
            1111
          </span>
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: isLight ? "#7C3AED" : "#3BDEB9",
              lineHeight: 1,
              marginTop: "4px",
            }}
          >
            .tn
          </span>
        </a>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: isLight
                ? "rgba(124,58,237,0.1)"
                : "rgba(59,222,185,0.1)",
              border: isLight
                ? "1px solid rgba(124,58,237,0.2)"
                : "1px solid rgba(59,222,185,0.2)",
              borderRadius: "999px",
              padding: "6px 14px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isLight ? "#7C3AED" : "#3BDEB9",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: isLight ? "#7C3AED" : "#3BDEB9",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
              }}
            >
              Comparateur #1 en Tunisie
            </span>
          </div>
          <h2
            style={{
              fontSize: "2.4rem",
              fontWeight: 900,
              color: isLight ? "#1e1b4b" : "#fff",
              lineHeight: 1.15,
              margin: "0 0 16px",
            }}
          >
            Comparez les prix,
            <br />
            <span
              style={{
                background: isLight
                  ? "linear-gradient(100deg,#7C3AED,#5B21B6)"
                  : "linear-gradient(100deg,#3BDEB9,#CCFF9B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              economisez vraiment.
            </span>
          </h2>
          <p
            style={{
              color: isLight ? "rgba(30,27,75,0.55)" : "rgba(255,255,255,0.45)",
              fontSize: "14px",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 340,
            }}
          >
            Accedez au catalogue compare en temps reel sur les grandes enseignes
            tunisiennes.
          </p>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: isLight
              ? "rgba(124,58,237,0.04)"
              : "rgba(255,255,255,0.03)",
            border: isLight
              ? "1px solid rgba(124,58,237,0.12)"
              : "1px solid rgba(255,255,255,0.07)",
            borderRadius: "18px",
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              color: isLight ? "rgba(30,27,75,0.55)" : "rgba(255,255,255,0.55)",
              fontSize: "13px",
              lineHeight: 1.6,
              margin: "0 0 12px",
              fontStyle: "italic",
            }}
          >
            Retrouvez votre espace client et continuez votre comparaison sans
            perdre le fil.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: isLight
                  ? "linear-gradient(135deg,#7C3AED,#5B21B6)"
                  : "linear-gradient(135deg,#3BDEB9,#CCFF9B)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              1
            </div>
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: isLight ? "#1e1b4b" : "#fff",
                }}
              >
                1111.tn
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: isLight
                    ? "rgba(30,27,75,0.45)"
                    : "rgba(255,255,255,0.35)",
                }}
              >
                Compte client
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="auth-right-panel"
        style={{
          width: "55%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
        }}
      >
        <div className="auth-form-shell">
          <div style={{ marginBottom: "30px" }}>
            <h1 className="auth-title">Bon retour</h1>
            <p className="auth-subtle">
              Pas encore de compte ?{" "}
              <a href="/inscription" className="auth-link">
                Creer un compte
              </a>
            </p>
          </div>

          {error && (
            <div
              className="auth-alert"
              style={{
                background: "rgba(255,76,76,0.1)",
                border: "1px solid rgba(255,76,76,0.28)",
                color: "#ffb4b4",
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="auth-alert"
              style={{
                background: "rgba(59,222,185,0.1)",
                border: "1px solid rgba(59,222,185,0.25)",
                color: "#9ff5df",
                marginBottom: 16,
              }}
            >
              {success}
            </div>
          )}

          <GoogleAuthButton
            text="signin_with"
            isLight={isLight}
            disabled={loading || googleLoading || status === "loading"}
            onCredential={handleGoogleCredential}
            onError={setError}
          />
          <div className="auth-divider">ou</div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: isLight
                    ? "rgba(30,27,75,0.55)"
                    : "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Adresse email
              </label>
              <input
                type="email"
                className="auth-input"
                placeholder="votre@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: isLight
                      ? "rgba(30,27,75,0.55)"
                      : "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  className="auth-link"
                  style={{ fontSize: "12px" }}
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Envoi..." : "Mot de passe oublie ?"}
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Minimum 8 caracteres"
                  style={{ paddingRight: "46px" }}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="show-pass-btn"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn"
              style={{ marginTop: "8px" }}
              disabled={loading || googleLoading || status === "loading"}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "11px",
              color: isLight ? "rgba(30,27,75,0.3)" : "rgba(255,255,255,0.2)",
              marginTop: "24px",
              lineHeight: 1.6,
            }}
          >
            En vous connectant, vous acceptez les conditions d'utilisation et la
            politique de confidentialite.
          </p>
        </div>
      </div>
    </div>
  );
}
