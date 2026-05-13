import { apiRequest } from "./client";
import { endpoints } from "./endpoints";
import type { MessageResponse, PasswordResetVerifyResponse } from "./types";

export function sendEmailOtp(email: string) {
  return apiRequest<MessageResponse>(endpoints.otp.emailSend, {
    method: "POST",
    body: { email },
  });
}

export function verifyEmailOtp(email: string, code: string) {
  return apiRequest<MessageResponse>(endpoints.otp.emailVerify, {
    method: "POST",
    body: { email, code },
  });
}

export function sendPasswordReset(email: string) {
  return apiRequest<MessageResponse>(endpoints.otp.passwordResetSend, {
    method: "POST",
    body: { email },
  });
}

export function verifyPasswordReset(email: string, code: string) {
  return apiRequest<PasswordResetVerifyResponse>(
    endpoints.otp.passwordResetVerify,
    {
      method: "POST",
      body: { email, code },
    },
  );
}

export function applyPasswordReset(payload: {
  reset_token: string;
  new_password: string;
  new_password_confirm: string;
}) {
  return apiRequest<MessageResponse>(endpoints.otp.passwordResetApply, {
    method: "POST",
    body: payload,
  });
}

export function enableTwoFactor(password: string) {
  return apiRequest<MessageResponse>(endpoints.otp.enable2fa, {
    method: "POST",
    auth: true,
    body: { password },
  });
}

export function verifyEnableTwoFactor(code: string) {
  return apiRequest<MessageResponse>(endpoints.otp.enable2faVerify, {
    method: "POST",
    auth: true,
    body: { code },
  });
}

export function disableTwoFactor(currentPassword: string) {
  return apiRequest<MessageResponse>(endpoints.otp.disable2fa, {
    method: "POST",
    auth: true,
    body: { current_password: currentPassword },
  });
}

export function verifyDisableTwoFactor(code: string) {
  return apiRequest<MessageResponse>(endpoints.otp.disable2faVerify, {
    method: "POST",
    auth: true,
    body: { code },
  });
}
