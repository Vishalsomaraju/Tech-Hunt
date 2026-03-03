import { PuzzleType, RoomStatus, GamePhase, PlayerRole, HintLevel, SessionType } from "./enums";
/** A registered user (no password — this is the client-safe shape) */
export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string;
}
/** Payload stored inside a JWT */
export interface JwtPayload {
    userId: string;
    username: string;
}
/** Body for POST /api/auth/register */
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}
/** Body for POST /api/auth/login */
export interface LoginRequest {
    email: string;
    password: string;
}
/** Response from auth endpoints */
export interface AuthResponse {
    token: string;
    user: User;
}
/** A team of players */
export interface Team {
    id: string;
    name: string;
    code: string;
    sessionType: SessionType;
    teamScore: number;
    players: TeamMember[];
    createdAt: string;
}
/** A player's membership within a team */
export interface TeamMember {
    userId: string;
    username: string;
    role: PlayerRole;
    individualScore: number;
    joinedAt: string;
}
/** A procedurally generated building */
export interface Building {
    id: string;
    seed: number;
    floors: number;
    roomsPerFloor: number;
    rooms: Room[];
}
/** A single room within a building */
export interface Room {
    id: string;
    buildingId: string;
    floor: number;
    position: number;
    status: RoomStatus;
    puzzleType: PuzzleType;
    seed: number;
}
/** A generated puzzle instance sent to the client (no answer) */
export interface PuzzlePublic {
    id: string;
    roomId: string;
    type: PuzzleType;
    seed: number;
    difficulty: number;
    timeLimit: number;
    prompt: string;
    hints: string[];
}
/**
 * A generated puzzle instance kept on the server.
 * Never send this to the client.
 */
export interface PuzzleInternal extends PuzzlePublic {
    answer: string;
}
/** A player's attempt at solving a puzzle */
export interface PuzzleAttempt {
    id: string;
    sessionId: string;
    playerId: string;
    roomIndex: number;
    puzzleSeed: number;
    answer: string;
    correct: boolean;
    attemptedAt: string;
}
/** Record of a hint being used */
export interface HintUsage {
    id: string;
    sessionId: string;
    teamId: string;
    roomIndex: number;
    hintLevel: HintLevel;
    penalty: number;
    usedAt: string;
}
/** A game session (one run through a building) */
export interface GameSession {
    id: string;
    teamId: string;
    buildingSeed: number;
    phase: GamePhase;
    startedAt: string;
    endedAt?: string;
    /**
     * Timestamp when the room countdown finishes and the puzzle officially
     * begins.  Used server-side to compute fair time bonuses without relying
     * on the client's clock.
     */
    puzzleActivatedAt?: string;
    /** Collaborative notepad shared by the team */
    notes: string;
    isResumable: boolean;
}
/** A single entry on the global leaderboard */
export interface LeaderboardEntry {
    teamId: string;
    teamName: string;
    teamScore: number;
    players: {
        id: string;
        username: string;
        individualScore: number;
    }[];
}
/** Standard API success wrapper */
export interface ApiResponse<T> {
    success: true;
    data: T;
}
/** Standard API error wrapper */
export interface ApiError {
    success: false;
    error: string;
    message: string;
}
//# sourceMappingURL=types.d.ts.map