"use client"

import React, { useEffect, useRef, useState } from "react"
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    KeyRound,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    ShieldCheck,
    UserRound,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/header"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/AuthContext"
import { authService } from "@/services/auth"

export default function ParametresPage() {
    const { user: authUser, loading: authLoading, status, refreshUser } = useAuth()
    const [activeTab, setActiveTab] = useState<"profile" | "security">("profile")
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [avatarPreview, setAvatarPreview] = useState("/avatar.jpg")
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const [profileData, setProfileData] = useState({
        nom: "",
        nomUtilisateur: "",
        email: "",
        dateNaissance: "",
        adresse: "",
    })

    const [securityData, setSecurityData] = useState({
        currentPassword: "",
        newPassword: "",
    })

    useEffect(() => {
        const fetchUserData = async () => {
            if (authLoading) return

            if (status !== "authenticated") {
                setMessage({ type: "error", text: "Veuillez vous connecter pour acceder aux parametres." })
                setLoading(false)
                return
            }

            if (authUser) {
                setProfileData({
                    nom: authUser.full_name || "",
                    nomUtilisateur: authUser.username || "",
                    email: authUser.email || "",
                    dateNaissance: authUser.birthdate || "",
                    adresse: authUser.address || "",
                })
                setAvatarPreview(authUser.picture || "/avatar.jpg")
                setLoading(false)
                return
            }

            try {
                const response = await authService.me()
                const userData = response.data
                setProfileData({
                    nom: userData.full_name || "",
                    nomUtilisateur: userData.username || "",
                    email: userData.email || "",
                    dateNaissance: userData.birthdate || "",
                    adresse: userData.address || "",
                })
                setAvatarPreview(userData.picture || "/avatar.jpg")
            } catch (error) {
                console.error("Failed to fetch user data", error)
                setMessage({ type: "error", text: "Impossible de charger vos informations de profil." })
            } finally {
                setLoading(false)
            }
        }

        fetchUserData()
    }, [authLoading, authUser, status])

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value })
    }

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setSecurityData((prev) => ({ ...prev, [name]: value }))
    }

    const handleAvatarImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setMessage({ type: "error", text: "Veuillez importer une image valide." })
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === "string") {
                setAvatarPreview(reader.result)
                setMessage(null)
            }
        }
        reader.readAsDataURL(file)
    }

    const saveProfile = async () => {
        setSaving(true)
        setMessage(null)
        try {
            await authService.updateProfile({
                full_name: profileData.nom,
                username: profileData.nomUtilisateur,
                birthdate: profileData.dateNaissance,
                address: profileData.adresse,
                picture: avatarPreview,
            })
            await refreshUser()
            setMessage({ type: "success", text: "Profil mis a jour avec succes." })
        } catch {
            setMessage({ type: "error", text: "Echec de la mise a jour du profil." })
        } finally {
            setSaving(false)
        }
    }

    const saveSecurity = async () => {
        if (!securityData.currentPassword || !securityData.newPassword) {
            setMessage({ type: "error", text: "Veuillez remplir tous les champs." })
            return
        }

        setSaving(true)
        setMessage(null)
        try {
            await authService.changePassword({
                current_password: securityData.currentPassword,
                new_password: securityData.newPassword,
            })
            setMessage({ type: "success", text: "Mot de passe mis a jour avec succes." })
            setSecurityData({ currentPassword: "", newPassword: "" })
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || "Echec de la mise a jour du mot de passe."
            setMessage({ type: "error", text: errorMsg })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-purple" />
            </div>
        )
    }

    const displayName = profileData.nom || profileData.email.split("@")[0] || "Utilisateur"

    return (
        <div className="dashboard-page">
            <DashboardHeader title="Parametres" />
            <main className="dashboard-main">
                <section className="dashboard-settings-hero">
                    <div className="dashboard-settings-heroCopy">
                        <span className="dashboard-settings-kicker">Workspace settings</span>
                        <h2>Gerez votre profil, vos acces et vos preferences de securite.</h2>
                        <p>Cette section centralise les informations du compte, les identifiants de connexion et les options de protection utilisees dans le dashboard.</p>
                    </div>
                    <div className="dashboard-settings-heroStats">
                        <div className="dashboard-settings-statCard">
                            <span>Compte</span>
                            <strong>{displayName}</strong>
                            <p>Profil visible dans l espace dashboard.</p>
                        </div>
                        <div className="dashboard-settings-statCard">
                            <span>Securite</span>
                            <strong>{twoFactorEnabled ? "2FA active" : "2FA inactive"}</strong>
                            <p>Controle rapide de la protection du compte.</p>
                        </div>
                    </div>
                </section>

                <section className="dashboard-settings-shell">
                    {message && (
                        <div className={`dashboard-settings-alert ${message.type === "success" ? "is-success" : "is-error"}`}>
                            {message.type === "success" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                            {message.text}
                        </div>
                    )}

                    <div className="dashboard-settings-tabs">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("profile")
                                setMessage(null)
                            }}
                            className={`dashboard-settings-tab ${activeTab === "profile" ? "is-active" : ""}`}
                        >
                            <UserRound className="size-4" />
                            Modifier le profil
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("security")
                                setMessage(null)
                            }}
                            className={`dashboard-settings-tab ${activeTab === "security" ? "is-active" : ""}`}
                        >
                            <ShieldCheck className="size-4" />
                            Securite
                        </button>
                    </div>

                    {activeTab === "profile" && (
                        <div className="dashboard-settings-grid">
                            <aside className="dashboard-settings-profileCard">
                                <div className="dashboard-settings-avatarWrap">
                                    <div className="dashboard-settings-avatar">
                                        <img src={avatarPreview} alt="Profile avatar" className="size-full object-cover" />
                                    </div>
                                    <button
                                        className="dashboard-settings-avatarEdit"
                                        type="button"
                                        aria-label="Modifier l avatar"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Pencil className="size-3.5" />
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="dashboard-settings-fileInput"
                                    onChange={handleAvatarImport}
                                />
                                <button
                                    type="button"
                                    className="dashboard-settings-uploadButton"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Importer une image
                                </button>
                                <strong>{displayName}</strong>
                                <span>{profileData.email}</span>

                                <div className="dashboard-settings-profileMeta">
                                    <div>
                                        <span>Role</span>
                                        <strong>{authUser?.role || "utilisateur"}</strong>
                                    </div>
                                    <div>
                                        <span>Compte</span>
                                        <strong>{status === "authenticated" ? "Actif" : "Public"}</strong>
                                    </div>
                                </div>
                            </aside>

                            <section className="dashboard-card dashboard-card-body">
                                <div className="dashboard-store-section-head">
                                    <div>
                                        <h3 className="dashboard-card-title">Informations du profil</h3>
                                        <p className="dashboard-card-subtitle">Mettez a jour les donnees visibles dans votre espace et les informations de contact utilisees par l equipe.</p>
                                    </div>
                                </div>

                                <div className="dashboard-settings-formGrid">
                                    <label className="dashboard-settings-field">
                                        <span><UserRound className="size-4" /> Nom complet</span>
                                        <input
                                            type="text"
                                            name="nom"
                                            value={profileData.nom}
                                            onChange={handleProfileChange}
                                            placeholder="Ex: Jean Dupont"
                                        />
                                    </label>

                                    <label className="dashboard-settings-field">
                                        <span><UserRound className="size-4" /> Nom d utilisateur</span>
                                        <input
                                            type="text"
                                            name="nomUtilisateur"
                                            value={profileData.nomUtilisateur}
                                            onChange={handleProfileChange}
                                            placeholder="Ex: jdupont"
                                        />
                                    </label>

                                    <label className="dashboard-settings-field">
                                        <span><Mail className="size-4" /> Email</span>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profileData.email}
                                            readOnly
                                            disabled
                                            placeholder="nom@entreprise.com"
                                        />
                                        <small className="dashboard-settings-help">L email ne peut pas etre modifie ici.</small>
                                    </label>

                                    <label className="dashboard-settings-field">
                                        <span><CalendarDays className="size-4" /> Date de naissance</span>
                                        <input
                                            type="date"
                                            name="dateNaissance"
                                            value={profileData.dateNaissance}
                                            onChange={handleProfileChange}
                                        />
                                    </label>

                                    <label className="dashboard-settings-field is-full">
                                        <span><MapPin className="size-4" /> Adresse</span>
                                        <input
                                            type="text"
                                            name="adresse"
                                            value={profileData.adresse}
                                            onChange={handleProfileChange}
                                            placeholder="Votre adresse complete"
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
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="dashboard-settings-securityGrid">
                            <section className="dashboard-card dashboard-card-body">
                                <div className="dashboard-store-section-head">
                                    <div>
                                        <h3 className="dashboard-card-title">Protection du compte</h3>
                                        <p className="dashboard-card-subtitle">Activez un niveau de securite supplementaire et gardez le controle sur l acces au dashboard.</p>
                                    </div>
                                </div>

                                <div className="dashboard-settings-securityToggle">
                                    <div>
                                        <strong>Authentification a deux facteurs</strong>
                                        <p>Ajoute une verification supplementaire lors de la connexion a votre espace.</p>
                                    </div>
                                    <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                                </div>
                            </section>

                            <section className="dashboard-card dashboard-card-body">
                                <div className="dashboard-store-section-head">
                                    <div>
                                        <h3 className="dashboard-card-title">Changer le mot de passe</h3>
                                        <p className="dashboard-card-subtitle">Utilisez un mot de passe unique et robuste pour proteger l acces au compte.</p>
                                    </div>
                                </div>

                                <div className="dashboard-settings-formGrid is-security">
                                    <label className="dashboard-settings-field is-full">
                                        <span><KeyRound className="size-4" /> Mot de passe actuel</span>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={securityData.currentPassword}
                                            onChange={handleSecurityChange}
                                            placeholder="••••••••"
                                        />
                                    </label>

                                    <label className="dashboard-settings-field is-full">
                                        <span><ShieldCheck className="size-4" /> Nouveau mot de passe</span>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={securityData.newPassword}
                                            onChange={handleSecurityChange}
                                            placeholder="••••••••"
                                        />
                                    </label>
                                </div>

                                <div className="dashboard-settings-actions">
                                    <button
                                        type="button"
                                        onClick={saveSecurity}
                                        disabled={saving}
                                        className="dashboard-settings-saveButton"
                                    >
                                        {saving && <Loader2 className="size-4 animate-spin" />}
                                        Sauvegarder
                                    </button>
                                </div>
                            </section>

                            <aside className="dashboard-settings-securityAside">
                                <div className="dashboard-settings-securityNote">
                                    <ShieldCheck className="size-5" />
                                    <div>
                                        <strong>Conseil securite</strong>
                                        <p>Renouvelez regulierement votre mot de passe et activez la 2FA pour limiter les acces non autorises.</p>
                                    </div>
                                </div>
                                <div className="dashboard-settings-securityNote">
                                    <Mail className="size-5" />
                                    <div>
                                        <strong>Email principal</strong>
                                        <p>{profileData.email || "Aucun email configure pour le compte."}</p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
