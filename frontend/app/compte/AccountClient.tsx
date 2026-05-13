"use client";

import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../lib/auth/AuthProvider";

const teal = "#3BDEB9";
const grad = "linear-gradient(135deg, #3BDEB9 0%, #77E590 55%, #CCFF9B 100%)";

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div style={{
      width: 88, height: 88, borderRadius: "50%", flexShrink: 0,
      background: "transparent",
      border: "1px solid rgba(255,255,255,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 32, fontWeight: 900, color: "#fff",
      letterSpacing: "-1px",
    }}>
      {initials || "?"}
    </div>
  );
}

function InfoRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  const empty = value.startsWith("Non") || value === "—";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }} className="acct-row">
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: accent ? "rgba(59,222,185,0.1)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${accent ? "rgba(59,222,185,0.22)" : "rgba(255,255,255,0.08)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: accent ? teal : "rgba(255,255,255,0.45)",
      }} className="acct-row-icon">
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="acct-row-label" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>
          {label}
        </div>
        <div className="acct-row-value" style={{ fontSize: 15, fontWeight: 600, color: empty ? "rgba(255,255,255,0.28)" : "#fff", fontStyle: empty ? "italic" : "normal" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, sub, href }: { icon: React.ReactNode; label: string; sub: string; href: string }) {
  return (
    <a href={href} className="acct-action" style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px", borderRadius: 16,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      textDecoration: "none",
      transition: "background 0.18s, border-color 0.18s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(59,222,185,0.07)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(59,222,185,0.2)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <div className="acct-action-icon" style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: "rgba(59,222,185,0.08)", border: "1px solid rgba(59,222,185,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center", color: teal,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="acct-action-label" style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{label}</div>
        <div className="acct-action-sub" style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{sub}</div>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </a>
  );
}

export default function AccountClient() {
  const { user, logout } = useAuth();

  const displayName = user?.full_name || user?.username || "Mon compte";
  const roleLabel = user?.role === "admin" ? "Administrateur" : user?.role === "shop" ? "Partenaire boutique" : "Client";
  const roleColor = user?.role === "admin" ? "#f97316" : user?.role === "shop" ? "#818cf8" : teal;

  return (
    <ProtectedRoute>
      <main className="acct-main" style={{ minHeight: "100vh", padding: "120px 24px 80px", background: "#050806" }}>
        <style>{`
          .acct-grid { display: grid; grid-template-columns: 340px 1fr; gap: 24px; }
          .acct-banner { border-radius: 28px; overflow: hidden; margin-bottom: 24px; background: linear-gradient(135deg, rgba(59,222,185,0.12) 0%, rgba(8,18,12,0.9) 60%); border: 1px solid rgba(59,222,185,0.18); box-shadow: 0 32px 80px rgba(0,0,0,0.4); padding: 36px 40px; }
          .acct-banner-row { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
          .acct-badge-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
          .acct-badge { font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #fff; background: transparent; border: 1px solid rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 999px; }
          .acct-badge-verified { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; background: transparent; border: 1px solid rgba(255,255,255,0.25); padding: 3px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 5px; }
          .acct-card { border-radius: 24px; padding: 28px; background: linear-gradient(145deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.09); box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
          .acct-card-left { padding: 28px 28px 20px; }
          .acct-right-col { display: flex; flex-direction: column; gap: 24px; }
          @media (max-width: 900px) { .acct-grid { grid-template-columns: 1fr; } }
          @media (max-width: 767px) {
            .acct-main { padding: 92px 12px 48px !important; }
            .acct-banner { border-radius: 18px; padding: 16px 14px; margin-bottom: 14px; }
            .acct-banner-row { gap: 12px; align-items: flex-start; }
            .acct-avatar { width: 68px !important; height: 68px !important; font-size: 24px !important; }
            .acct-badge-row { gap: 6px; margin-bottom: 5px; }
            .acct-badge, .acct-badge-verified { font-size: 9px !important; letter-spacing: 0.08em !important; padding: 3px 7px !important; }
            .acct-name { font-size: 1.35rem !important; line-height: 1.15 !important; }
            .acct-email { font-size: 12px !important; margin-top: 4px !important; }
            .acct-logout { width: 100%; justify-content: center; padding: 10px 12px !important; font-size: 13px !important; }
            .acct-grid { gap: 12px; }
            .acct-card { border-radius: 16px; padding: 14px; }
            .acct-card-left { padding: 14px; }
            .acct-title { font-size: 14px !important; }
            .acct-edit { font-size: 11px !important; padding: 4px 10px !important; }
            .acct-row { gap: 10px !important; padding: 10px 0 !important; }
            .acct-row-icon { width: 32px !important; height: 32px !important; border-radius: 10px !important; }
            .acct-row-label { font-size: 9px !important; margin-bottom: 2px !important; letter-spacing: 0.1em !important; }
            .acct-row-value { font-size: 13px !important; }
            .acct-right-col { gap: 12px; }
            .acct-action { padding: 11px 12px !important; border-radius: 12px !important; gap: 10px !important; }
            .acct-action-icon { width: 34px !important; height: 34px !important; border-radius: 10px !important; }
            .acct-action-label { font-size: 13px !important; }
            .acct-action-sub { font-size: 11px !important; }
          }
        `}</style>

        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* ── Top banner ── */}
          <div className="acct-banner">
            <div className="acct-banner-row">
              <div className="acct-avatar"><Avatar name={displayName} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="acct-badge-row">
                  <span className="acct-badge">{roleLabel}</span>
                  {user?.is_verified && (
                    <span className="acct-badge-verified">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      Vérifié
                    </span>
                  )}
                </div>
                <h1 className="acct-name" style={{ color: "#fff", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800, margin: 0, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                  {displayName}
                </h1>
                <p className="acct-email" style={{ color: "rgba(255,255,255,0.5)", margin: "6px 0 0", fontSize: 14 }}>{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="acct-logout"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 22px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.background = "rgba(239,68,68,0.12)"; b.style.borderColor = "rgba(239,68,68,0.35)"; b.style.color = "#f87171"; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.background = "rgba(255,255,255,0.05)"; b.style.borderColor = "rgba(255,255,255,0.14)"; b.style.color = "rgba(255,255,255,0.7)"; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Déconnexion
              </button>
            </div>

          </div>

          {/* ── Main grid ── */}
          <div className="acct-grid">

            {/* Left — profile info */}
            <div className="acct-card acct-card-left">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <h2 className="acct-title" style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: 0 }}>Informations personnelles</h2>
                <a href="#" className="acct-edit" style={{
                  fontSize: 12, fontWeight: 700, color: teal, textDecoration: "none",
                  background: "rgba(59,222,185,0.08)", border: "1px solid rgba(59,222,185,0.2)",
                  padding: "5px 12px", borderRadius: 999,
                }}>Modifier</a>
              </div>

              <InfoRow accent icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              } label="Nom complet" value={user?.full_name || user?.username || "—"} />

              <InfoRow accent icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              } label="Adresse email" value={user?.email || "—"} />

              <InfoRow icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 0 0 .06 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              } label="Téléphone" value={user?.phone || "Non renseigné"} />

              <InfoRow icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              } label="Adresse" value={user?.address || "Non renseignée"} />

              <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)" }}>Rôle</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 999,
                    color: roleColor, background: `${roleColor}18`, border: `1px solid ${roleColor}30`,
                  }}>{roleLabel}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)" }}>Email vérifié</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 999,
                    color: user?.is_verified ? "#4ade80" : "#f97316",
                    background: user?.is_verified ? "rgba(74,222,128,0.1)" : "rgba(249,115,22,0.1)",
                    border: `1px solid ${user?.is_verified ? "rgba(74,222,128,0.25)" : "rgba(249,115,22,0.25)"}`,
                  }}>{user?.is_verified ? "✓ Vérifié" : "⏳ En attente"}</span>
                </div>
              </div>
            </div>

            {/* Right — quick actions */}
            <div className="acct-right-col">

              {/* Security card */}
              <div className="acct-card">
                <h2 className="acct-title" style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: "0 0 18px" }}>Sécurité &amp; accès</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <QuickAction href="#" icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  } label="Changer le mot de passe" sub="Dernière modification inconnue" />
                  <QuickAction href="#" icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  } label="Double authentification" sub="Renforcer la sécurité du compte" />
                  <QuickAction href="#" icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  } label="Notifications email" sub="Gérer les alertes et offres" />
                </div>
              </div>

              {/* Activity card */}
              <div className="acct-card">
                <h2 className="acct-title" style={{ color: "#fff", fontSize: 16, fontWeight: 800, margin: "0 0 18px" }}>Mon activité</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <QuickAction href="/products" icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  } label="Comparer des produits" sub="Explorer 50 000+ produits" />
                  <QuickAction href="#" icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                  } label="Mes favoris" sub="Produits sauvegardés" />
                  <QuickAction href="#" icon={
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  } label="Historique des comparaisons" sub="Voir mes recherches récentes" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
