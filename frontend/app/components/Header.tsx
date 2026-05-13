"use client";

import { useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../lib/auth/AuthProvider";

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <a href="/" className="brand-logo-link" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "2px" }}>
      <span className="brand-logo-num"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: compact ? "2rem" : "2.8rem",
          fontWeight: 900,
          letterSpacing: "-3px",
          lineHeight: 1,
        }}
      >
        1111
      </span>
      <span className="brand-logo-tld"
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: compact ? "0.85rem" : "1.1rem",
          fontWeight: 600,
          letterSpacing: "0",
          lineHeight: 1,
          marginTop: "2px",
        }}
      >
        .tn
      </span>
    </a>
  );
}

function LogoutButton({ onClick, fullWidth = false }: { onClick: () => void; fullWidth?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={fullWidth ? "tf-btn-1 light_skew_hover" : undefined}
      style={{
        width: fullWidth ? "100%" : undefined,
        border: fullWidth ? 0 : "1px solid rgba(255,255,255,0.18)",
        background: fullWidth ? undefined : "rgba(255,255,255,0.04)",
        color: "#fff",
        borderRadius: fullWidth ? undefined : 999,
        padding: fullWidth ? undefined : "9px 14px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <div>Deconnexion</div>
    </button>
  );
}

export default function Header() {
  const { status, user, logout } = useAuth();
  const isAuthenticated = status === "authenticated";
  const displayName = user?.full_name || user?.username || user?.email || "Mon compte";

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("mobile-menu-visible");
      }
    };
  }, []);

  const closeMobileMenu = () => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("mobile-menu-visible");
    }
  };
  const toggleMobileMenu = () => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("mobile-menu-visible");
    }
  };
  const handleMobileMenuContentClick: React.MouseEventHandler<HTMLElement> = (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a")) {
      closeMobileMenu();
    }
  };

  const authNav = isAuthenticated ? (
    <li>
      <a href="/compte">Compte</a>
    </li>
  ) : null;

  return (
    <header id="header" className="main-header header header-fixed style-absolute">
      <style>{`
        /* brand logo colors (class-based so light mode can override) */
        .brand-logo-num { color: #ffffff; }
        .brand-logo-tld { color: #3BDEB9; }

        .home-header-logo-box {
          margin-left: 90px;
        }
        .mobile-menu .menu-box {
          width: min(340px, 92vw);
          background: linear-gradient(180deg, #0b1218 0%, #070d12 100%);
          border-right: 1px solid rgba(59, 222, 185, 0.18);
          box-shadow: 24px 0 60px rgba(0, 0, 0, 0.55);
        }
        .mobile-menu {
          pointer-events: none;
        }
        .mobile-menu .menu-backdrop {
          pointer-events: none;
        }
        .mobile-menu-visible .mobile-menu {
          pointer-events: auto;
        }
        .mobile-menu-visible .mobile-menu .menu-backdrop {
          pointer-events: auto;
        }
        .mobile-menu .nav-logo {
          background: rgba(5, 10, 14, 0.9);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 16px;
        }
        .mobile-menu .bottom-canvas {
          padding: 18px 16px 20px;
        }
        .mobile-menu .navigation li > a {
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          margin-bottom: 8px !important;
          padding: 11px 12px;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.25;
        }
        .mobile-menu .navigation li:hover > a,
        .mobile-menu .navigation li.current > a {
          color: #3bdeb9;
          border-color: rgba(59, 222, 185, 0.35);
          background: rgba(59, 222, 185, 0.08);
        }
        .mobile-menu .close-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          cursor: pointer;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          padding: 0;
        }
        .mobile-menu-visible .mobile-menu .close-btn {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        .mobile-menu .close-btn::before {
          display: none;
        }
        .mobile-menu .close-btn svg {
          display: block;
          color: #fff;
        }
        .mobile-menu .close-btn:hover {
          color: #3bdeb9;
          border-color: rgba(59, 222, 185, 0.45);
          background: rgba(59, 222, 185, 0.08);
          opacity: 1;
        }
        .mobile-nav-toggler.mobile-button {
          width: 40px !important;
          height: 40px !important;
          position: relative;
          z-index: 2147483000;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2) !important;
          background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)) !important;
          box-shadow: 0 8px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .mobile-nav-toggler.mobile-button::before,
        .mobile-nav-toggler.mobile-button::after,
        .mobile-nav-toggler.mobile-button span {
          width: 18px;
          height: 2px;
          left: 50%;
          margin-left: -9px;
          border-radius: 2px;
          background: #e5fdf4;
        }
        .mobile-nav-toggler.mobile-button::before {
          transform: translate3d(0, -6px, 0);
        }
        .mobile-nav-toggler.mobile-button::after {
          transform: translate3d(0, 6px, 0);
        }
        .mobile-nav-toggler.mobile-button:hover {
          transform: translateY(-1px);
          border-color: rgba(59,222,185,0.45) !important;
          box-shadow: 0 12px 24px rgba(0,0,0,0.28), 0 0 0 1px rgba(59,222,185,0.14) inset;
        }
        .mobile-nav-toggler.mobile-button:active {
          transform: translateY(0);
        }
        .mobile-nav-toggler.mobile-button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59,222,185,0.32), 0 8px 18px rgba(0,0,0,0.22);
        }
        .mobile-menu-visible .mobile-nav-toggler.mobile-button {
          z-index: 2147483001;
        }
        @media (max-width: 1200px) {
          .home-header-logo-box {
            margin-left: 16px;
          }
        }
        @media (max-width: 991px) {
          .home-header-logo-box {
            margin-left: 0;
          }
          .header-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .header-right-actions {
            padding-right: 56px;
          }
          .mobile-nav-toggler.mobile-button {
            position: relative;
            z-index: 2147483000;
            display: block !important;
            pointer-events: auto;
            touch-action: manipulation;
            min-width: 40px;
            min-height: 40px;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }
        }

        /* ── Light mode overrides ── */
        [data-theme="light"] .brand-logo-num { color: #0a0f0d !important; }
        [data-theme="light"] .brand-logo-tld { color: #5B21B6 !important; }
        [data-theme="light"] .header-lower {
          background: rgba(255,255,255,0.92) !important;
          border-bottom: 1px solid rgba(15,23,42,0.1) !important;
          backdrop-filter: blur(12px) saturate(140%);
        }
        [data-theme="light"] .header-lower .inner-container {
          background: #ffffff !important;
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 14px;
          margin: 8px 12px;
          padding: 10px 14px;
          box-shadow: 0 10px 28px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.05);
        }
        [data-theme="light"] .main-header .navigation > li > a,
        [data-theme="light"] .main-header .navigation li a {
          color: #0f172a !important;
          font-weight: 600;
        }
        [data-theme="light"] .main-header .navigation li > a:hover {
          color: #4c1d95 !important;
        }
        [data-theme="light"] .main-header .navigation li > a .label {
          background: linear-gradient(120deg, #5B21B6, #7C3AED) !important;
          color: #ffffff !important;
          border: 1px solid rgba(76,29,149,0.45);
          box-shadow: 0 4px 12px rgba(91,33,182,0.28);
        }
        [data-theme="light"] .header-right-actions {
          gap: 10px !important;
        }
        [data-theme="light"] .main-header .tf-btn-1 {
          background: linear-gradient(120deg, #5B21B6, #7C3AED) !important;
          color: #ffffff !important;
          border: 1px solid rgba(76,29,149,0.58) !important;
          box-shadow: 0 8px 18px rgba(91,33,182,0.22) !important;
        }
        [data-theme="light"] .main-header .tf-btn-1:hover {
          background: linear-gradient(120deg, #4C1D95, #6D28D9) !important;
          border-color: rgba(76,29,149,0.72) !important;
          transform: translateY(-1px);
        }
        [data-theme="light"] .main-header .mobile-nav-toggler.mobile-button {
          border: 1px solid rgba(15,23,42,0.16) !important;
          border-radius: 10px;
          padding: 8px 10px !important;
          background: linear-gradient(180deg, #ffffff, #f5f7fb) !important;
          position: relative;
          z-index: 2147483000;
          pointer-events: auto !important;
          box-shadow: 0 8px 18px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.95);
        }
        [data-theme="light"] .main-header .mobile-nav-toggler.mobile-button::before,
        [data-theme="light"] .main-header .mobile-nav-toggler.mobile-button::after,
        [data-theme="light"] .main-header .mobile-nav-toggler.mobile-button span {
          background: #475569 !important;
        }
        [data-theme="light"] .main-header .mobile-nav-toggler.mobile-button:hover {
          border-color: rgba(91,33,182,0.3) !important;
          box-shadow: 0 12px 24px rgba(15,23,42,0.16), 0 0 0 1px rgba(91,33,182,0.1) inset;
        }
        [data-theme="light"] .mobile-menu .menu-box {
          background: #ffffff !important;
          border-right: 1px solid rgba(0,0,0,0.08) !important;
          box-shadow: 24px 0 40px rgba(0,0,0,0.12) !important;
        }
        [data-theme="light"] .mobile-menu .nav-logo {
          background: #f8f9f7 !important;
          border-bottom: 1px solid rgba(0,0,0,0.07) !important;
        }
        [data-theme="light"] .mobile-menu .navigation li > a {
          color: rgba(0,0,0,0.75) !important;
          border-color: rgba(0,0,0,0.08) !important;
          background: rgba(0,0,0,0.02) !important;
        }
        [data-theme="light"] .mobile-menu .navigation li:hover > a,
        [data-theme="light"] .mobile-menu .navigation li.current > a {
          color: #5B21B6 !important;
          border-color: rgba(91,33,182,0.25) !important;
          background: rgba(91,33,182,0.06) !important;
        }
        [data-theme="light"] .mobile-menu .close-btn {
          border-color: rgba(0,0,0,0.12) !important;
          background: rgba(0,0,0,0.04) !important;
          color: #0a0f0d !important;
        }
        [data-theme="light"] .mobile-menu .close-btn svg { color: #0a0f0d !important; }
        [data-theme="light"] .mobile-menu .close-btn:hover {
          color: #5B21B6 !important;
          border-color: rgba(91,33,182,0.3) !important;
          background: rgba(91,33,182,0.06) !important;
        }
        @media (max-width: 991px) {
          [data-theme="light"] .mobile-menu {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            padding-right: 0 !important;
            z-index: 999999 !important;
          }
          [data-theme="light"] .mobile-menu .menu-backdrop {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
          }
          [data-theme="light"] .mobile-menu .menu-box {
            position: fixed !important;
            left: -100% !important;
            top: 0 !important;
            width: min(340px, 92vw) !important;
            max-width: min(340px, 92vw) !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            overflow: hidden !important;
          }
          [data-theme="light"] .mobile-menu-visible .mobile-menu .menu-box {
            left: 0 !important;
          }
          [data-theme="light"] .mobile-menu .bottom-canvas {
            height: calc(100dvh - 76px) !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
      <div className="header-lower">
        <div className="inner-container flex justify-space align-center">
          <div className="logo-box flex home-header-logo-box">
            <div className="logo">
              <BrandLogo />
            </div>
          </div>

          <div className="nav-outer flex align-center">
            <nav className="main-menu show navbar-expand-md">
              <div className="navbar-collapse" id="navbarSupportedContent">
                <ul className="navigation">
                  <li>
                    <a href="/products">Catalogue</a>
                  </li>
                  <li>
                    <a href="/electromenager">Electromenager</a>
                  </li>
                  <li>
                    <a href="/parapharmacie">
                      Parapharmacie <span className="label">NEW</span>
                    </a>
                  </li>
                  <li>
                    <a href="/pricing">Tarifs</a>
                  </li>
                  <li>
                    <a href="/solutions">Solutions</a>
                  </li>
                  <li>
                    <a href="/blogs">Blog</a>
                  </li>
                  <li>
                    <a href="/vols" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                      </svg>
                      Vols
                      <span className="label" style={{ background: "linear-gradient(90deg,#3BDEB9,#CCFF9B)", color: "#000" }}>LIVE</span>
                    </a>
                  </li>
                  {authNav}
                </ul>
              </div>
            </nav>
          </div>

          <div className="header-right">
            <div className="header-right-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ThemeToggle />
              <div className="flat-bt-top sc-btn-top d-lg-flex d-none">
                {isAuthenticated ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <a href="/compte" className="tf-btn-1 light_skew_hover" title={displayName}>
                      <div>Mon compte</div>
                    </a>
                    <LogoutButton onClick={logout} />
                  </div>
                ) : (
                  <a href="/connexion" className="tf-btn-1 light_skew_hover">
                    <div>Connexion</div>
                  </a>
                )}
              </div>
            </div>
            <button
              type="button"
              className="mobile-nav-toggler mobile-button"
              aria-label="Ouvrir le menu mobile"
              onClick={toggleMobileMenu}
              style={{ border: "none", background: "transparent" }}
            >
              <span></span>
            </button>
          </div>
        </div>
      </div>

      <div className="mobile-menu">
        <div className="menu-backdrop" onClick={closeMobileMenu}></div>
        <nav className="menu-box" onClick={handleMobileMenuContentClick}>
          <div className="nav-logo">
            <BrandLogo compact />
            <button type="button" className="close-btn" aria-label="Fermer le menu" onClick={closeMobileMenu}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="bottom-canvas">
            <div className="menu-outer">
              <div className="navbar-collapse">
                <ul className="navigation">
                  <li>
                    <a href="/products">Catalogue</a>
                  </li>
                  <li>
                    <a href="/electromenager">Electromenager</a>
                  </li>
                  <li>
                    <a href="/parapharmacie">Parapharmacie</a>
                  </li>
                  <li>
                    <a href="/pricing">Tarifs</a>
                  </li>
                  <li>
                    <a href="/solutions">Solutions</a>
                  </li>
                  <li>
                    <a href="/blogs">Blog</a>
                  </li>
                  <li>
                    <a href="/vols">Vols Live</a>
                  </li>
                  {authNav}
                </ul>
              </div>
            </div>
            {isAuthenticated ? (
              <LogoutButton onClick={logout} fullWidth />
            ) : (
              <a href="/connexion" className="tf-btn-1 light_skew_hover">
                <div>Connexion</div>
              </a>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
