// ============================================================================
// TECH HUNT — Toast Notification System
// Provides a ToastProvider + useToast() hook for ephemeral notifications.
// Toasts auto-dismiss after a configurable duration.
// ============================================================================

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastVariant = "info" | "success" | "error" | "warning";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  addToast: (
    message: string,
    variant?: ToastVariant,
    duration?: number,
  ) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const VARIANT_COLORS: Record<ToastVariant, string> = {
  info: "var(--accent)",
  success: "var(--success)",
  error: "var(--danger)",
  warning: "var(--warning)",
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  info: "ℹ",
  success: "✓",
  error: "✕",
  warning: "⚠",
};

// ─── Toast Item ──────────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className="panel border-glow animate-fade-in font-mono"
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        borderLeft: `3px solid ${VARIANT_COLORS[toast.variant]}`,
        maxWidth: "320px",
        fontSize: "13px",
        color: "var(--text-primary)",
      }}
    >
      <span style={{ fontSize: "14px", color: VARIANT_COLORS[toast.variant] }}>
        {VARIANT_ICONS[toast.variant]}
      </span>
      <span className="flex-1" style={{ lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          color: "var(--text-dim)",
          cursor: "pointer",
          background: "none",
          border: "none",
          fontSize: "11px",
          opacity: 0.6,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration = 4000) => {
      const id = ++nextId;
      setToasts((prev) => [
        ...prev.slice(-4),
        { id, message, variant, duration },
      ]);
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container — fixed bottom-right */}
      {toasts.length > 0 && (
        <div
          className="pointer-events-auto"
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
