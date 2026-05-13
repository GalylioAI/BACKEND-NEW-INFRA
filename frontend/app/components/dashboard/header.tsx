"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ExternalLink,
  LogIn,
  LogOut,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardHeaderProps {
  title: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [imgError, setImgError] = useState(false);
  const isSettingsPage = pathname === "/dashboard/parametre";
  const avatarSrc =
    !imgError && user?.picture ? user.picture : !imgError ? "/avatar.jpg" : "";
  const displayName =
    user?.full_name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Utilisateur";

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-copy">
        <div className="dashboard-header-kicker">1111.tn cockpit</div>
        <h1 className="dashboard-header-title">{title}</h1>
        <div className="dashboard-header-meta">
          {user
            ? `Connecte en tant que ${user.role || "utilisateur"}`
            : "Mode public, acces lecture seule"}
        </div>
      </div>

      <div className="dashboard-header-searchWrap">
        <div className="dashboard-search">
          <Search />
          <input
            type="text"
            placeholder="Rechercher un store, une categorie ou un produit"
          />
        </div>
        <div className="dashboard-search-caption">
          Acces rapide aux signaux marche, veille produits et benchmark pricing.
        </div>
      </div>

      <div className="dashboard-header-actions">
        <Link href="/" className="dashboard-site-link">
          <ExternalLink />
          <span>Site public</span>
        </Link>

        <Link
          href="/dashboard/parametre"
          className={`dashboard-icon-button${isSettingsPage ? " is-active" : ""}`}
          aria-label="Parametres"
        >
          <Settings />
        </Link>

        <button
          type="button"
          className="dashboard-icon-button relative"
          aria-label="Notifications"
        >
          <Bell />
          <span className="dashboard-notification-dot">2</span>
        </button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="dashboard-avatar-button"
                aria-label="Menu utilisateur"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className="dashboard-avatar-image"
                    onError={() => setImgError(true)}
                  />
                ) : user.email ? (
                  user.email.charAt(0).toUpperCase()
                ) : (
                  <User />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="size-10 overflow-hidden rounded-full bg-muted flex items-center justify-center">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      className="size-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <User className="size-5" />
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-semibold truncate">
                    {displayName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/parametre"
                  className="flex w-full items-center gap-2"
                >
                  <User className="size-4" />
                  <span>Modifier le profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="flex cursor-pointer items-center gap-2"
              >
                <LogOut className="size-4" />
                <span>Se deconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/connexion?redirect=/dashboard"
            className="dashboard-login-link"
          >
            <LogIn />
            <span>Connexion</span>
          </Link>
        )}
      </div>
    </header>
  );
}
