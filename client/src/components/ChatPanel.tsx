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
  useAuth(); // ensure authenticated
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
        CHAT
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
        style={{ padding: "12px" }}
      >
        {messages.length === 0 && (
          <p
            className="text-center font-mono"
            style={{
              fontSize: "12px",
              color: "var(--text-dim)",
              padding: "32px 0",
            }}
          >
            No messages yet
          </p>
        )}
        <div className="flex flex-col" style={{ gap: "10px" }}>
          {messages.map((msg, i) => {
            // System messages (senderId === null)
            if (!msg.senderId) {
              return (
                <div
                  key={i}
                  className="text-center font-italic"
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontStyle: "italic",
                    padding: "2px 0",
                  }}
                >
                  {msg.message}
                </div>
              );
            }

            return (
              <div key={i} style={{ gap: "4px" }}>
                <div className="flex items-baseline" style={{ gap: "6px" }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "11px",
                      color: "var(--accent)",
                      fontWeight: 600,
                    }}
                  >
                    {msg.senderName}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-dim)" }}>
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.message}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex shrink-0"
        style={{
          gap: "8px",
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input-base flex-1"
          style={{ fontSize: "13px", padding: "8px 12px" }}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="btn-primary font-mono"
          style={{ width: "auto", padding: "8px 14px", fontSize: "11px" }}
        >
          ↵
        </button>
      </form>
    </div>
  );
}
