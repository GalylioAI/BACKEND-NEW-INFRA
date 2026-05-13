"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  getApiErrorMessage,
  listGouvernorats,
  sendEmailOtp,
  verifyEmailOtp,
  type Gouvernorat,
} from "../lib/api";
import { useAuth } from "../lib/auth/AuthProvider";

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

export default function InscriptionPage() {
  const router = useRouter();
  const isLight = useIsLight();
  const { signup, login, status } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gouvernoratId, setGouvernoratId] = useState("");
  const [gouvernorats, setGouvernorats] = useState<Gouvernorat[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fullName = useMemo(
    () => `${firstName.trim()} ${lastName.trim()}`.trim(),
    [firstName, lastName],
  );

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/products");
    }
  }, [router, status]);

  useEffect(() => {
    let active = true;
    listGouvernorats()
      .then((items) => {
        if (active) setGouvernorats(items);
      })
      .catch(() => {
        if (active) setGouvernorats([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const validateFirstStep = () => {
    if (!firstName.trim() || !lastName.trim())
      return "Prenom et nom sont obligatoires.";
    if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username.trim()))
      return "Nom d'utilisateur invalide.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Adresse email invalide.";
    if (!/^[0-9 ]{8,14}$/.test(phone.trim()))
      return "Numero de telephone invalide.";
    return "";
  };

  const handleNext = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validateFirstStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const firstStepError = validateFirstStep();
    if (firstStepError) {
      setError(firstStepError);
      setStep(1);
      return;
    }

    if (
      password.length < 8 ||
      password.length > 64 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        "Le mot de passe doit contenir 8 caracteres, une majuscule, un chiffre et un symbole.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!terms) {
      setError("Vous devez accepter les conditions pour creer le compte.");
      return;
    }
    if (!gouvernoratId) {
      setError("Selectionnez votre gouvernorat.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        email: email.trim(),
        username: username.trim(),
        password,
        full_name: fullName,
        phone: `+216${phone.replace(/\s/g, "")}`,
        gouvernorat_id: Number(gouvernoratId),
      });

      await sendEmailOtp(email.trim());
      setStep(3);
      setSuccess("Compte cree. Entrez le code envoye par email.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Creation du compte impossible."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyEmailOtp(email.trim(), verificationCode.trim());
      const result = await login({ email: email.trim(), password });
      if (result.status === "authenticated") {
        router.replace("/products");
      } else {
        router.replace("/connexion");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Verification email impossible."));
    } finally {
      setLoading(false);
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
          box-sizing: border-box;
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
        .auth-btn-outline {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: border-color 0.2s;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .auth-btn-outline:hover { border-color: rgba(59,222,185,0.4); color: #fff; }
        .auth-btn-outline:disabled { opacity: 0.55; cursor: not-allowed; }
        .auth-link {
          color: #3BDEB9;
          text-decoration: none;
          font-weight: 700;
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
        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .benefit-item:last-child { border-bottom: none; }
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
        .auth-alert {
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.5;
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
        @media (max-width: 540px) {
          .auth-name-grid { grid-template-columns: 1fr !important; }
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
        [data-theme="light"] .auth-btn-outline {
          border-color: rgba(91,33,182,0.18);
          color: rgba(30,27,75,0.6);
        }
        [data-theme="light"] .auth-btn-outline:hover { border-color: rgba(91,33,182,0.4); color: #5B21B6; }
        [data-theme="light"] .auth-link { color: #7C3AED; }
        [data-theme="light"] .auth-link:hover { color: #5B21B6; }
        [data-theme="light"] .show-pass-btn { color: rgba(30,27,75,0.35); }
        [data-theme="light"] .show-pass-btn:hover { color: rgba(30,27,75,0.7); }
        [data-theme="light"] .benefit-item { border-bottom-color: rgba(91,33,182,0.08); }
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
      `}</style>

      <div
        className="glow-orb"
        style={{
          width: 500,
          height: 500,
          background: isLight
            ? "rgba(124,58,237,0.06)"
            : "rgba(59,222,185,0.06)",
          top: -150,
          right: -150,
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
          left: -80,
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
            : "linear-gradient(135deg, rgba(59,222,185,0.06) 0%, rgba(204,255,155,0.03) 100%)",
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
              : "linear-gradient(rgba(59,222,185,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,222,185,0.03) 1px, transparent 1px)",
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
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: isLight ? "#1e1b4b" : "#fff",
              lineHeight: 1.2,
              margin: "0 0 12px",
            }}
          >
            Rejoignez les acheteurs qui comparent avant d'acheter.
          </h2>
          <p
            style={{
              color: isLight ? "rgba(30,27,75,0.55)" : "rgba(255,255,255,0.4)",
              fontSize: "14px",
              lineHeight: 1.7,
              margin: "0 0 32px",
            }}
          >
            Creez votre compte gratuit et gardez votre experience synchronisee.
          </p>

          <div>
            {[
              {
                title: "Catalogue reel",
                desc: "Produits et prix compares en temps reel",
              },
              {
                title: "Parapharmacie",
                desc: "Categories et articles dedies disponibles",
              },
              {
                title: "Electromenager",
                desc: "Une selection dediee aux equipements maison",
              },
              {
                title: "Session persistante",
                desc: "Connexion conservee apres rafraichissement",
              },
            ].map((benefit) => (
              <div className="benefit-item" key={benefit.title}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "12px",
                    flexShrink: 0,
                    background: isLight
                      ? "rgba(124,58,237,0.1)"
                      : "rgba(59,222,185,0.1)",
                    border: isLight
                      ? "1px solid rgba(124,58,237,0.15)"
                      : "1px solid rgba(59,222,185,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 900,
                    color: isLight ? "#7C3AED" : "#3BDEB9",
                  }}
                >
                  {benefit.title.charAt(0)}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: isLight ? "#1e1b4b" : "#fff",
                    }}
                  >
                    {benefit.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: isLight
                        ? "rgba(30,27,75,0.45)"
                        : "rgba(255,255,255,0.35)",
                      marginTop: "2px",
                    }}
                  >
                    {benefit.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: isLight
              ? "rgba(124,58,237,0.06)"
              : "rgba(59,222,185,0.06)",
            border: isLight
              ? "1px solid rgba(124,58,237,0.12)"
              : "1px solid rgba(59,222,185,0.12)",
            borderRadius: "16px",
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: isLight
                ? "rgba(124,58,237,0.12)"
                : "rgba(59,222,185,0.12)",
              color: isLight ? "#7C3AED" : "#3BDEB9",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
            }}
          >
            1
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: isLight ? "#1e1b4b" : "#fff",
              }}
            >
              Compte client gratuit
            </div>
            <div
              style={{
                fontSize: "11px",
                color: isLight
                  ? "rgba(30,27,75,0.45)"
                  : "rgba(255,255,255,0.35)",
                marginTop: "2px",
              }}
            >
              Aucune carte bancaire requise.
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "32px",
            }}
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: item === step ? 28 : 8,
                    height: 8,
                    borderRadius: "999px",
                    background:
                      item <= step
                        ? isLight
                          ? "linear-gradient(90deg,#7C3AED,#5B21B6)"
                          : "linear-gradient(90deg,#3BDEB9,#CCFF9B)"
                        : isLight
                          ? "rgba(91,33,182,0.15)"
                          : "rgba(255,255,255,0.12)",
                    transition: "all 0.3s ease",
                  }}
                />
                {item < 3 && (
                  <div
                    style={{
                      width: 24,
                      height: 1,
                      background: isLight
                        ? "rgba(91,33,182,0.12)"
                        : "rgba(255,255,255,0.1)",
                    }}
                  />
                )}
              </div>
            ))}
            <span
              style={{
                fontSize: "11px",
                color: isLight ? "rgba(30,27,75,0.4)" : "rgba(255,255,255,0.3)",
                fontWeight: 600,
                marginLeft: "4px",
              }}
            >
              Etape {step}/3
            </span>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h1 className="auth-title">
              {step === 1
                ? "Creer votre compte"
                : step === 2
                  ? "Derniere etape"
                  : "Verifier votre email"}
            </h1>
            <p className="auth-subtle">
              Deja inscrit ?{" "}
              <a href="/connexion" className="auth-link">
                Se connecter
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
              {success}{" "}
              <a href="/connexion" className="auth-link">
                Se connecter
              </a>
            </div>
          )}

          {step === 1 ? (
            <form
              onSubmit={handleNext}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                className="auth-name-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Prenom
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Ahmed"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Nom
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Ben Ali"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
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
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="ahmed_ba"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Numero de telephone
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    +216
                  </span>
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder="XX XXX XXX"
                    style={{ paddingLeft: "52px" }}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    disabled={loading}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-btn"
                style={{ marginTop: "8px" }}
                disabled={loading}
              >
                Continuer
              </button>
            </form>
          ) : step === 2 ? (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Mot de passe
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    placeholder="Minimum 8 caracteres"
                    style={{ paddingRight: "46px" }}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
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
                <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      style={{
                        flex: 1,
                        height: "3px",
                        borderRadius: "999px",
                        background:
                          password.length >= item * 3
                            ? "linear-gradient(90deg,#3BDEB9,#77E590)"
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#3BDEB9",
                    fontWeight: 600,
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  8 a 64 caracteres requis
                </span>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Repeter le mot de passe"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Gouvernorat
                </label>
                <select
                  className="auth-input"
                  style={{ cursor: "pointer" }}
                  value={gouvernoratId}
                  onChange={(event) => setGouvernoratId(event.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="" style={{ background: "#0a0f0d" }}>
                    Selectionner
                  </option>
                  {gouvernorats.map((governorate) => (
                    <option
                      key={governorate.id}
                      value={governorate.id}
                      style={{ background: "#0a0f0d" }}
                    >
                      {governorate.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <input
                  type="checkbox"
                  id="terms"
                  checked={terms}
                  onChange={(event) => setTerms(event.target.checked)}
                  disabled={loading}
                  style={{
                    accentColor: "#3BDEB9",
                    width: 16,
                    height: 16,
                    cursor: "pointer",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                />
                <label
                  htmlFor="terms"
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    lineHeight: 1.6,
                  }}
                >
                  J'accepte les conditions d'utilisation et la politique de
                  confidentialite.
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="auth-btn-outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Retour
                </button>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Creation..." : "Creer mon compte"}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleVerifyEmail}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <p className="auth-subtle">
                Un code a 6 chiffres a ete envoye a {email.trim()}.
              </p>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Code email
                </label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(event.target.value.replace(/\D/g, ""))
                  }
                  disabled={loading}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="auth-btn-outline"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  Retour
                </button>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Verification..." : "Verifier mon email"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
