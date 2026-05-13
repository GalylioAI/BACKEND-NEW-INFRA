"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Globe,
  Users,
  UserCog,
  Shield,
  Save,
  Loader2,
} from "lucide-react";
import { upsertAccessRule } from "@/lib/demo-data/admin";
import { Switch } from "@/components/ui/switch";
import { UserSelector } from "@/components/dashboard/user-selector";
import { cn } from "@/lib/utils";
import { normalizeAccessRulePath } from "@/lib/access-rules";

interface PageAccessCardProps {
  pageName: string;
  pagePath: string;
  category: "Main" | "Dashboard" | "Auth" | "Products" | "Custom";
  initialVisible?: boolean;
  initialRole?: "user" | "admin" | "superadmin" | "both";
  initialSelectedUsers?: string[];
}

export function PageAccessCard({
  pageName,
  pagePath,
  category,
  initialVisible = true,
  initialRole = "both",
  initialSelectedUsers = [],
}: PageAccessCardProps) {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [selectedRole, setSelectedRole] = useState<
    "user" | "admin" | "superadmin" | "both"
  >(initialRole);
  const [selectedUsers, setSelectedUsers] =
    useState<string[]>(initialSelectedUsers);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const allowedRoles = useMemo(() => {
    if (selectedRole === "both") return ["user", "admin"] as const;
    return [selectedRole] as const;
  }, [selectedRole]);

  const handleVisibilityChange = (checked: boolean) => {
    setIsVisible(checked);
    setHasChanges(true);
  };

  const handleRoleChange = (role: "user" | "admin" | "superadmin" | "both") => {
    setSelectedRole(role);
    setHasChanges(true);
  };

  const handleUsersChange = (userIds: string[]) => {
    setSelectedUsers(userIds);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      await upsertAccessRule({
        path: normalizeAccessRulePath(pagePath),
        label: pageName,
        category,
        visible: isVisible,
        allowed_roles: [...allowedRoles],
        allowed_emails: selectedUsers,
      });
      setHasChanges(false);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save access rule",
      );
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Main":
        return "bg-blue-500/10 text-blue-500";
      case "Dashboard":
        return "bg-purple/10 text-purple";
      case "Auth":
        return "bg-emerald-500/10 text-emerald-500";
      case "Products":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
        !isVisible && "opacity-60",
        hasChanges && "ring-2 ring-purple/30",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple via-sky-400 to-emerald-400" />

      {/* Header */}
      <div className="relative mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-foreground">{pageName}</h3>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em]",
                getCategoryColor(category),
              )}
            >
              {category}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{pagePath}</p>
        </div>

        {/* Visibility Switch */}
        <div className="flex flex-col items-end gap-2">
          {isVisible ? (
            <Eye className="size-4 text-emerald-500" />
          ) : (
            <EyeOff className="size-4 text-red-500" />
          )}
          <Switch
            checked={isVisible}
            onCheckedChange={handleVisibilityChange}
          />
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]",
              isVisible
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-red-500/10 text-red-600",
            )}
          >
            {isVisible ? "Visible" : "Hidden"}
          </span>
        </div>
      </div>

      {/* Role Selection */}
      <div className="mb-4 rounded-2xl border border-border bg-background/70 p-3">
        <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          ACCESS CONTROL
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleRoleChange("user")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all",
              selectedRole === "user"
                ? "border-purple bg-purple/10 text-purple"
                : "border-border bg-background text-muted-foreground hover:border-purple/50",
            )}
          >
            <Users className="size-4" />
            Client
          </button>

          <button
            onClick={() => handleRoleChange("admin")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all",
              selectedRole === "admin"
                ? "border-purple bg-purple/10 text-purple"
                : "border-border bg-background text-muted-foreground hover:border-purple/50",
            )}
          >
            <UserCog className="size-4" />
            Admin
          </button>

          <button
            onClick={() => handleRoleChange("superadmin")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all",
              selectedRole === "superadmin"
                ? "border-purple bg-purple/10 text-purple"
                : "border-border bg-background text-muted-foreground hover:border-purple/50",
            )}
          >
            <Shield className="size-4" />
            Superadmin
          </button>

          <button
            onClick={() => handleRoleChange("both")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all col-span-3",
              selectedRole === "both"
                ? "border-purple bg-purple/10 text-purple"
                : "border-border bg-background text-muted-foreground hover:border-purple/50",
            )}
          >
            <Globe className="size-4" />
            Client + Admin
          </button>
        </div>
      </div>

      {/* User-Specific Selection */}
      <div className="mb-4 rounded-2xl border border-border bg-background/70 p-3">
        <UserSelector
          selectedUsers={selectedUsers}
          onUsersChange={handleUsersChange}
        />
      </div>

      {/* Save Button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-sm font-bold text-purple-foreground transition-all hover:bg-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      )}

      {/* Status Indicator */}
      {saveError ? (
        <div className="rounded-xl border border-red-500/15 bg-red-500/6 px-3 py-2 text-xs font-semibold text-red-400">
          {saveError}
        </div>
      ) : (
        !hasChanges && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/6 px-3 py-2 text-xs font-semibold text-muted-foreground">
            <div className="size-2 rounded-full bg-emerald-500" />
            {savedAt ? `Settings saved at ${savedAt}` : "Settings saved"}
          </div>
        )
      )}
    </div>
  );
}
