// ============================================================================
// TECH HUNT — Building Generator
// Takes a single master seed and deterministically produces a complete
// building with rooms and puzzles. Every call with the same seed yields
// the exact same output — enabling session resumption and late joins.
// ============================================================================

import {
  PuzzleType,
  RoomStatus,
  DEFAULT_FLOORS,
  DEFAULT_ROOMS_PER_FLOOR,
} from "@techhunt/shared";
import type { Building, Room, PuzzleInternal } from "@techhunt/shared";
import { PRNG } from "./prng.js";
import { generatePuzzle, toPuzzlePublic } from "./puzzles.js";

// ─── Types ─────────────────────────────────────────────────────────────────

/** The complete output of the building generator. */
export interface GeneratedBuilding {
  /** Client-safe building with rooms (no puzzle answers). */
  building: Building;
  /** Server-only puzzle objects keyed by room ID. */
  puzzles: Map<string, PuzzleInternal>;
}

// ─── Puzzle Type Selection ─────────────────────────────────────────────────

/**
 * Selects a puzzle type based on how far through the building the room is.
 * Earlier rooms lean toward easy conversion puzzles; later rooms introduce
 * ASCII and coding challenges.
 */
function selectPuzzleType(progress: number, rng: PRNG): PuzzleType {
  if (progress < 0.25) {
    // Early game — easy conversions
    return rng.pick([PuzzleType.BINARY, PuzzleType.OCTAL]);
  } else if (progress < 0.5) {
    // Early-mid — mix of conversions
    return rng.pick([PuzzleType.BINARY, PuzzleType.OCTAL, PuzzleType.HEX]);
  } else if (progress < 0.75) {
    // Mid-late — harder conversions + ASCII
    return rng.pick([PuzzleType.HEX, PuzzleType.ASCII]);
  } else {
    // Late game — coding + hard conversions
    return rng.pick([PuzzleType.CODING, PuzzleType.ASCII, PuzzleType.HEX]);
  }
}

// ─── ID Generators ─────────────────────────────────────────────────────────

function buildingId(rng: PRNG): string {
  return `bld_${Array.from({ length: 8 }, () => rng.nextInt(0, 15).toString(16)).join("")}`;
}

function roomId(rng: PRNG): string {
  return `room_${Array.from({ length: 8 }, () => rng.nextInt(0, 15).toString(16)).join("")}`;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Generates an entire building from a master seed.
 *
 * @param seed           — The master seed (from `game_sessions.building_seed`).
 * @param floors         — Number of floors (default from shared constants).
 * @param roomsPerFloor  — Rooms per floor (default from shared constants).
 * @returns              — Building (client-safe) + puzzles map (server-only).
 */
export function generateBuilding(
  seed: number,
  floors: number = DEFAULT_FLOORS,
  roomsPerFloor: number = DEFAULT_ROOMS_PER_FLOOR,
): GeneratedBuilding {
  const masterRng = new PRNG(seed);
  const bId = buildingId(masterRng);
  const totalRooms = floors * roomsPerFloor;

  const rooms: Room[] = [];
  const puzzles = new Map<string, PuzzleInternal>();

  for (let floor = 0; floor < floors; floor++) {
    for (let pos = 0; pos < roomsPerFloor; pos++) {
      const roomIndex = floor * roomsPerFloor + pos;
      const progress = totalRooms > 1 ? roomIndex / (totalRooms - 1) : 0;

      // Derive an independent PRNG for this room so room order doesn't matter
      const roomRng = masterRng.derive(roomIndex);
      const rId = roomId(roomRng);

      // Select puzzle type based on progression
      const puzzleType = selectPuzzleType(progress, roomRng);

      // Build room
      const room: Room = {
        id: rId,
        buildingId: bId,
        floor,
        position: pos,
        status: roomIndex === 0 ? RoomStatus.UNLOCKED : RoomStatus.LOCKED,
        puzzleType,
        seed: roomRng.getState(),
      };
      rooms.push(room);

      // Generate the puzzle for this room
      const puzzleRng = roomRng.derive(1000 + roomIndex);
      const puzzle = generatePuzzle(puzzleType, puzzleRng, rId, progress);
      puzzles.set(rId, puzzle);
    }
  }

  const building: Building = {
    id: bId,
    seed,
    floors,
    roomsPerFloor,
    rooms,
  };

  return { building, puzzles };
}

/**
 * Convenience: regenerates puzzles for a specific room.
 * Useful when the server only needs to validate a single answer without
 * rebuilding the entire building.
 *
 * @param buildingSeed — Master seed.
 * @param roomIndex    — 0-based linear room index (floor * roomsPerFloor + pos).
 * @param floors       — Building floors.
 * @param roomsPerFloor — Rooms per floor.
 */
export function regeneratePuzzleForRoom(
  buildingSeed: number,
  roomIndex: number,
  floors: number = DEFAULT_FLOORS,
  roomsPerFloor: number = DEFAULT_ROOMS_PER_FLOOR,
): PuzzleInternal {
  const masterRng = new PRNG(buildingSeed);
  // Consume the building ID generation to keep state consistent
  buildingId(masterRng);

  const totalRooms = floors * roomsPerFloor;
  const progress = totalRooms > 1 ? roomIndex / (totalRooms - 1) : 0;

  const roomRng = masterRng.derive(roomIndex);
  const rId = roomId(roomRng);
  const puzzleType = selectPuzzleType(progress, roomRng);
  const puzzleRng = roomRng.derive(1000 + roomIndex);

  return generatePuzzle(puzzleType, puzzleRng, rId, progress);
}

/**
 * Strips answers from all puzzles, returning a client-safe version.
 */
export function toBuildingPublic(generated: GeneratedBuilding): {
  building: Building;
  puzzles: Record<string, ReturnType<typeof toPuzzlePublic>>;
} {
  const pubPuzzles: Record<string, ReturnType<typeof toPuzzlePublic>> = {};
  for (const [roomId, puzzle] of generated.puzzles) {
    pubPuzzles[roomId] = toPuzzlePublic(puzzle);
  }
  return { building: generated.building, puzzles: pubPuzzles };
}
