# Account safety, history visibility and lobby owner — design

Date: 2026-10-10
Status: approved in chat, awaiting spec review

## Goal

Quick Join stays the easiest way into JollyTracker, but users must understand that a quick
account is only reachable again through its tag (`Name#1234`), and they get an easy way to
secure it. Private game history must not vanish when a player leaves a lobby. Admin powers
move from "any player who flips a toggle" to the lobby owner, with automatic handover when
the owner leaves. Public games stay visible to every logged-in user.

## Current behavior (for reference)

- Quick Join with a bare name always creates a new account. The last tag is remembered only
  on session expiry (`UserModel.expireSession`); a manual logout clears it.
- A quick account cannot add a password later.
- Private lobbies appear in history only for `createdBy` and current `players`; a player who
  leaves loses access.
- `GET /api/games/:gameId` and the SSE stream have no access check beyond being logged in.
- Admin mode is a client-side toggle. Backend admin endpoints only require being a player.
- `Lobby.createdBy` never changes.

## 1. Accounts and login

### Backend

- `UsersService.toUserResponse` adds `hasPassword: boolean` (`!!user.password`). This flows
  into login, register and `GET /users/me` responses.
- New route `POST /users/secure` (in `users.routes.js`, guarded by `requireAuth()`), body
  `{ password }`, implemented as `UsersService.secureAccount(userId, password)`:
  - validates the password with the existing `validatePassword`;
  - `409` if the account already has a password;
  - `409` if another account with the same `username` already has a password (same rule as
    `registerUser`; keeps username+password login unambiguous);
  - otherwise sets the password (hashed by the existing pre-save hook) and returns the user
    response (`hasPassword: true`). Tag, id and session are unchanged.

### Frontend

- `User` type gets `hasPassword: boolean`. `ApiClient.secureAccount(password)` and
  `useSecureAccount()` hook; on success it updates `UserModel`.
- `UserModel.setUser` also stores the tag as the last tag, so the tag survives a manual
  logout. `clearUser` keeps the last tag.
- Landing page:
  - If a last tag is stored, show a prominent **"Continue as Tim#4523"** button above the
    mode tabs. It logs in with the tag. If the server answers 403 (account is
    password-protected), switch to Login mode with the username pre-filled and show the
    message.
  - Quick Join hint text: "You'll get a tag like Tim#1234. Remember it, because it's how you
    get back to your private games. You can add a password later."
- Lobby page: while `hasPassword` is false, show a banner "Playing as Tim#4523 without a
  password. [Secure account]". The button opens `SecureAccountModal` (password + confirm,
  min/max length matching the backend; errors via `useToast`).
- Logout: for accounts without a password, show a warning modal: "You're Tim#4523. Without
  this tag you can't get back to your private games." with **[Set password]** (opens
  `SecureAccountModal`) and **[Log out anyway]**. Accounts with a password log out directly.
  The decision lives in a small testable hook (e.g. `useLogoutFlow`), not inline in
  `LobbyPage`.

## 2. History and game visibility

- `Lobby` schema gets `participants: [ObjectId ref User]`, default `[]`.
  - `createLobby` adds the creator; `joinLobby` adds the user (`$addToSet` semantics).
  - `leaveLobby` and the admin's remove-player do **not** remove the user from it.
- `LobbiesService.canViewLobby(lobby, userId)`: true if the lobby is public, or the user is
  in `participants`, is `createdBy`, or is in current `players` (the last two cover lobbies
  created before this change).
- `listAllLobbies` (history) filters with `canViewLobby`.
- `GET /api/games/:gameId` and `GET /api/games/:gameId/events` load the game's lobby and
  require `canViewLobby`; otherwise `403`. Public games stay readable by any logged-in user.
  A game without a lobby returns `404` as today.
- No data migration: older private lobbies keep working through the `createdBy`/`players`
  fallback; players who already left before this change are not recovered.

## 3. Lobby owner (admin)

- `Lobby` schema gets `ownerId: ObjectId ref User`. `createLobby` sets it to the creator.
  `LobbiesService.getOwnerId(lobby)` returns `ownerId ?? createdBy` for older lobbies.
- The game state response (`getGameStateGET`) includes `ownerId` (string) from the lobby.
  The frontend `GameState` type gets `ownerId`.
- New `getGameForOwner(gameId, user)` in `DefaultService`: like `getGameForPlayer`, plus the
  caller must be the lobby owner; otherwise `403` "Only the lobby admin can do this".
  Used by: `addPlayerToGamePOST`, `removePlayerFromGamePOST`, `submitScoreForPlayerPOST`,
  `forceNextRoundPOST`.
- The owner cannot remove themselves through `removePlayer` (`400`, "Use Leave to leave the
  lobby"), so ownership only changes through the leave path.
- Handover in `leaveLobby` (inside the existing lobby queue): if the leaving user is the
  owner and players remain, `ownerId` becomes the first remaining entry of `lobby.players`
  (join order; temporary players are never in `lobby.players`). Then
  `EventService.sendEvent(gameId, { type: 'OWNER_CHANGED', ownerId, ownerName })`.
- Frontend:
  - `useGameEvents` handles `OWNER_CHANGED` by invalidating the game query and showing a
    toast "Anna is now the lobby admin" (or "You are now the lobby admin").
  - `AdminPanel` (toggle included) renders only when `currentUser.id === game.ownerId`.
  - The owner's name gets a small "Admin" badge in the player list.

## Unchanged

Reorder players, reset round, win condition, editing your own past scores, and the lobby
delete/archive permission rules.

## Testing (TDD, tests first)

Backend (Supertest, `backend/tests/`):
- `POST /users/secure`: sets a password (then username+password login works and tag login
  is refused); 409 when already secured; 409 when the username is taken by another protected
  account; 401 without a session.
- `hasPassword` in login and `/users/me` responses.
- History: a player who left a private lobby still sees it; an outsider does not; public
  lobbies are visible to all.
- `GET /api/games/:id` and events: 403 for outsiders on private games, 200 on public games,
  200 for a former participant.
- Owner-only endpoints: 403 for non-owner players, success for the owner; owner cannot
  remove themselves.
- Handover: owner leaves → next player is owner (visible in game state) and `OWNER_CHANGED`
  is sent; non-owner leaving does not change the owner; old lobby without `ownerId` treats
  `createdBy` as owner.

Frontend (Vitest):
- `UserModel` keeps the last tag after `setUser` + `clearUser`.
- `useLogoutFlow`: warns for accounts without a password, logs out directly otherwise.
- Landing page shows "Continue as …" when a tag is stored.
- `AdminPanel` is hidden for non-owners and shown for the owner.
- `useGameEvents` handles `OWNER_CHANGED`.

Then `npm test` in both projects, plus `npm run lint` and `npm run typecheck` in `frontend/`.
