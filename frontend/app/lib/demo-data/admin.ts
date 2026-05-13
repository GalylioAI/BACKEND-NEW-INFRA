import {
  deleteAccessRule,
  getAccessRules,
  getPublicAccessRules,
  upsertAccessRule,
} from "./access-rules";
import { listDemoUsers, setDemoUserRole } from "./users";
import type { AccessRulePayload, DashboardRole, UserResponse } from "./types";

export { deleteAccessRule, getAccessRules, getPublicAccessRules };

export function getAdminUsers(_page = 1, _perPage = 20) {
  return listDemoUsers();
}

export async function getAdminUser(userId: string) {
  const users = await listDemoUsers();
  const user = users.find((item) => item.id === userId || item._id === userId);
  if (!user) throw new Error("Demo user not found.");
  return user;
}

export function updateAdminUserRole(userId: string, role: DashboardRole) {
  return setDemoUserRole(userId, role);
}

export async function banUser(
  userId: string,
  is_banned: boolean,
): Promise<UserResponse> {
  const user = await getAdminUser(userId);
  return { ...user, is_banned };
}

export function deleteUser(_userId: string) {
  return Promise.resolve({ message: "Demo user deletion is not destructive." });
}

export function saveAccessRule(payload: AccessRulePayload) {
  return upsertAccessRule(payload);
}

export { upsertAccessRule };
