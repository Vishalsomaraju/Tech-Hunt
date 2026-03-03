// ============================================================================
// TECH HUNT — Building Map Component
// Grid of rooms as clickable tiles. Uses React.memo to avoid unnecessary
// re-renders during countdown ticks and chat updates.
// ============================================================================

import { memo } from "react";
import { useGame } from "../contexts/GameContext";
import { useAuth } from "../contexts/AuthContext";
import { RoomStatus, PuzzleType } from "@techhunt/shared";
import type { GameRoom } from "../contexts/GameContext";

// Puzzle‐type emoji / icon
const puzzleIcons: Record<string, string> = {
  [PuzzleType.BINARY]: "01",
  [PuzzleType.HEX]: "0x",
  [PuzzleType.OCTAL]: "0o",
  [PuzzleType.ASCII]: "Az",
  [PuzzleType.CODING]: "</>",
};

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

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-xl
        border font-mono text-xs transition-all duration-200
        ${
          isCurrentRoom
            ? "border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10 shadow-[var(--shadow-neon-cyan)]"
            : isSolved
              ? "border-[var(--color-neon-green)]/50 bg-[var(--color-neon-green)]/5"
              : isUnlocked
                ? "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-neon-cyan)]/50 cursor-pointer"
                : "border-[var(--color-border-default)]/50 bg-[var(--color-bg-primary)] opacity-40 cursor-not-allowed"
        }
      `}
    >
      {/* Room label */}
      <span className="text-[10px] text-[var(--color-text-muted)] mb-1">
        R{index + 1}
      </span>

      {/* Icon / Status */}
      {isSolved ? (
        <span className="text-lg text-[var(--color-neon-green)]">✓</span>
      ) : isLocked ? (
        <span className="text-lg opacity-50">🔒</span>
      ) : (
        <span className="text-sm text-[var(--color-neon-cyan)]">
          {puzzleIcons[room.puzzleType] ?? "?"}
        </span>
      )}

      {/* Players in room */}
      {playersHere.length > 0 && (
        <div className="flex -space-x-1 mt-1">
          {playersHere.slice(0, 3).map((initials, i) => (
            <span
              key={i}
              className="w-4 h-4 rounded-full bg-[var(--color-neon-purple)]/30 border border-[var(--color-neon-purple)]/50 text-[8px] flex items-center justify-center text-[var(--color-neon-purple)]"
            >
              {initials}
            </span>
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
    <div className="glass-panel p-4">
      <h2 className="text-xs font-mono text-[var(--color-text-muted)] mb-3 tracking-wider">
        BUILDING MAP
      </h2>
      <div className="grid grid-cols-5 gap-2">
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
