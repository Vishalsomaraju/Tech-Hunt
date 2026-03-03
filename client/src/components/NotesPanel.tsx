// ============================================================================
// TECH HUNT — Notes Panel Component
// Shared notepad. Debounced updates (500ms) via GameContext.updateNotes.
// Conflict resolution: remote updates are suppressed while local user is
// actively typing (within 1 s of last keystroke). A queued remote update
// is applied once the user stops typing.
// ============================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useGame } from "../contexts/GameContext";

/** How long after the last local keystroke before we accept remote notes. */
const TYPING_GUARD_MS = 1000;

export function NotesPanel() {
  const { state, updateNotes } = useGame();

  // Local draft — drives the textarea value.
  const [localNotes, setLocalNotes] = useState(state.notes);
  const lastTypedRef = useRef<number>(0);
  const pendingRemoteRef = useRef<string | null>(null);

  // Sync local draft when remote notes arrive IF user is NOT typing.
  useEffect(() => {
    const msSinceTyped = Date.now() - lastTypedRef.current;
    if (msSinceTyped > TYPING_GUARD_MS) {
      // Safe to accept remote update immediately
      setLocalNotes(state.notes);
      pendingRemoteRef.current = null;
    } else {
      // User is typing — queue the remote payload
      pendingRemoteRef.current = state.notes;
    }
  }, [state.notes]);

  // Flush queued remote update once user stops typing
  useEffect(() => {
    if (pendingRemoteRef.current === null) return;
    const remaining = TYPING_GUARD_MS - (Date.now() - lastTypedRef.current);
    const timer = setTimeout(
      () => {
        if (pendingRemoteRef.current !== null) {
          setLocalNotes(pendingRemoteRef.current);
          pendingRemoteRef.current = null;
        }
      },
      Math.max(0, remaining),
    );
    return () => clearTimeout(timer);
  }, [state.notes]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      lastTypedRef.current = Date.now();
      pendingRemoteRef.current = null; // discard any queued remote
      setLocalNotes(value);
      updateNotes(value);
    },
    [updateNotes],
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-panel)" }}
    >
      {/* Header */}
      <div
        className="font-mono shrink-0"
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
          color: "var(--text-muted)",
          height: "40px",
          display: "flex",
          alignItems: "center",
        }}
      >
        NOTES
      </div>

      {/* Textarea */}
      <textarea
        value={localNotes}
        onChange={handleChange}
        placeholder="Jot down clues, patterns, ideas..."
        className="input-base flex-1 min-h-0"
        style={{
          resize: "none",
          fontSize: "13px",
          lineHeight: 1.6,
          padding: "14px",
          borderRadius: 0,
          border: "none",
          fontFamily: "var(--font-sans)",
        }}
      />

      {/* Sync indicator */}
      <div
        className="shrink-0 font-mono"
        style={{
          fontSize: "10px",
          color: "var(--text-dim)",
          padding: "6px 12px",
          borderTop: "1px solid var(--border)",
        }}
      >
        synced
      </div>
    </div>
  );
}
