import { demoAsync, nowIso } from "./async";
import { readJson, writeJson } from "./storage";
import type { AccessRule, AccessRulePayload } from "./types";

const ACCESS_RULES_KEY = "1111.demo.access-rules";

const seededRules: AccessRule[] = [
  {
    _id: "rule-dashboard",
    path: "/dashboard/*",
    label: "Dashboard",
    category: "Dashboard",
    visible: true,
    allowed_roles: ["admin", "superadmin"],
    allowed_emails: [],
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
  },
  {
    _id: "rule-superadmin",
    path: "/dashboard/accessibility-control",
    label: "Accessibility Control",
    category: "Dashboard",
    visible: true,
    allowed_roles: ["superadmin"],
    allowed_emails: [],
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
  },
];

function readRules() {
  return readJson<AccessRule[]>(ACCESS_RULES_KEY, seededRules);
}

function writeRules(rules: AccessRule[]) {
  writeJson(ACCESS_RULES_KEY, rules);
}

export function getAccessRules() {
  return demoAsync(readRules());
}

export function getPublicAccessRules() {
  return getAccessRules();
}

export function upsertAccessRule(payload: AccessRulePayload) {
  const now = nowIso();
  const normalizedPath = payload.path.trim().startsWith("/")
    ? payload.path.trim()
    : `/${payload.path.trim()}`;
  const rule: AccessRule = {
    _id: `rule-${normalizedPath.replace(/[^a-z0-9]/gi, "-")}`,
    path: normalizedPath,
    label: payload.label,
    category: payload.category || "Custom",
    visible: payload.visible ?? true,
    allowed_roles: payload.allowed_roles || [],
    allowed_emails: payload.allowed_emails || [],
    created_at: now,
    updated_at: now,
  };
  const rules = readRules().filter((item) => item.path !== rule.path);
  writeRules([...rules, rule]);
  return demoAsync(rule);
}

export function deleteAccessRule(path: string) {
  writeRules(readRules().filter((rule) => rule.path !== path));
  return demoAsync({ message: "Demo access rule deleted." });
}
