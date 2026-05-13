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

import { DashboardHeader } from "@/components/dashboard/header";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteOwnAccount,
  disableTwoFactor,
  enableTwoFactor,
  getApiErrorMessage,
  listGouvernorats,
  logoutAll,
  updateProfile,
  verifyDisableTwoFactor,
  verifyEnableTwoFactor,
  type Gouvernorat,
} from "@/lib/api";
import { authService } from "@/services/auth";

export default function ParametresPage() {
  const { user, loading, status, refreshUser, clearSession } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [gouvernorats, setGouvernorats] = useState<Gouvernorat[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
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
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorMode, setTwoFactorMode] = useState<
    "idle" | "enable_verify" | "disable_verify"
  >("idle");

  useEffect(() => {
    listGouvernorats()
      .then(setGouvernorats)
      .catch(() => setGouvernorats([]));
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
    () => user?.full_name || user?.username || user?.email || "Utilisateur",
    [user],
  );

  const setSuccess = (text: string) => setMessage({ type: "success", text });
  const setFailure = (error: unknown, fallback: string) =>
    setMessage({ type: "error", text: getApiErrorMessage(error, fallback) });

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile({
        full_name: profileData.full_name,
        username: profileData.username,
        phone: profileData.phone || null,
        gouvernorat_id: profileData.gouvernorat_id
          ? Number(profileData.gouvernorat_id)
          : null,
      });
      await refreshUser();
      setSuccess("Profil mis a jour avec succes.");
    } catch (error) {
      setFailure(error, "Echec de la mise a jour du profil.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await authService.changePassword(passwordData);
      setPasswordData({ current_password: "", new_password: "" });
      setSuccess("Mot de passe mis a jour. Les sessions ont ete revoquees.");
    } catch (error) {
      setFailure(error, "Echec de la mise a jour du mot de passe.");
    } finally {
      setSaving(false);
    }
  };

  const startTwoFactor = async () => {
    if (!twoFactorPassword) {
      setMessage({
        type: "error",
        text: "Saisissez votre mot de passe actuel.",
      });
      return;
    }
    setSaving(true);
    setMessage(null);
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
    } catch (error) {
      setFailure(error, "Operation 2FA impossible.");
    } finally {
      setSaving(false);
    }
  };

  const verifyTwoFactor = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (twoFactorMode === "enable_verify") {
        await verifyEnableTwoFactor(twoFactorCode);
        setSuccess("Double authentification activee.");
      } else if (twoFactorMode === "disable_verify") {
        await verifyDisableTwoFactor(twoFactorCode);
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

  const handleLogoutAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await logoutAll();
      clearSession();
    } catch (error) {
      setFailure(error, "Impossible de fermer toutes les sessions.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Supprimer votre compte ? Cette action est irreversible.")) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await deleteOwnAccount();
      clearSession();
    } catch (error) {
      setFailure(error, "Impossible de supprimer le compte.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-purple" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader title="Parametres" />
      <main className="dashboard-main">
        <section className="dashboard-settings-hero">
          <div className="dashboard-settings-heroCopy">
            <span className="dashboard-settings-kicker">Account settings</span>
            <h2>Gerez votre profil et la securite du compte.</h2>
            <p>
              Les changements sont appliques au backend de production. Les
              champs non supportes par l'API ne sont pas envoyes.
            </p>
          </div>
          <div className="dashboard-settings-heroStats">
            <div className="dashboard-settings-statCard">
              <span>Compte</span>
              <strong>{displayName}</strong>
              <p>{user?.email}</p>
            </div>
            <div className="dashboard-settings-statCard">
              <span>2FA</span>
              <strong>
                {user?.two_factor_enabled ? "Activee" : "Inactive"}
              </strong>
              <p>Verification email lors de la connexion.</p>
            </div>
          </div>
        </section>

        <section className="dashboard-settings-shell">
          {message && (
            <div
              className={`dashboard-settings-alert ${message.type === "success" ? "is-success" : "is-error"}`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertCircle className="size-4" />
              )}
              {message.text}
            </div>
          )}

          <div className="dashboard-settings-tabs">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`dashboard-settings-tab ${activeTab === "profile" ? "is-active" : ""}`}
            >
              <UserRound className="size-4" />
              Profil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`dashboard-settings-tab ${activeTab === "security" ? "is-active" : ""}`}
            >
              <ShieldCheck className="size-4" />
              Securite
            </button>
          </div>

          {activeTab === "profile" && (
            <section className="dashboard-card dashboard-card-body">
              <div className="dashboard-settings-formGrid">
                <label className="dashboard-settings-field">
                  <span>
                    <UserRound className="size-4" /> Nom complet
                  </span>
                  <input
                    value={profileData.full_name}
                    onChange={(event) =>
                      setProfileData((value) => ({
                        ...value,
                        full_name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dashboard-settings-field">
                  <span>
                    <UserRound className="size-4" /> Nom d'utilisateur
                  </span>
                  <input
                    value={profileData.username}
                    onChange={(event) =>
                      setProfileData((value) => ({
                        ...value,
                        username: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="dashboard-settings-field">
                  <span>
                    <Mail className="size-4" /> Email
                  </span>
                  <input value={user?.email || ""} disabled readOnly />
                </label>
                <label className="dashboard-settings-field">
                  <span>
                    <MapPin className="size-4" /> Gouvernorat
                  </span>
                  <select
                    value={profileData.gouvernorat_id}
                    onChange={(event) =>
                      setProfileData((value) => ({
                        ...value,
                        gouvernorat_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">Selectionner</option>
                    {gouvernorats.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="dashboard-settings-field is-full">
                  <span>
                    <MapPin className="size-4" /> Telephone
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
                  />
                </label>
              </div>
              <div className="dashboard-settings-actions">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving}
                  className="dashboard-settings-saveButton"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Sauvegarder
                </button>
              </div>
            </section>
          )}

          {activeTab === "security" && (
            <div className="dashboard-settings-securityGrid">
              <section className="dashboard-card dashboard-card-body">
                <h3 className="dashboard-card-title">
                  Changer le mot de passe
                </h3>
                <div className="dashboard-settings-formGrid is-security">
                  <label className="dashboard-settings-field is-full">
                    <span>
                      <KeyRound className="size-4" /> Mot de passe actuel
                    </span>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(event) =>
                        setPasswordData((value) => ({
                          ...value,
                          current_password: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="dashboard-settings-field is-full">
                    <span>
                      <ShieldCheck className="size-4" /> Nouveau mot de passe
                    </span>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(event) =>
                        setPasswordData((value) => ({
                          ...value,
                          new_password: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="dashboard-settings-actions">
                  <button
                    type="button"
                    onClick={savePassword}
                    disabled={saving}
                    className="dashboard-settings-saveButton"
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    Sauvegarder
                  </button>
                </div>
              </section>

              <section className="dashboard-card dashboard-card-body">
                <h3 className="dashboard-card-title">
                  Double authentification
                </h3>
                <p className="dashboard-card-subtitle">
                  Statut actuel:{" "}
                  {user?.two_factor_enabled ? "activee" : "inactive"}.
                </p>
                <div className="dashboard-settings-formGrid is-security">
                  <label className="dashboard-settings-field is-full">
                    <span>
                      <KeyRound className="size-4" /> Mot de passe actuel
                    </span>
                    <input
                      type="password"
                      value={twoFactorPassword}
                      onChange={(event) =>
                        setTwoFactorPassword(event.target.value)
                      }
                    />
                  </label>
                  {twoFactorMode !== "idle" && (
                    <label className="dashboard-settings-field is-full">
                      <span>
                        <Mail className="size-4" /> Code email
                      </span>
                      <input
                        value={twoFactorCode}
                        onChange={(event) =>
                          setTwoFactorCode(
                            event.target.value.replace(/\D/g, ""),
                          )
                        }
                        maxLength={6}
                      />
                    </label>
                  )}
                </div>
                <div className="dashboard-settings-actions">
                  {twoFactorMode === "idle" ? (
                    <button
                      type="button"
                      onClick={startTwoFactor}
                      disabled={saving}
                      className="dashboard-settings-saveButton"
                    >
                      {user?.two_factor_enabled ? "Desactiver" : "Activer"} 2FA
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={verifyTwoFactor}
                      disabled={saving}
                      className="dashboard-settings-saveButton"
                    >
                      Verifier le code
                    </button>
                  )}
                </div>
              </section>

              <aside className="dashboard-settings-securityAside">
                <button
                  type="button"
                  onClick={handleLogoutAll}
                  disabled={saving}
                  className="dashboard-settings-securityNote"
                >
                  <ShieldCheck className="size-5" />
                  <div>
                    <strong>Fermer toutes les sessions</strong>
                    <p>Revoque tous les refresh tokens du compte.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="dashboard-settings-securityNote"
                >
                  <Trash2 className="size-5" />
                  <div>
                    <strong>Supprimer mon compte</strong>
                    <p>Effectue une suppression logique cote backend.</p>
                  </div>
                </button>
              </aside>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
