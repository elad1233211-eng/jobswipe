"use client";

// global-error replaces the root layout when a top-level error happens,
// so it must define <html> and <body> itself.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💥</div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            תקלה חמורה
          </h1>
          <p style={{ color: "#475569", marginBottom: "1.5rem" }}>
            אירעה שגיאה לא צפויה. נסו לרענן את הדף.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                marginBottom: "1.5rem",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              קוד: {error.digest}
            </p>
          )}
          <button
            onClick={() => unstable_retry()}
            style={{
              background: "linear-gradient(to right, #ec4899, #8b5cf6)",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "1rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            ניסיון נוסף
          </button>
        </div>
      </body>
    </html>
  );
}
