// ============================================================================
// TECH HUNT — Chat Panel Component
// Real-time team chat. Messages arrive via CHAT_MESSAGE socket event.
// Sends via SEND_CHAT. Auto-scrolls only when user is near bottom.
// Caps messages at 200 to prevent memory bloat.
// ============================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useGame } from "../contexts/GameContext";
import { useAuth } from "../contexts/AuthContext";

const MAX_MESSAGES = 200;

export function ChatPanel() {
  const { state, sendChat } = useGame();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Track if user is scrolled near bottom
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 80;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Auto-scroll on new messages — only if user was near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [state.chat.length]);

  // Cap displayed messages
  const messages = state.chat.slice(-MAX_MESSAGES);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    sendChat(trimmed);
    setMessage("");
    // Force scroll to bottom on own message
    isNearBottomRef.current = true;
  };

  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[var(--color-border-default)]">
        <h3 className="text-xs font-mono text-[var(--color-text-muted)] tracking-wider">
          TEAM CHAT
        </h3>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
      >
        {messages.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-8 font-mono">
            No messages yet
          </p>
        )}
        {messages.map((msg, i) => {
          // System messages (senderId === null)
          if (!msg.senderId) {
            return (
              <div
                key={i}
                className="text-center text-[10px] text-[var(--color-text-muted)] font-mono py-1"
              >
                {msg.message}
              </div>
            );
          }

          const isMe = msg.senderId === user?.id;
          return (
            <div
              key={i}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono mb-0.5">
                {msg.senderName}
              </span>
              <div
                className={`px-3 py-1.5 rounded-lg text-sm max-w-[85%] ${
                  isMe
                    ? "bg-[var(--color-neon-cyan)]/10 text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan)]/20"
                    : "bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-default)]"
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-3 border-t border-[var(--color-border-default)]"
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input-field flex-1 !py-2 text-sm"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-3 py-2 rounded-lg bg-[var(--color-neon-cyan)]/10 text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan)]/30 hover:bg-[var(--color-neon-cyan)]/20 transition-colors disabled:opacity-30 text-sm font-mono"
        >
          ↵
        </button>
      </form>
    </div>
  );
}
