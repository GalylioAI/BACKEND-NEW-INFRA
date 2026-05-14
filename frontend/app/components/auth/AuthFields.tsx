"use client";

import type { CSSProperties, ReactNode } from "react";

type AlertTone = "error" | "success" | "info";

const alertToneStyles: Record<AlertTone, CSSProperties> = {
  error: {
    background: "rgba(255,76,76,0.1)",
    border: "1px solid rgba(255,76,76,0.28)",
    color: "#ffb4b4",
  },
  success: {
    background: "rgba(59,222,185,0.1)",
    border: "1px solid rgba(59,222,185,0.25)",
    color: "#9ff5df",
  },
  info: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.72)",
  },
};

export function AuthAlert({
  tone,
  children,
  style,
}: {
  tone: AlertTone;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className="auth-alert"
      style={{
        ...alertToneStyles[tone],
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FieldErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p
      style={{
        margin: "7px 0 0",
        color: "#ffb4b4",
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.4,
      }}
    >
      {children}
    </p>
  );
}

export function OtpCodeInput({
  value,
  onChange,
  disabled,
  error,
  autoFocus = false,
  label = "Code",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
  label?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "rgba(255,255,255,0.52)",
          textTransform: "uppercase",
          letterSpacing: 1,
          display: "block",
          marginBottom: 8,
        }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus={autoFocus}
        placeholder="000000"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className="auth-input"
        style={{
          textAlign: "center",
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 8,
          fontVariantNumeric: "tabular-nums",
        }}
      />
      <FieldErrorText>{error}</FieldErrorText>
    </label>
  );
}
