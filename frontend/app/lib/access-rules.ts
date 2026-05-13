import type { AccessRule, DashboardRole } from "@/lib/demo-data/types";
import type { UserResponse } from "@/lib/api/types";

function normalizePath(path: string) {
  if (!path) return "/";
  let normalized = path.trim();
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.length > 1) normalized = normalized.replace(/\/+$/, "");
  return normalized || "/";
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchesAccessRulePath(pattern: string, pathname: string) {
  const normalizedPattern = normalizePath(pattern);
  const normalizedPathname = normalizePath(pathname);

  if (normalizedPattern === normalizedPathname) return true;

  if (normalizedPattern.endsWith("/*")) {
    const prefix = normalizedPattern.slice(0, -1);
    return normalizedPathname.startsWith(prefix);
  }

  if (normalizedPattern.includes("[")) {
    const regexPattern = normalizedPattern
      .split("/")
      .map((segment) => {
        if (!segment) return "";
        if (/^\[\.\.\..+\]$/.test(segment)) return ".+";
        if (/^\[.+\]$/.test(segment)) return "[^/]+";
        return escapeRegex(segment);
      })
      .join("/");

    return new RegExp(`^${regexPattern}$`).test(normalizedPathname);
  }

  return false;
}

function scoreAccessRulePath(pattern: string) {
  const normalized = normalizePath(pattern);
  const segments = normalized.split("/").filter(Boolean);
  const exactSegments = segments.filter(
    (segment) => !segment.includes("[") && segment !== "*",
  ).length;
  const dynamicSegments = segments.filter((segment) =>
    segment.includes("["),
  ).length;
  const wildcardPenalty = normalized.endsWith("/*") ? 1 : 0;
  return exactSegments * 100 + dynamicSegments * 10 - wildcardPenalty;
}

export function findActiveAccessRule(rules: AccessRule[], pathname: string) {
  const dedupedRules = Array.from(
    rules
      .reduce((map, rule) => {
        const normalizedPath = normalizePath(rule.path);
        const current = map.get(normalizedPath);
        const currentUpdatedAt = current?.updated_at
          ? Date.parse(current.updated_at) || 0
          : 0;
        const nextUpdatedAt = rule.updated_at
          ? Date.parse(rule.updated_at) || 0
          : 0;

        if (!current || nextUpdatedAt >= currentUpdatedAt) {
          map.set(normalizedPath, { ...rule, path: normalizedPath });
        }

        return map;
      }, new Map<string, AccessRule>())
      .values(),
  );

  return (
    dedupedRules
      .filter((rule) => matchesAccessRulePath(rule.path, pathname))
      .sort(
        (left, right) =>
          scoreAccessRulePath(right.path) - scoreAccessRulePath(left.path),
      )[0] || null
  );
}

export function canUserAccessRule(
  rule: AccessRule | null,
  user: UserResponse | null,
) {
  if (!rule) return true;

  const allowedRoles = rule.allowed_roles || [];
  const allowedEmails = (rule.allowed_emails || []).map((email) =>
    email.toLowerCase(),
  );

  if (user?.role === "superadmin") return true;
  if (!rule.visible) return false;
  if (user?.email && allowedEmails.includes(user.email.toLowerCase()))
    return true;
  if (allowedRoles.length === 0 && allowedEmails.length === 0) return true;
  if (!user) return false;

  const userRole = (user.role || "user") as DashboardRole;
  return allowedRoles.includes(userRole);
}

export function normalizeAccessRulePath(path: string) {
  return normalizePath(path);
}
