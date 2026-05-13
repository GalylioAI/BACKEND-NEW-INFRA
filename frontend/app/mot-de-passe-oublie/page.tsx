"use client";

import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  applyPasswordReset,
  sendPasswordReset,
  verifyPasswordReset,
} from "@/lib/api/otp";

type Step = "send" | "verify" | "apply" | "done";

export default function PasswordResetPage() {
  const [step, setStep] = useState<Step>("send");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(new URLSearchParams(window.location.search).get("email") || "");
  }, []);

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await sendPasswordReset(email.trim());
      setMessage("Si cet email existe, un code vient d'etre envoye.");
      setStep("verify");
    } catch (err) {
      setError(getApiErrorMessage(err, "Envoi du code impossible."));
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await verifyPasswordReset(email.trim(), code.trim());
      setResetToken(response.reset_token);
      setStep("apply");
    } catch (err) {
      setError(getApiErrorMessage(err, "Code invalide ou expire."));
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await applyPasswordReset({
        reset_token: resetToken,
        new_password: password,
        new_password_confirm: confirmPassword,
      });
      setStep("done");
      setMessage("Mot de passe mis a jour. Vous pouvez vous connecter.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Mise a jour impossible."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#0a0f0d",
        color: "#fff",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 460,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 24,
          padding: 24,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900 }}>
          Mot de passe oublie
        </h1>
        <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.58)" }}>
          Reinitialisez votre acces avec le code envoye par email.
        </p>

        {error && <p style={{ color: "#fecaca" }}>{error}</p>}
        {message && <p style={{ color: "#9ff5df" }}>{message}</p>}

        {step === "send" && (
          <form onSubmit={submitEmail} style={{ display: "grid", gap: 14 }}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="votre@email.com"
              required
              style={inputStyle}
            />
            <button disabled={loading} style={buttonStyle}>
              {loading ? "Envoi..." : "Envoyer le code"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={submitCode} style={{ display: "grid", gap: 14 }}>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Code a 6 chiffres"
              maxLength={6}
              required
              style={inputStyle}
            />
            <button disabled={loading} style={buttonStyle}>
              {loading ? "Verification..." : "Verifier le code"}
            </button>
          </form>
        )}

        {step === "apply" && (
          <form onSubmit={submitPassword} style={{ display: "grid", gap: 14 }}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nouveau mot de passe"
              required
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmer le mot de passe"
              required
              style={inputStyle}
            />
            <button disabled={loading} style={buttonStyle}>
              {loading ? "Mise a jour..." : "Mettre a jour"}
            </button>
          </form>
        )}

        {step === "done" && (
          <a href="/connexion" style={{ color: "#9ff5df", fontWeight: 800 }}>
            Retour a la connexion
          </a>
        )}
      </section>
    </main>
  );
}

const inputStyle = {
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 14,
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  padding: "14px 16px",
} satisfies CSSProperties;

const buttonStyle = {
  border: "1px solid rgba(59,222,185,0.35)",
  borderRadius: 14,
  background: "rgba(59,222,185,0.12)",
  color: "#9ff5df",
  padding: "14px 16px",
  fontWeight: 800,
  cursor: "pointer",
} satisfies CSSProperties;
