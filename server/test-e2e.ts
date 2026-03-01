// ============================================================================
// TECH HUNT — Backend Core End-to-End Tests
// Runs through a full flow: register user, create team, join team, start session.
// Designed to run against a fresh local dev database.
// ============================================================================

import assert from "assert";

// We assume the server is running on localhost:3001
const API_URL = "http://localhost:3001/api";

// Helper: Make API request and return JSON body
async function request(
  endpoint: string,
  method: string,
  token?: string,
  body?: any,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    console.error(`❌ Request Failed: [${method}] ${endpoint}`);
    console.error("Response:", json);
    throw new Error(`[${response.status}] ${json.message || "Request failed"}`);
  }

  return json.data;
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

async function runTests() {
  console.log("🧪 Starting Backend Core E2E Tests...\n");

  try {
    // 1. Health check
    console.log("1. Checking server health...");
    const health = await request("/health", "GET");
    assert.strictEqual(health.status, "ok", "Server is not healthy");
    console.log("   ✅ Health check passed\n");

    // Generate unique handles for this test run
    const ts = Date.now().toString().slice(-6);
    const user1 = {
      username: `Agent_${ts}_1`,
      email: `agent1_${ts}@test.com`,
      password: "password123",
    };
    const user2 = {
      username: `Agent_${ts}_2`,
      email: `agent2_${ts}@test.com`,
      password: "password123",
    };

    // 2. Register User 1
    console.log(`2. Registering User 1 (${user1.username})...`);
    const auth1 = await request("/auth/register", "POST", undefined, user1);
    const token1 = auth1.token;
    assert.ok(token1, "Missing token for User 1");
    assert.strictEqual(
      auth1.user.username,
      user1.username,
      "Username mismatch",
    );
    console.log("   ✅ User 1 registered\n");

    // 3. Register User 2
    console.log(`3. Registering User 2 (${user2.username})...`);
    const auth2 = await request("/auth/register", "POST", undefined, user2);
    const token2 = auth2.token;
    assert.ok(token2, "Missing token for User 2");
    console.log("   ✅ User 2 registered\n");

    // 4. Create Team (User 1)
    console.log("4. Creating new team as User 1...");
    const teamName = `Team Cyber ${ts}`;
    const team = await request("/teams", "POST", token1, {
      name: teamName,
      sessionType: "MULTIPLAYER",
    });
    const teamId = team.id;
    const teamCode = team.code;
    assert.ok(teamId, "Missing team id");
    assert.ok(teamCode, "Missing team code");
    assert.strictEqual(
      team.players.length,
      1,
      "Team should have exactly 1 player",
    );
    assert.strictEqual(
      team.players[0].role,
      "LEADER",
      "Creator should be LEADER",
    );
    console.log(`   ✅ Team created: ${teamName} (Code: ${teamCode})\n`);

    // 5. Join Team (User 2)
    console.log(`5. Joining team with User 2 using code ${teamCode}...`);
    const joinedTeam = await request("/teams/join", "POST", token2, {
      code: teamCode,
    });
    assert.strictEqual(
      joinedTeam.players.length,
      2,
      "Team should have 2 players",
    );
    assert.strictEqual(
      joinedTeam.players[1].username,
      user2.username,
      "User 2 not in player list",
    );
    assert.strictEqual(
      joinedTeam.players[1].role,
      "MEMBER",
      "User 2 should be MEMBER",
    );
    console.log("   ✅ User 2 joined team successfully\n");

    // 6. Start Game Session (User 1)
    console.log("6. Starting game session for the team...");
    const session = await request("/sessions", "POST", token1, { teamId });
    const sessionId = session.id;
    assert.ok(sessionId, "Missing session id");
    assert.strictEqual(
      session.phase,
      "LOBBY",
      "Session should start in LOBBY phase",
    );
    assert.strictEqual(
      session.isResumable,
      false,
      "Multiplayer session should not be resumable",
    );
    console.log("   ✅ Game session started successfully\n");

    // 7. Update Session Notes
    console.log("7. Updating collaborative session notes...");
    const noteText = "We need to check the binary puzzles first.";
    const notesUpdate = await request(
      `/sessions/${sessionId}/notes`,
      "PATCH",
      token1,
      { notes: noteText },
    );
    assert.strictEqual(
      notesUpdate.notes,
      noteText,
      "Notes did not update correctly",
    );
    console.log("   ✅ Session notes updated\n");

    // 8. Fetch Detailed Session
    console.log("8. Fetching full session details...");
    const fullSession = await request(`/sessions/${sessionId}`, "GET", token2);
    assert.strictEqual(
      fullSession.notes,
      noteText,
      "User 2 could not see updated notes",
    );
    assert.ok(Array.isArray(fullSession.attempts), "Missing attempts array");
    console.log("   ✅ Full session fetched successfully\n");

    console.log("🎉 ALL BACKEND E2E TESTS PASSED! 🎉");
  } catch (error) {
    console.error("\n❌ OVERALL TEST FAILURE:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
