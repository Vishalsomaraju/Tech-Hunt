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
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[var(--color-border-default)]">
        <h3 className="text-xs font-mono text-[var(--color-text-muted)] tracking-wider">
          SHARED NOTES
        </h3>
      </div>

      {/* Textarea */}
      <textarea
        value={localNotes}
        onChange={handleChange}
        placeholder="Jot down clues, patterns, ideas..."
        className="flex-1 p-3 bg-transparent text-sm text-[var(--color-text-primary)] font-mono resize-none outline-none placeholder:text-[var(--color-text-muted)]/50 min-h-0"
      />
    </div>
  );
}
