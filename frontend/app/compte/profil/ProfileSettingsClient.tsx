"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import ProtectedRoute from "../../components/ProtectedRoute";
import { FieldErrorText, OtpCodeInput } from "../../components/auth/AuthFields";
import { useAuth } from "../../lib/auth/AuthProvider";
import {
  changePassword,
  deleteOwnAccount,
  disableTwoFactor,
  enableTwoFactor,
  getApiFieldErrors,
  getFrenchApiErrorMessage,
  listGouvernorats,
  logoutAll,
  setPassword,
  updateProfile,
  verifyDisableTwoFactor,
  verifyEnableTwoFactor,
  type Gouvernorat,
} from "../../lib/api";

type Message = { type: "success" | "error"; text: string } | null;
type TwoFactorMode = "idle" | "enable_verify" | "disable_verify";

export default function ProfileSettingsClient() {
  const { user, status, loading, refreshUser, clearSession } = useAuth();
  const [gouvernorats, setGouvernorats] = useState<Gouvernorat[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [profileData, setProfileData] = useState({
    full_name: "",
    username: "",
    phone: "",
    gouvernorat_id: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
  });
  const [localPasswordData, setLocalPasswordData] = useState({
    new_password: "",
    new_password_confirm: "",
  });
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorMode, setTwoFactorMode] = useState<TwoFactorMode>("idle");

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

  useEffect(() => {
    if (!user) return;
    setProfileData({
      full_name: user.full_name || "",
      username: user.username || "",
      phone: user.phone || "",
      gouvernorat_id: user.gouvernorat_id ? String(user.gouvernorat_id) : "",
    });
  }, [user]);

  const displayName = useMemo(
    () => user?.full_name || user?.username || user?.email || "Mon compte",
    [user],
  );

  const authProviderLabel =
    user?.auth_provider === "google" ? "Google" : "Mot de passe";

  const setSuccess = (text: string) => setMessage({ type: "success", text });
  const setFailure = (error: unknown, fallback: string) => {
    setFieldErrors(getApiFieldErrors(error));
    setMessage({
      type: "error",
      text: getFrenchApiErrorMessage(error, fallback),
    });
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await updateProfile({
        full_name: profileData.full_name.trim(),
        username: profileData.username.trim(),
        phone: profileData.phone.trim() || null,
        gouvernorat_id: profileData.gouvernorat_id
          ? Number(profileData.gouvernorat_id)
          : null,
      });
      await refreshUser();
      setSuccess("Profil mis a jour.");
    } catch (error) {
      setFailure(error, "Impossible de mettre a jour le profil.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await changePassword(passwordData);
      setPasswordData({ current_password: "", new_password: "" });
      setSuccess("Mot de passe mis a jour.");
    } catch (error) {
      setFailure(error, "Impossible de changer le mot de passe.");
    } finally {
      setSaving(false);
    }
  };

  const saveLocalPassword = async () => {
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await setPassword(localPasswordData);
      setLocalPasswordData({ new_password: "", new_password_confirm: "" });
      setSuccess("Mot de passe local ajoute.");
    } catch (error) {
      setFailure(error, "Impossible d'ajouter le mot de passe local.");
    } finally {
      setSaving(false);
    }
  };

  const startTwoFactor = async () => {
    if (!twoFactorPassword.trim()) {
      setFieldErrors({
        current_password: "Saisissez votre mot de passe actuel.",
      });
      setMessage({
        type: "error",
        text: "Saisissez votre mot de passe actuel.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      if (user?.two_factor_enabled) {
        await disableTwoFactor(twoFactorPassword);
        setTwoFactorMode("disable_verify");
        setSuccess("Code de desactivation envoye par email.");
      } else {
        await enableTwoFactor(twoFactorPassword);
        setTwoFactorMode("enable_verify");
        setSuccess("Code d'activation envoye par email.");
      }
      setTwoFactorPassword("");
      setTwoFactorCode("");
    } catch (error) {
      setFailure(error, "Operation 2FA impossible.");
    } finally {
      setSaving(false);
    }
  };

  const verifyTwoFactor = async () => {
    const normalizedCode = twoFactorCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setFieldErrors({ code: "Le code doit contenir 6 chiffres." });
      setMessage({ type: "error", text: "Le code doit contenir 6 chiffres." });
      return;
    }

    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      if (twoFactorMode === "enable_verify") {
        await verifyEnableTwoFactor(normalizedCode);
        setSuccess("Double authentification activee.");
      } else if (twoFactorMode === "disable_verify") {
        await verifyDisableTwoFactor(normalizedCode);
        setSuccess("Double authentification desactivee.");
      }
      setTwoFactorCode("");
      setTwoFactorMode("idle");
      await refreshUser();
    } catch (error) {
      setFailure(error, "Code 2FA invalide ou expire.");
    } finally {
      setSaving(false);
    }
  };

  const closeAllSessions = async () => {
    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await logoutAll();
      clearSession();
    } catch (error) {
      setFailure(error, "Impossible de fermer toutes les sessions.");
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async () => {
    if (!confirm("Supprimer votre compte ? Cette action est irreversible.")) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await deleteOwnAccount();
      clearSession();
    } catch (error) {
      setFailure(error, "Impossible de supprimer le compte.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="profile-settings-main">
        <style>{`
          .profile-settings-main {
            min-height: 100vh;
            padding: 120px 24px 80px;
            background: #050806;
            color: #fff;
          }
          .profile-settings-wrap {
            max-width: 1120px;
            margin: 0 auto;
          }
          .profile-settings-hero {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 24px;
            margin-bottom: 22px;
          }
          .profile-settings-kicker {
            color: #3BDEB9;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .profile-settings-title {
            margin: 0;
            font-size: clamp(1.8rem, 4vw, 3rem);
            font-weight: 900;
            line-height: 1.05;
            letter-spacing: -0.03em;
          }
          .profile-settings-meta {
            margin-top: 10px;
            color: rgba(255,255,255,0.5);
            font-size: 14px;
          }
          .profile-settings-status {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .profile-settings-pill {
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.04);
            padding: 9px 13px;
            font-size: 12px;
            font-weight: 800;
            color: rgba(255,255,255,0.74);
          }
          .profile-settings-pill.is-good {
            border-color: rgba(59,222,185,0.26);
            color: #9ff5df;
            background: rgba(59,222,185,0.08);
          }
          .profile-settings-alert {
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 14px;
            padding: 13px 15px;
            margin-bottom: 18px;
            font-size: 14px;
            font-weight: 700;
          }
          .profile-settings-alert.is-success {
            color: #9ff5df;
            border: 1px solid rgba(59,222,185,0.25);
            background: rgba(59,222,185,0.1);
          }
          .profile-settings-alert.is-error {
            color: #fecaca;
            border: 1px solid rgba(248,113,113,0.35);
            background: rgba(248,113,113,0.12);
          }
          .profile-settings-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(340px, 0.8fr);
            gap: 18px;
            align-items: start;
          }
          .profile-settings-card {
            border-radius: 22px;
            border: 1px solid rgba(255,255,255,0.09);
            background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02));
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 22px;
          }
          .profile-settings-card + .profile-settings-card {
            margin-top: 18px;
          }
          .profile-settings-card h2 {
            margin: 0 0 16px;
            font-size: 17px;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 9px;
          }
          .profile-settings-form {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          .profile-settings-field {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }
          .profile-settings-field.is-full {
            grid-column: 1 / -1;
          }
          .profile-settings-field span {
            color: rgba(255,255,255,0.46);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 7px;
          }
          .profile-settings-field input,
          .profile-settings-field select,
          .auth-input {
            width: 100%;
            min-height: 44px;
            box-sizing: border-box;
            border-radius: 13px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.05);
            color: #fff;
            padding: 12px 13px;
            outline: none;
          }
          .profile-settings-field select option {
            background: #0a0f0d;
          }
          .profile-settings-field input:focus,
          .profile-settings-field select:focus,
          .auth-input:focus {
            border-color: rgba(59,222,185,0.55);
            box-shadow: 0 0 0 3px rgba(59,222,185,0.12);
          }
          .profile-settings-field input:disabled {
            color: rgba(255,255,255,0.42);
          }
          .profile-settings-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 16px;
          }
          .profile-settings-button {
            min-height: 42px;
            border-radius: 999px;
            border: 1px solid rgba(59,222,185,0.3);
            background: rgba(59,222,185,0.11);
            color: #9ff5df;
            padding: 0 17px;
            font-size: 13px;
            font-weight: 900;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .profile-settings-button:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
          .profile-settings-button.is-danger {
            border-color: rgba(248,113,113,0.32);
            background: rgba(248,113,113,0.1);
            color: #fecaca;
          }
          .profile-settings-note {
            color: rgba(255,255,255,0.48);
            font-size: 13px;
            line-height: 1.6;
            margin: -4px 0 14px;
          }
          @media (max-width: 900px) {
            .profile-settings-main { padding: 94px 14px 52px; }
            .profile-settings-hero { align-items: flex-start; flex-direction: column; }
            .profile-settings-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 560px) {
            .profile-settings-form { grid-template-columns: 1fr; }
            .profile-settings-card { border-radius: 17px; padding: 16px; }
          }
        `}</style>

        <div className="profile-settings-wrap">
          <section className="profile-settings-hero">
            <div>
              <div className="profile-settings-kicker">Compte</div>
              <h1 className="profile-settings-title">{displayName}</h1>
              <div className="profile-settings-meta">
                {user?.email || "Session en cours"}
              </div>
            </div>
            <div className="profile-settings-status">
              <span className="profile-settings-pill">{authProviderLabel}</span>
              <span
                className={`profile-settings-pill ${user?.two_factor_enabled ? "is-good" : ""}`}
              >
                2FA {user?.two_factor_enabled ? "activee" : "inactive"}
              </span>
            </div>
          </section>

          {message && (
            <div
              className={`profile-settings-alert ${
                message.type === "success" ? "is-success" : "is-error"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              {message.text}
            </div>
          )}

          {loading || status === "loading" || !user ? (
            <div className="profile-settings-card">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="profile-settings-grid">
              <section className="profile-settings-card">
                <h2>
                  <UserRound size={18} />
                  Profil
                </h2>
                <div className="profile-settings-form">
                  <label className="profile-settings-field">
                    <span>
                      <UserRound size={15} /> Nom complet
                    </span>
                    <input
                      value={profileData.full_name}
                      onChange={(event) =>
                        setProfileData((value) => ({
                          ...value,
                          full_name: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(fieldErrors.full_name)}
                    />
                    <FieldErrorText>{fieldErrors.full_name}</FieldErrorText>
                  </label>
                  <label className="profile-settings-field">
                    <span>
                      <UserRound size={15} /> Nom d'utilisateur
                    </span>
                    <input
                      value={profileData.username}
                      onChange={(event) =>
                        setProfileData((value) => ({
                          ...value,
                          username: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(fieldErrors.username)}
                    />
                    <FieldErrorText>{fieldErrors.username}</FieldErrorText>
                  </label>
                  <label className="profile-settings-field">
                    <span>
                      <Mail size={15} /> Email
                    </span>
                    <input value={user.email || ""} disabled readOnly />
                  </label>
                  <label className="profile-settings-field">
                    <span>
                      <MapPin size={15} /> Gouvernorat
                    </span>
                    <select
                      value={profileData.gouvernorat_id}
                      onChange={(event) =>
                        setProfileData((value) => ({
                          ...value,
                          gouvernorat_id: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(fieldErrors.gouvernorat_id)}
                    >
                      <option value="">Selectionner</option>
                      {gouvernorats.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <FieldErrorText>
                      {fieldErrors.gouvernorat_id}
                    </FieldErrorText>
                  </label>
                  <label className="profile-settings-field is-full">
                    <span>
                      <MapPin size={15} /> Telephone
                    </span>
                    <input
                      value={profileData.phone}
                      onChange={(event) =>
                        setProfileData((value) => ({
                          ...value,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="+216..."
                      aria-invalid={Boolean(fieldErrors.phone)}
                    />
                    <FieldErrorText>{fieldErrors.phone}</FieldErrorText>
                  </label>
                </div>
                <div className="profile-settings-actions">
                  <button
                    type="button"
                    className="profile-settings-button"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    Sauvegarder
                  </button>
                </div>
              </section>

              <div>
                <section className="profile-settings-card">
                  <h2>
                    <ShieldCheck size={18} />
                    Double authentification
                  </h2>
                  <p className="profile-settings-note">
                    Statut: {user.two_factor_enabled ? "activee" : "inactive"}.
                  </p>
                  <div className="profile-settings-form">
                    {twoFactorMode === "idle" ? (
                      <label className="profile-settings-field is-full">
                        <span>
                          <KeyRound size={15} /> Mot de passe actuel
                        </span>
                        <input
                          type="password"
                          value={twoFactorPassword}
                          onChange={(event) =>
                            setTwoFactorPassword(event.target.value)
                          }
                          autoComplete="current-password"
                          aria-invalid={Boolean(fieldErrors.current_password)}
                        />
                        <FieldErrorText>
                          {fieldErrors.current_password}
                        </FieldErrorText>
                      </label>
                    ) : (
                      <div className="profile-settings-field is-full">
                        <OtpCodeInput
                          value={twoFactorCode}
                          onChange={setTwoFactorCode}
                          disabled={saving}
                          error={fieldErrors.code}
                          label="Code email"
                        />
                      </div>
                    )}
                  </div>
                  <div className="profile-settings-actions">
                    {twoFactorMode === "idle" ? (
                      <button
                        type="button"
                        className="profile-settings-button"
                        onClick={startTwoFactor}
                        disabled={saving}
                      >
                        {user.two_factor_enabled ? "Desactiver" : "Activer"} 2FA
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="profile-settings-button"
                          onClick={verifyTwoFactor}
                          disabled={saving}
                        >
                          Verifier le code
                        </button>
                        <button
                          type="button"
                          className="profile-settings-button"
                          onClick={() => {
                            setTwoFactorMode("idle");
                            setTwoFactorCode("");
                          }}
                          disabled={saving}
                        >
                          Annuler
                        </button>
                      </>
                    )}
                  </div>
                </section>

                {user.auth_provider === "google" && (
                  <section className="profile-settings-card">
                    <h2>
                      <KeyRound size={18} />
                      Mot de passe local
                    </h2>
                    <div className="profile-settings-form">
                      <label className="profile-settings-field is-full">
                        <span>Nouveau mot de passe</span>
                        <input
                          type="password"
                          value={localPasswordData.new_password}
                          onChange={(event) =>
                            setLocalPasswordData((value) => ({
                              ...value,
                              new_password: event.target.value,
                            }))
                          }
                          autoComplete="new-password"
                          aria-invalid={Boolean(fieldErrors.new_password)}
                        />
                        <FieldErrorText>
                          {fieldErrors.new_password}
                        </FieldErrorText>
                      </label>
                      <label className="profile-settings-field is-full">
                        <span>Confirmation</span>
                        <input
                          type="password"
                          value={localPasswordData.new_password_confirm}
                          onChange={(event) =>
                            setLocalPasswordData((value) => ({
                              ...value,
                              new_password_confirm: event.target.value,
                            }))
                          }
                          autoComplete="new-password"
                          aria-invalid={Boolean(
                            fieldErrors.new_password_confirm,
                          )}
                        />
                        <FieldErrorText>
                          {fieldErrors.new_password_confirm}
                        </FieldErrorText>
                      </label>
                    </div>
                    <div className="profile-settings-actions">
                      <button
                        type="button"
                        className="profile-settings-button"
                        onClick={saveLocalPassword}
                        disabled={saving}
                      >
                        Ajouter
                      </button>
                    </div>
                  </section>
                )}

                <section className="profile-settings-card">
                  <h2>
                    <KeyRound size={18} />
                    Mot de passe
                  </h2>
                  <div className="profile-settings-form">
                    <label className="profile-settings-field is-full">
                      <span>Mot de passe actuel</span>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(event) =>
                          setPasswordData((value) => ({
                            ...value,
                            current_password: event.target.value,
                          }))
                        }
                        autoComplete="current-password"
                        aria-invalid={Boolean(fieldErrors.current_password)}
                      />
                      <FieldErrorText>
                        {fieldErrors.current_password}
                      </FieldErrorText>
                    </label>
                    <label className="profile-settings-field is-full">
                      <span>Nouveau mot de passe</span>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(event) =>
                          setPasswordData((value) => ({
                            ...value,
                            new_password: event.target.value,
                          }))
                        }
                        autoComplete="new-password"
                        aria-invalid={Boolean(fieldErrors.new_password)}
                      />
                      <FieldErrorText>
                        {fieldErrors.new_password}
                      </FieldErrorText>
                    </label>
                  </div>
                  <div className="profile-settings-actions">
                    <button
                      type="button"
                      className="profile-settings-button"
                      onClick={savePassword}
                      disabled={saving}
                    >
                      Changer
                    </button>
                  </div>
                </section>

                <section className="profile-settings-card">
                  <h2>
                    <Trash2 size={18} />
                    Sessions et compte
                  </h2>
                  <div className="profile-settings-actions">
                    <button
                      type="button"
                      className="profile-settings-button"
                      onClick={closeAllSessions}
                      disabled={saving}
                    >
                      Fermer toutes les sessions
                    </button>
                    <button
                      type="button"
                      className="profile-settings-button is-danger"
                      onClick={removeAccount}
                      disabled={saving}
                    >
                      Supprimer mon compte
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
