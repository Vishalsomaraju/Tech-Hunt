// ============================================================================
// TECH HUNT — 404 Not Found Page
// ============================================================================

import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <h1 className="text-7xl font-mono font-bold gradient-text mb-4">404</h1>
        <p className="text-lg text-[var(--color-text-muted)] font-mono mb-8">
          This room doesn't exist in the building.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-primary !w-auto !px-8 font-mono tracking-wider"
        >
          RETURN TO BASE
        </button>
      </div>
    </div>
  );
}
