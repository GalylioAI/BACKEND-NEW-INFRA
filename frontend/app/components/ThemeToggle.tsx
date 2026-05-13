"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Changer de thème"
      className="theme-toggle-btn"
      style={{
        width: 50,
        height: 28,
        borderRadius: 999,
        border: dark
          ? "1px solid rgba(204,255,155,0.45)"
          : "1px solid rgba(15,23,42,0.16)",
        cursor: "pointer",
        padding: 3,
        background: dark
          ? "linear-gradient(135deg, rgba(59,222,185,0.35), rgba(204,255,155,0.42))"
          : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,245,249,0.95))",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
        transition: "all 0.25s ease",
        flexShrink: 0,
        boxShadow: dark
          ? "0 6px 14px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.22)"
          : "0 6px 14px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.95)",
      }}
    >
      <style>{`
        .theme-toggle-btn:hover {
          transform: translateY(-1px);
        }
        .theme-toggle-btn:active {
          transform: translateY(0);
        }
        .theme-toggle-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.28), 0 6px 16px rgba(15, 23, 42, 0.2) !important;
        }
      `}</style>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: dark
            ? "linear-gradient(180deg, #0a0f0d, #111827)"
            : "linear-gradient(180deg, #ffffff, #f8fafc)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          transform: dark ? "translateX(22px)" : "translateX(0)",
          transition:
            "transform 0.25s ease, background 0.25s ease, color 0.25s ease",
          boxShadow: dark
            ? "0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)"
            : "0 2px 8px rgba(15,23,42,0.2), inset 0 1px 0 rgba(255,255,255,0.95)",
          color: dark ? "#d1fae5" : "#f59e0b",
        }}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
