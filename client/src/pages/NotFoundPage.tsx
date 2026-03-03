// ============================================================================
// TECH HUNT — 404 Not Found Page
// ============================================================================

import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-base)", padding: "var(--space-xl)" }}
    >
      <div className="text-center animate-fade-in">
        <h1
          className="font-mono gradient-text"
          style={{ fontSize: "72px", fontWeight: 700, marginBottom: "16px" }}
        >
          404
        </h1>
        <p
          className="font-mono"
          style={{
            fontSize: "15px",
            color: "var(--text-muted)",
            marginBottom: "32px",
          }}
        >
          This room doesn't exist in the building.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-primary font-mono"
          style={{
            width: "auto",
            padding: "12px 32px",
            fontSize: "13px",
            letterSpacing: "0.15em",
          }}
        >
          RETURN TO BASE
        </button>
      </div>
    </div>
  );
}
