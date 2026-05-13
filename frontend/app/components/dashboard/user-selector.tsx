"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, X, Search, Check } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getAdminUsers } from "@/lib/api/admin"
import { cn } from "@/lib/utils"

type SelectorRole = "client" | "admin" | "superadmin" | "both"

interface User {
    id: string
    name: string
    email: string
    role: "client" | "admin" | "superadmin"
}

interface UserSelectorProps {
    selectedUsers: string[]
    onUsersChange: (userIds: string[]) => void
    filterRole?: SelectorRole
}

export function UserSelector({ selectedUsers, onUsersChange, filterRole = "both" }: UserSelectorProps) {
    const { token } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            setUsers([])
            return
        }

        let active = true
        setLoading(true)
        setLoadError(null)

        getAdminUsers(token)
            .then((items) => {
                if (!active) return
                setUsers(items.map((item) => ({
                    id: item._id || item.email,
                    name: item.full_name || item.username || item.email,
                    email: item.email,
                    role: (item.role as User["role"]) || "client",
                })))
            })
            .catch((error) => {
                if (!active) return
                setLoadError(error instanceof Error ? error.message : "Impossible de charger les utilisateurs")
            })
            .finally(() => {
                if (!active) return
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [token])

    const allowedRoles = useMemo(() => {
        if (filterRole === "both") return ["client", "admin", "superadmin"] as const
        return [filterRole] as const
    }, [filterRole])

    // Filter users based on role and search
    const filteredUsers = users.filter((user) => {
        const matchesRole = filterRole === "both" || allowedRoles.includes(user.role) || selectedUsers.includes(user.email)
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesRole && matchesSearch
    })

    const toggleUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            onUsersChange(selectedUsers.filter((id) => id !== userId))
        } else {
            onUsersChange([...selectedUsers, userId])
        }
    }

    const removeUser = (userId: string) => {
        onUsersChange(selectedUsers.filter((id) => id !== userId))
    }

    const selectedUserObjects = users.filter((user) => selectedUsers.includes(user.email))

    return (
        <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
                SPECIFIC USERS {filterRole !== "both" && `(${filterRole.toUpperCase()})`}
            </label>

            {/* Selected Users Display */}
            {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedUserObjects.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center gap-1.5 rounded-full bg-purple/10 px-3 py-1 text-xs font-medium text-purple"
                        >
                            <span>{user.name}</span>
                            <button
                                onClick={() => removeUser(user.email)}
                                className="hover:text-purple/70"
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Users Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-purple/50 hover:text-foreground"
            >
                <Users className="size-4" />
                {selectedUsers.length > 0 ? "Modify Users" : "Add Specific Users"}
            </button>

            {/* User Selection Dropdown */}
            {isOpen && (
                <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                    {/* Search */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple/20"
                        />
                    </div>

                    {/* User List */}
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                        {loading ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">Loading users...</div>
                        ) : loadError ? (
                            <div className="py-4 text-center text-sm text-red-500">{loadError}</div>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => {
                                const isSelected = selectedUsers.includes(user.email)
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => toggleUser(user.email)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all",
                                            isSelected
                                                ? "bg-purple/10 text-purple"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    "rounded-full px-2 py-0.5 text-xs font-medium",
                                                    user.role === "superadmin"
                                                        ? "bg-fuchsia-500/10 text-fuchsia-500"
                                                        : user.role === "admin"
                                                        ? "bg-purple/10 text-purple"
                                                        : "bg-blue-500/10 text-blue-500"
                                                )}
                                            >
                                                {user.role}
                                            </span>
                                            {isSelected && <Check className="size-4 text-purple" />}
                                        </div>
                                    </button>
                                )
                            })
                        ) : (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                No users found
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2 border-t border-border pt-3">
                        <button
                            onClick={() => {
                                onUsersChange([])
                                setIsOpen(false)
                            }}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex-1 rounded-lg bg-purple px-3 py-1.5 text-xs font-semibold text-purple-foreground hover:bg-purple/90"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
