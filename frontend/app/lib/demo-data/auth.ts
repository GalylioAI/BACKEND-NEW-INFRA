import { demoAsync } from "./async";
import { DemoDataError } from "./errors";
import { removeItem, writeJson } from "./storage";
import {
  SESSION_KEY,
  createDemoUser,
  getPublicUserById,
  updateDemoPassword,
  updateDemoUser,
  verifyCredentials,
} from "./users";
import type {
  ChangePasswordPayload,
  UserCreate,
  UserLogin,
  UserProfileUpdate,
} from "./types";

const RESET_KEY = "1111.demo.password-reset";

export function signinUser(payload: UserLogin) {
  const identifier = payload.email || payload.identifier || "";
  const user = verifyCredentials(identifier, payload.password);
  writeJson(SESSION_KEY, user.id);
  return demoAsync(user);
}

export function signupUser(payload: UserCreate) {
  const user = createDemoUser(payload);
  return demoAsync({ user_id: user.id, email: user.email });
}

export function getCurrentUser(userId: string | null) {
  if (!userId)
    return Promise.reject(
      new DemoDataError("No demo user is signed in.", "DEMO_NOT_SIGNED_IN"),
    );
  const user = getPublicUserById(userId);
  if (!user)
    return Promise.reject(
      new DemoDataError("Demo session expired.", "DEMO_SESSION_EXPIRED"),
    );
  return demoAsync(user);
}

export function updateProfile(userId: string, payload: UserProfileUpdate) {
  return demoAsync(updateDemoUser(userId, payload));
}

export function changePassword(userId: string, payload: ChangePasswordPayload) {
  updateDemoPassword(userId, payload.current_password, payload.new_password);
  return demoAsync({ message: "Demo password updated." });
}

export function deleteAccount(userId: string) {
  removeItem(SESSION_KEY);
  return demoAsync({ message: `Demo account ${userId} signed out.` });
}

export function requestPasswordReset(email: string) {
  writeJson(RESET_KEY, { email, code: "111111", createdAt: Date.now() });
  return demoAsync({ message: "Demo reset code is 111111." });
}

export function verifyPasswordResetCode(email: string, code: string) {
  if (code !== "111111")
    return Promise.reject(
      new DemoDataError("Demo reset code is 111111.", "DEMO_BAD_RESET_CODE"),
    );
  return demoAsync({ resetProof: `demo-reset-${email}` });
}

export function applyPasswordReset(
  _resetToken: string,
  _newPassword: string,
  _newPasswordConfirm: string,
) {
  return demoAsync({ message: "Demo password reset completed." });
}

export function sendEmailVerification() {
  return demoAsync({ message: "Demo verification code is 111111." });
}

export function verifyEmail(_code: string) {
  return demoAsync({ is_verified: true });
}

export function logoutUser() {
  removeItem(SESSION_KEY);
  return demoAsync({ message: "Signed out of demo session." });
}

export function logoutAllSessions() {
  removeItem(SESSION_KEY);
  return demoAsync({ message: "All demo sessions cleared." });
}

export function getGouvernorats() {
  return demoAsync([
    { id: 1, name: "Tunis" },
    { id: 2, name: "Ariana" },
    { id: 3, name: "Ben Arous" },
    { id: 4, name: "Nabeul" },
    { id: 5, name: "Sousse" },
    { id: 6, name: "Sfax" },
  ]);
}
