# Account Safety, History Visibility and Lobby Owner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let quick accounts be secured with a password and warn before they are lost, keep private games in every participant's history, and restrict admin actions to a lobby owner who is handed over automatically.

**Architecture:** Backend first (Tasks 1–4): new fields on `User` responses and `Lobby` (`participants`, `ownerId`), access checks in `DefaultService`, handover inside the existing lobby queue. Frontend after (Tasks 5–9): typed `ApiError`, account-securing UI, logout warning, and owner-aware game page.

**Tech Stack:** Express 5 + Mongoose (CommonJS), Vitest + Supertest; React 19 + TanStack Query/Router, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-10-account-safety-and-lobby-owner-design.md`

## Global Constraints

- Owner-only error: `403`, message `Only the lobby admin can do this`.
- Owner removing self: `400`, message `Use Leave to leave the lobby`.
- Event: `{ type: 'OWNER_CHANGED', ownerId, ownerName }`.
- Password rules: reuse `validatePassword` (4–72 chars).
- Errors as `{ status, message }` objects; never trust ids from the body; read-modify-write on a lobby inside `LobbiesService.queue`.
- Frontend: `useToast()` for feedback, `logger` not `console`, `import type` for types.
- Every task: run the whole project suite (`npm test`; frontend also `npm run lint` and `npm run typecheck`) before committing.

## Review Focus

1. A tag-login for an account secured from another device: "Continue as" must not loop; it switches to Login (Task 7 test).
2. An SSE event arriving after the page loaded must not hide the AdminPanel (Task 9 `mergeEventGame` test).
3. Owner leaves while the next lobby player was kicked from the game: skip them (Task 4 test).
4. Lobbies created before this change (no `ownerId`, no `participants`): creator is still owner and still sees the private game (Tasks 2 and 3 tests).
5. A former participant reloading a private game page after leaving: game state still loads (Task 2 test).

## Intentional test changes

Existing tests in `backend/tests/games.test.mjs` that encode the old "any player is admin" rule change with the spec, not to make the suite pass:
- `lets a player force the next round…` → the owner (alice) forces it.
- `adds temporary players that others can submit scores for` → the owner submits.
- `removes players and hands the dealer role on` → owner removes bob after bob was made dealer.

---

### Task 1: `hasPassword` and `POST /users/secure`

**Files:**
- Modify: `backend/service/UsersService.js` (`toUserResponse`, new `secureAccount`)
- Modify: `backend/service/DefaultService.js` (new `secureAccountPOST`)
- Modify: `backend/controllers/default.controller.js`, `backend/routes/users.routes.js`
- Test: `backend/tests/auth.test.mjs`

**Interfaces:**
- Produces: user responses include `hasPassword: boolean`. `POST /users/secure` `{ password }` → `200` user response.

- [ ] **Step 1: Write failing tests** in a `describe('securing an account')`:
  - `adds a password while keeping the tag`: `bob.post('/users/secure', { password: 'secret1' })` → 200, `body.fullTag === bob.user.fullTag`, `body.hasPassword === true`; then `POST /users/login { username: 'Bob', password: 'secret1' }` → 200 with same `user.id`; `POST /users/login { username: bob.user.fullTag }` → 403.
  - `refuses an account that already has a password` → second call 409.
  - `refuses a username another account already protected`: register `Bob`/`pw1234`, then quick-login Bob secures → 409.
  - `rejects a short password` (`'abc'`) → 400; `requires a session` (no header) → 401.
  - `reports hasPassword`: quick login body `user.hasPassword === false`; `GET /users/me` with `x-session-id` reports the same.
- [ ] **Step 2:** `npx vitest run tests/auth.test.mjs` → new tests FAIL (404 / undefined).
- [ ] **Step 3:** Implement `UsersService.secureAccount(userId, rawPassword)`; route `router.post('/secure', requireAuth(), Default.secureAccountPOST)`; controller passes `req.user`; DefaultService wraps with `httpError(error, 500)`.
- [ ] **Step 4:** `npm test` in `backend/` → PASS.
- [ ] **Step 5:** Commit `feat(users): let quick accounts add a password`.

### Task 2: Participants and game visibility

**Files:**
- Modify: `backend/models/Lobby.js` (`participants: [{ type: ObjectId, ref: 'User' }]`)
- Modify: `backend/service/LobbiesService.js` (`createLobby`, `joinLobby`, `canViewLobby`, `listAllLobbies`, new `getLobbyByGameId`)
- Modify: `backend/service/DefaultService.js` (`getGameStateGET(user, gameId)`, new `getGameForViewer`), `backend/controllers/default.controller.js` (pass `req.user`; SSE handler checks access)
- Test: `backend/tests/lobbies.test.mjs`, `backend/tests/games.test.mjs`

**Interfaces:**
- Produces: `LobbiesService.canViewLobby(lobby, userId): boolean`, `LobbiesService.getLobbyByGameId(gameId): Promise<Lobby|null>`, `getGameForViewer(gameId, user): Promise<{ game, lobby }>` (404 game missing or no lobby, 403 not viewable).

- [ ] **Step 1: Write failing tests:**
  - lobbies: `keeps a private lobby in the history of a player who left` (bob joins alice's private lobby by code, leaves, `/api/lobbies/history` names include it for bob, not for mallory).
  - games: `forbids outsiders from reading a private game` (mallory GET → 403, SSE `GET /api/games/:id/events?sessionId=` → 403); `lets anyone read a public game` (mallory GET → 200); `lets a former participant read a private game` (bob leaves → GET 200).
  - lobbies: `still shows old private lobbies to their creator` — create a private lobby, then `Lobby.updateOne({ _id }, { $unset: { participants: 1 } })` via `requireApp('../models/Lobby')`; alice still sees it in history.
- [ ] **Step 2:** run the two files → new tests FAIL.
- [ ] **Step 3:** `participants` gets the creator in `createLobby` and the joiner in `joinLobby` (skip if present); leave never removes. `canViewLobby` = public, or id in `participants`, `createdBy`, or `players`. `listAllLobbies` uses it. `getGameForViewer` used by `getGameStateGET` and the SSE controller (SSE: on rejection respond with the error's status and message; keep the 404 path).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(lobbies): keep private games visible to past participants`.

