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

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: "border-[var(--color-neon-cyan)]/50 text-[var(--color-neon-cyan)]",
  success: "border-[var(--color-neon-green)]/50 text-[var(--color-neon-green)]",
  error: "border-[var(--color-error)]/50 text-[var(--color-error)]",
  warning: "border-[var(--color-neon-amber)]/50 text-[var(--color-neon-amber)]",
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
      className={`flex items-center gap-2 px-4 py-3 rounded-lg border bg-[var(--color-bg-surface)]/95 backdrop-blur-sm text-sm font-mono shadow-lg animate-in slide-in-from-top-2 ${VARIANT_STYLES[toast.variant]}`}
      role="alert"
    >
      <span className="text-base">{VARIANT_ICONS[toast.variant]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity text-xs"
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
      {/* Toast container — fixed top-center */}
      {toasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-auto">
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
