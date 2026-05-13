export default function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 20% 20%, rgba(86,180,233,0.16), transparent 42%), radial-gradient(circle at 80% 10%, rgba(204,121,167,0.14), transparent 40%), #0a0a0f",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 60%, rgba(255,255,255,0.06), transparent 55%)",
          animation: "routeLoaderPulse 1.8s ease-in-out infinite",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "20px 24px",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(18,18,28,0.72)",
          boxShadow: "0 14px 34px rgba(0,0,0,0.35)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            padding: "8px 14px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 0 22px rgba(255,255,255,0.12)",
            animation: "routeLogoFloat 2.4s ease-in-out infinite",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 2,
          }}
          aria-label="1111.tn"
        >
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "2rem",
              fontWeight: 900,
              letterSpacing: "-2px",
              color: "#ffffff",
              lineHeight: 1,
            }}
          >
            1111
          </span>
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#a5b4fc",
              lineHeight: 1,
              marginBottom: 1,
            }}
          >
            .tn
          </span>
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.2)",
            borderTopColor: "#ffffff",
            animation: "routeLoaderSpin 0.9s linear infinite",
          }}
        />
        <p
          style={{
            margin: 0,
            color: "rgba(255,255,255,0.9)",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Chargement...
        </p>
      </div>

      <style>{`
        @keyframes routeLoaderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes routeLoaderPulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        @keyframes routeLogoFloat {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.02); }
          100% { transform: translateY(0px) scale(1); }
        }
      `}</style>
    </div>
  );
}