### Task 3: Lobby owner and owner-only actions

**Files:**
- Modify: `backend/models/Lobby.js` (`ownerId: { type: ObjectId, ref: 'User' }`)
- Modify: `backend/service/LobbiesService.js` (`createLobby` sets `ownerId`, new `getOwnerId(lobby): string`)
- Modify: `backend/service/DefaultService.js` (`getGameForOwner`, `getGameStateGET` adds `ownerId`, four endpoints, self-removal guard)
- Test: `backend/tests/games.test.mjs`

**Interfaces:**
- Consumes: `getLobbyByGameId` (Task 2).
- Produces: game state response field `ownerId: string`. `getOwnerId(lobby)` returns `(lobby.ownerId ?? lobby.createdBy)?.toString()`.

- [ ] **Step 1: Write failing tests** (`describe('lobby admin')`):
  - `reports the owner in the game state` → `ownerId === alice.user.id`.
  - `it.each` over `addPlayer`, `removePlayer`, `submitScoreForPlayer` (game routes) and `forceNextRound` (admin route): bob → 403 with `body.message === 'Only the lobby admin can do this'`.
  - `does not let the owner remove themselves` → alice removing alice → 400 `Use Leave to leave the lobby`.
  - `treats the creator of an old lobby as owner` → `$unset ownerId`, alice `addPlayer` → 200.
  - Apply the three intentional test changes listed above.
