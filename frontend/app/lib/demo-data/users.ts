import { demoAsync, nowIso } from "./async";
import { DemoDataError } from "./errors";
import { readJson, writeJson } from "./storage";
import type { DashboardRole, UserCreate, UserResponse } from "./types";

type DemoUser = UserResponse & { password: string };

const USERS_KEY = "1111.demo.users";
export const SESSION_KEY = "1111.demo.session.userId";
export const DEMO_PASSWORD = "demo1234";

const seededUsers: DemoUser[] = [
  {
    _id: "demo-client",
    id: "demo-client",
    email: "client@1111.tn",
    password: DEMO_PASSWORD,
    role: "client",
    full_name: "Client Demo",
    username: "client-demo",
    phone: "+216 20 111 111",
    address: "Tunis",
    picture: null,
    is_verified: true,
    is_banned: false,
    created_at: "2026-01-01T08:00:00.000Z",
  },
  {
    _id: "demo-admin",
    id: "demo-admin",
    email: "admin@1111.tn",
    password: DEMO_PASSWORD,
    role: "admin",
    full_name: "Admin Demo",
    username: "admin-demo",
    phone: "+216 21 111 111",
    address: "Ariana",
    picture: null,
    is_verified: true,
    is_banned: false,
    created_at: "2026-01-02T08:00:00.000Z",
  },
  {
    _id: "demo-superadmin",
    id: "demo-superadmin",
    email: "superadmin@1111.tn",
    password: DEMO_PASSWORD,
    role: "superadmin",
    full_name: "Superadmin Demo",
    username: "superadmin-demo",
    phone: "+216 22 111 111",
    address: "La Marsa",
    picture: null,
    is_verified: true,
    is_banned: false,
    created_at: "2026-01-03T08:00:00.000Z",
  },
];

function publicUser(user: DemoUser): UserResponse {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function readUsers() {
  return readJson<DemoUser[]>(USERS_KEY, seededUsers);
}

export function writeUsers(users: DemoUser[]) {
  writeJson(USERS_KEY, users);
}

export function findUserById(userId: string) {
  return (
    readUsers().find((user) => user.id === userId || user._id === userId) ||
    null
  );
}

export function getPublicUserById(userId: string) {
  const user = findUserById(userId);
  return user ? publicUser(user) : null;
}

export function verifyCredentials(identifier: string, password: string) {
  const normalized = identifier.trim().toLowerCase();
  const user = readUsers().find(
    (item) =>
      item.email.toLowerCase() === normalized ||
      item.username?.toLowerCase() === normalized,
  );
  if (!user || user.password !== password || user.is_banned) {
    throw new DemoDataError(
      "Demo login failed. Use client@1111.tn, admin@1111.tn, or superadmin@1111.tn with demo1234.",
      "INVALID_DEMO_LOGIN",
    );
  }
  return publicUser(user);
}

export function createDemoUser(payload: UserCreate) {
  const users = readUsers();
  const email = payload.email.trim().toLowerCase();
  if (users.some((user) => user.email.toLowerCase() === email)) {
    throw new DemoDataError(
      "This demo email already exists.",
      "DEMO_EMAIL_EXISTS",
    );
  }

  const user: DemoUser = {
    _id: `demo-user-${Date.now()}`,
    id: `demo-user-${Date.now()}`,
    email,
    password: payload.password,
    role: payload.role || "client",
    full_name: payload.full_name,
    username: payload.username || email.split("@")[0],
    phone: payload.phone || null,
    address: payload.address || null,
    gouvernorat_id: payload.gouvernorat_id ?? null,
    picture: null,
    is_verified: true,
    is_banned: false,
    created_at: nowIso(),
  };

  writeUsers([user, ...users]);
  return publicUser(user);
}

export function updateDemoUser(userId: string, patch: Partial<UserResponse>) {
  const users = readUsers();
  const index = users.findIndex(
    (user) => user.id === userId || user._id === userId,
  );
  if (index === -1)
    throw new DemoDataError("Demo user not found.", "DEMO_USER_NOT_FOUND");

  const nextUser: DemoUser = {
    ...users[index],
    ...patch,
    id: users[index].id,
    _id: users[index]._id,
    email: users[index].email,
  };
  const nextUsers = [...users];
  nextUsers[index] = nextUser;
  writeUsers(nextUsers);
  return publicUser(nextUser);
}

export function updateDemoPassword(
  userId: string,
  currentPassword: string,
  nextPassword: string,
) {
  const user = findUserById(userId);
  if (!user)
    throw new DemoDataError("Demo user not found.", "DEMO_USER_NOT_FOUND");
  if (user.password !== currentPassword)
    throw new DemoDataError(
      "Current password is incorrect for this demo account.",
      "DEMO_BAD_PASSWORD",
    );
  return setDemoPassword(user.id, nextPassword);
}

function setDemoPassword(userId: string, password: string) {
  const users = readUsers();
  const next = users.map((user) =>
    user.id === userId || user._id === userId ? { ...user, password } : user,
  );
  writeUsers(next);
  const user = next.find((item) => item.id === userId || item._id === userId);
  if (!user)
    throw new DemoDataError("Demo user not found.", "DEMO_USER_NOT_FOUND");
  return publicUser(user);
}

export function listDemoUsers() {
  return demoAsync(readUsers().map(publicUser));
}

export function setDemoUserRole(userId: string, role: DashboardRole) {
  return demoAsync(updateDemoUser(userId, { role }));
}
