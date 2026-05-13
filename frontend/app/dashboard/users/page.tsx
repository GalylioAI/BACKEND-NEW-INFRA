"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Search,
  Shield,
  Users,
  UserCog,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteAdminUser,
  getApiErrorMessage,
  listAdminUsers,
  setAdminUserBan,
  updateAdminUserRole,
  type UserResponse,
  type UserRole,
} from "@/lib/api";

const roleOptions = [
  { value: "user", label: "Client" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Superadmin" },
] as const;

function getDisplayName(user: UserResponse) {
  return user.full_name || user.username || user.email;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    listAdminUsers({ per_page: 100 })
      .then((result) => {
        if (!active) return;
        setUsers(result.items);
      })
      .catch((fetchError) => {
        if (!active) return;
        setError(
          fetchError instanceof Error
            ? getApiErrorMessage(fetchError, fetchError.message)
            : "Unable to load users",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((item) => {
      return [item.email, item.full_name, item.username, item.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [searchQuery, users]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((item) => item.role === "admin").length,
      superadmins: users.filter((item) => item.role === "superadmin").length,
      clients: users.filter((item) => item.role === "user").length,
    };
  }, [users]);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingUserId(userId);
    setError(null);

    try {
      const updatedUser = await updateAdminUserRole(userId, role);
      setUsers((currentUsers) =>
        currentUsers.map((item) => (item.id === userId ? updatedUser : item)),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update user role",
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const handleBanToggle = async (target: UserResponse) => {
    setSavingUserId(target.id);
    setError(null);
    try {
      const updatedUser = await setAdminUserBan(
        target.id,
        !target.is_banned,
        target.is_banned ? undefined : "Banned from admin dashboard",
      );
      setUsers((items) =>
        items.map((item) => (item.id === target.id ? updatedUser : item)),
      );
    } catch (banError) {
      setError(getApiErrorMessage(banError, "Unable to update ban status"));
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDelete = async (target: UserResponse) => {
    if (
      !confirm(`Delete ${target.email}? This action soft-deletes the user.`)
    ) {
      return;
    }
    setSavingUserId(target.id);
    setError(null);
    try {
      await deleteAdminUser(target.id);
      setUsers((items) => items.filter((item) => item.id !== target.id));
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Unable to delete user"));
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-8">
      <DashboardHeader title="Users" />

      <main className="dashboard-main space-y-6">
        <section className="dashboard-card overflow-hidden">
          <div className="dashboard-card-body space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple/20 bg-purple/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-purple">
                  <Shield className="size-3.5" />
                  Superadmin user management
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground md:text-3xl">
                    Manage dashboard access by user
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Promote or restrict users directly from the dashboard. Role
                    changes are sent to the production backend and target-aware
                    role rules are enforced server-side.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4 xl:w-[560px]">
                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Users
                    </span>
                    <Users className="size-4 text-purple" />
                  </div>
                  <strong className="mt-3 block text-2xl font-black text-foreground">
                    {stats.total}
                  </strong>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Clients
                    </span>
                    <UserCog className="size-4 text-blue-500" />
                  </div>
                  <strong className="mt-3 block text-2xl font-black text-foreground">
                    {stats.clients}
                  </strong>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Admins
                    </span>
                    <Shield className="size-4 text-emerald-500" />
                  </div>
                  <strong className="mt-3 block text-2xl font-black text-foreground">
                    {stats.admins}
                  </strong>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Superadmins
                    </span>
                    <CheckCircle2 className="size-4 text-fuchsia-500" />
                  </div>
                  <strong className="mt-3 block text-2xl font-black text-foreground">
                    {stats.superadmins}
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-blue-500" />
                <div>
                  <h4 className="text-sm font-bold text-blue-500">
                    Role changes are live
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-blue-500/80">
                    When you update a role, ban, or delete a user, the backend
                    applies admin/superadmin protections before saving.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <h3 className="dashboard-card-title">All users</h3>
              <p className="dashboard-card-subtitle">
                Search by name, email, or role, then change access with one
                action.
              </p>
            </div>
          </div>

          <div className="dashboard-card-body space-y-4">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search users..."
                className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple/20"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-border bg-background py-14 text-muted-foreground">
                <Loader2 className="mr-2 size-5 animate-spin" />
                Loading users...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl border border-border bg-background py-14 text-sm text-muted-foreground">
                No users match your search.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {filteredUsers.map((item) => {
                  const currentRole = item.role || "user";
                  const isSaving = savingUserId === item.id;

                  return (
                    <article
                      key={item.id || item.email}
                      className="rounded-2xl border border-border bg-background p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-bold text-foreground">
                            {getDisplayName(item)}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.email}
                          </p>
                        </div>
                        <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {currentRole}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {roleOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                item.id &&
                                handleRoleChange(item.id, option.value)
                              }
                              className={
                                `rounded-xl border px-3 py-2 text-xs font-semibold transition-all ` +
                                (currentRole === option.value
                                  ? "border-purple bg-purple/10 text-purple"
                                  : "border-border bg-card text-muted-foreground hover:border-purple/40 hover:text-foreground")
                              }
                              disabled={
                                !item.id ||
                                isSaving ||
                                currentUser?.role !== "superadmin"
                              }
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                          <span>
                            {item.id === currentUser?.id
                              ? "Current account"
                              : item.is_banned
                                ? "Banned"
                                : "Managed"}
                          </span>
                          {isSaving ? (
                            <span className="inline-flex items-center gap-2 text-purple">
                              <Loader2 className="size-3 animate-spin" /> Saving
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-emerald-500">
                              <CheckCircle2 className="size-3" /> Synced
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleBanToggle(item)}
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500"
                            disabled={isSaving || item.id === currentUser?.id}
                          >
                            {item.is_banned ? "Unban" : "Ban"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500"
                            disabled={isSaving || item.id === currentUser?.id}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