- [ ] **Step 2:** `npx vitest run tests/games.test.mjs` → FAIL.
- [ ] **Step 3:** `getGameForOwner(gameId, user)`: `getGameForPlayer` then lobby owner check. Use it in `addPlayerToGamePOST`, `removePlayerFromGamePOST`, `submitScoreForPlayerPOST`, `forceNextRoundPOST`. Self-removal check before calling `GamesService.removePlayer`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(games): restrict admin actions to the lobby owner`.

### Task 4: Owner handover on leave

**Files:**
- Modify: `backend/service/LobbiesService.js` (`leaveLobby`)
- Test: `backend/tests/lobbies.test.mjs`

**Interfaces:**
- Consumes: `getOwnerId` (Task 3), `EventService.sendEvent(gameId, event)`, `GamesService.getGameById`.

- [ ] **Step 1: Write failing tests** (`describe('owner handover')`, spy with `vi.spyOn(requireApp('../service/EventService'), 'sendEvent')`):
  - `hands admin to the next player when the owner leaves` → alice, bob, mallory in lobby; alice leaves; game state `ownerId === bob.user.id`; spy called with `(gameId, expect.objectContaining({ type: 'OWNER_CHANGED', ownerId: bob.user.id, ownerName: 'Bob' }))`.
  - `skips players removed from the game` → alice removes bob from the game, alice leaves → owner is mallory.
  - `keeps the owner when someone else leaves` → bob leaves → owner still alice, no `OWNER_CHANGED`.
- [ ] **Step 2:** run → FAIL.
- [ ] **Step 3:** In `leaveLobby`, before removal capture `wasOwner = getOwnerId(lobby) === userId`. After removing and if players remain: load the game, pick first `lobby.players` entry whose `userId` is a game player, else `lobby.players[0]`; set `ownerId`, save, then send the event (with `gameId.toString()`).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(lobbies): hand admin to the next player when the owner leaves`.

### Task 5: `ApiError` with status

**Files:**
- Modify: `frontend/src/core/api/client.ts` (export `class ApiError extends Error { status: number }`)
- Test: `frontend/src/core/api/client.test.ts`

- [ ] **Step 1:** Test `throws an ApiError carrying the status`: `mockFetch(403, { message: 'nope' })`; `ApiClient.login('Tim#1')` rejects with an `ApiError` where `status === 403` and `message === 'nope'`.
- [ ] **Step 2:** `npx vitest run --project unit src/core/api/client.test.ts` → FAIL.
- [ ] **Step 3:** Throw `new ApiError(message, response.status)` in `request`.
- [ ] **Step 4:** run → PASS. **Step 5:** Commit `feat(api): expose the HTTP status on errors`.

### Task 6: Account model, secure endpoint client, last tag

**Files:**
- Modify: `frontend/src/types/user.types.ts`, `frontend/src/core/models/UserModel.ts` (`User.hasPassword?: boolean`; `setUser` stores last tag; new `forgetLastFullTag()`)
- Modify: `frontend/src/core/api/client.ts` (`static secureAccount(password: string): Promise<User>`), `frontend/src/core/api/hooks.ts` (`useSecureAccount()` updates `UserModel` and `currentUser` query)
- Test: `frontend/src/core/models/UserModel.test.ts`, `frontend/src/core/api/client.test.ts`

- [ ] **Step 1:** Tests: `remembers the tag after a manual logout` (`setUser` + `clearUser` → `getLastFullTag() === 'Tim#4523'`); `forgets the tag on request`; `secureAccount posts the password to /users/secure`.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement. **Step 4:** run → PASS.
- [ ] **Step 5:** Commit `feat(users): remember the last tag and add secureAccount`.

### Task 7: Landing page "Continue as" and hints

**Files:**
- Create: `frontend/src/core/hooks/useContinueAs.ts` → `useContinueAs(): { lastTag: string | null; continueAs(): Promise<'ok' | 'needs-password' | 'not-found'> }` (logs in with the tag through `useLogin`, sets `UserModel`; 403 → `'needs-password'`; 404 → forgets the tag, `'not-found'`; other errors rethrow)
- Modify: `frontend/src/presentation/pages/LandingPage.tsx`
- Test: `frontend/src/core/hooks/useContinueAs.test.ts`

