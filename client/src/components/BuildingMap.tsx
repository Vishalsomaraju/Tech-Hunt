// ============================================================================
// TECH HUNT — Building Map Component
// Grid of rooms as clickable tiles. Uses React.memo to avoid unnecessary
// re-renders during countdown ticks and chat updates.
// ============================================================================

import { memo } from "react";
import { useGame } from "../contexts/GameContext";
import { useAuth } from "../contexts/AuthContext";
import { RoomStatus } from "@techhunt/shared";
import type { GameRoom } from "../contexts/GameContext";

interface RoomTileProps {
  room: GameRoom;
  index: number;
  isCurrentRoom: boolean;
  playersHere: string[];
  isSolved: boolean;
  onClick: () => void;
}

const RoomTile = memo(function RoomTile({
  room,
  index,
  isCurrentRoom,
  playersHere,
  isSolved,
  onClick,
}: RoomTileProps) {
  const isLocked = room.status === RoomStatus.LOCKED;
  const isUnlocked = room.status === RoomStatus.UNLOCKED;

  const bgColor = isCurrentRoom
    ? "#0E2A3A"
    : isSolved
      ? "#0A1F16"
      : isUnlocked
        ? "#0E2A3A"
        : "#0D1E2C";

  const borderColor = isCurrentRoom
    ? "var(--accent-glow)"
    : isSolved
      ? "#065F46"
      : isUnlocked
        ? "var(--accent-dim)"
        : "#1E3A4A";

  const textColor = isCurrentRoom
    ? "var(--accent)"
    : isSolved
      ? "var(--success)"
      : isUnlocked
        ? "var(--text-secondary)"
        : "var(--text-dim)";

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`relative flex flex-col items-center justify-center font-mono transition-all duration-200 ${
        isCurrentRoom ? "animate-pulse-glow" : ""
      }`}
      style={{
        width: "88px",
        height: "40px",
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${borderColor}`,
        background: bgColor,
        color: textColor,
        fontSize: "11px",
        textAlign: "center",
        overflow: "hidden",
        textOverflow: "ellipsis",
        padding: "0 8px",
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity: isLocked ? 0.5 : 1,
      }}
    >
      {/* Room label */}
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        {isSolved ? "✓ " : ""}R{index + 1}
      </span>

      {/* Players in room */}
      {playersHere.length > 0 && (
        <div className="absolute flex" style={{ bottom: "-10px", gap: "2px" }}>
          {playersHere.slice(0, 3).map((initials, i) => (
            <span
              key={i}
              className="flex items-center justify-center"
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--accent)",
                fontSize: "0",
              }}
              title={initials}
            />
          ))}
        </div>
      )}
    </button>
  );
});

export const BuildingMap = memo(function BuildingMap() {
  const { state, moveToRoom } = useGame();
  const { user } = useAuth();

  return (
    <div
      className="h-full"
      style={{
        background: "var(--bg-base)",
        backgroundImage:
          "linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        padding: "var(--space-lg)",
        overflow: "auto",
      }}
    >
      <h2
        className="font-mono"
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "var(--text-muted)",
          marginBottom: "16px",
        }}
      >
        BUILDING MAP
      </h2>
      <div className="grid grid-cols-5" style={{ gap: "10px" }}>
        {state.rooms.map((room, idx) => {
          const puzzle = state.puzzles[idx];
          const playersHere = state.players
            .filter((p) => p.currentRoomId === room.id && p.id !== user?.id)
            .map((p) => p.username[0]?.toUpperCase() ?? "?");
          const isCurrentRoom = state.currentRoomId === room.id;

          return (
            <RoomTile
              key={room.id}
              room={room}
              index={idx}
              isCurrentRoom={isCurrentRoom}
              playersHere={playersHere}
              isSolved={puzzle?.isSolved ?? false}
              onClick={() => moveToRoom(room.id)}
            />
          );
        })}
      </div>
    </div>
  );
});