- [ ] **Step 1:** Tests with `renderHook` inside a `QueryClientProvider`, `fetch` stubbed: returns `'ok'` and sets the user; `'needs-password'` on 403; `'not-found'` on 404 and `lastTag` becomes `null`.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement hook; LandingPage shows `Continue as {lastTag}` button above the tabs (on `'needs-password'`: switch to login mode, set username to the part before `#`, show the error; on `'ok'`: same post-login navigation as quick join, extracted to a local `finishLogin()`); quick-join subtitle and hint use the spec copy.
- [ ] **Step 4:** frontend `npm test`, lint, typecheck → PASS.
- [ ] **Step 5:** Commit `feat(landing): continue as the last account and explain tags`.

### Task 8: Secure-account modal, banner, logout warning

**Files:**
- Create: `frontend/src/presentation/components/SecureAccountModal/index.tsx` (props `isOpen`, `onClose`, `onSecured?`; password + confirm; mismatch → `toast.error('Passwords do not match')`; success → `toast.success('Account secured')`)
- Create: `frontend/src/core/hooks/useLogoutFlow.ts` → `useLogoutFlow(user, logout: () => Promise<void>): { requestLogout(): void; showWarning: boolean; confirmLogout(): Promise<void>; cancel(): void }`
- Modify: `frontend/src/presentation/pages/LobbyPage/LobbyPage.tsx` (banner when `!currentUser.hasPassword`, warning modal with `[Set password]` / `[Log out anyway]`)
- Test: `frontend/src/core/hooks/useLogoutFlow.test.ts`

- [ ] **Step 1:** Tests: `asks for confirmation when the account has no password` (`requestLogout` → `showWarning` true, `logout` not called; `confirmLogout` calls it); `logs out directly when the account has a password`.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement hook, modal, LobbyPage wiring (warning text: `You're {fullTag}. Without this tag you can't get back to your private games.`; banner: `Playing as {fullTag} without a password.`).
- [ ] **Step 4:** frontend `npm test`, lint, typecheck → PASS.
- [ ] **Step 5:** Commit `feat(lobby): warn before losing an unsecured account`.

### Task 9: Owner-aware game page

**Files:**
- Modify: `frontend/src/types/game.types.ts` (`Game.ownerId?: string`; `GameEventType` adds `'OWNER_CHANGED'`; `GameEvent.ownerId?`, `ownerName?`)
- Create: `frontend/src/core/api/gameEvents.ts` → `mergeEventGame(cached: Game | undefined, incoming: Game): Game`
- Modify: `frontend/src/core/api/hooks.ts` (`useGameEvents(gameId, onOwnerChanged?: (e: GameEvent) => void)`; uses `mergeEventGame`; `OWNER_CHANGED` invalidates and calls callback)
- Modify: `frontend/src/presentation/pages/GamePage/gameState.ts` (`isOwner: boolean`), `GamePage.tsx` (render `AdminPanel` only if `isOwner`; toast `You are now the lobby admin` / `{ownerName} is now the lobby admin`), `components/PlayerCard.tsx` (`isOwner` prop → "Admin" badge)
- Test: `frontend/src/core/api/gameEvents.test.ts`, `frontend/src/presentation/pages/GamePage/gameState.test.ts`

- [ ] **Step 1:** Tests: `mergeEventGame` keeps cached `ownerId` when incoming has none, prefers incoming when present, returns incoming when no cache; `deriveGameState` `isOwner` true only for `ownerId === currentUserId`, false when `ownerId` missing.
- [ ] **Step 2:** run → FAIL. **Step 3:** implement and wire.
- [ ] **Step 4:** frontend `npm test`, lint, typecheck; backend `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(game): show admin controls only to the lobby owner`.
