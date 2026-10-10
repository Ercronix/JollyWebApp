import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loginAs, createLobbyWith, requireApp } from './helpers.mjs';

const Lobby = requireApp('../models/Lobby');
const EventService = requireApp('../service/EventService');

let alice, bob, mallory;

beforeEach(async () => {
    alice = await loginAs('Alice');
    bob = await loginAs('Bob');
    mallory = await loginAs('Mallory');
});

describe('creating lobbies', () => {
    it('returns the lobby id and a game, with the creator as first player', async () => {
        const res = await alice.post('/api/lobbies', { name: 'Friday' }).expect(201);

        expect(res.body.id).toBeTruthy();
        expect(res.body.gameId).toBeTruthy();
        const game = (await alice.get(`/api/games/${res.body.gameId}`).expect(200)).body;
        expect(game.players.map(p => p.userId)).toEqual([alice.user.id]);
    });

    it('uses the session user, ignoring a userId in the body', async () => {
        const res = await alice.post('/api/lobbies', { name: 'Friday', userId: mallory.user.id }).expect(201);

        const game = (await alice.get(`/api/games/${res.body.gameId}`)).body;
        expect(game.players[0].userId).toBe(alice.user.id);
    });

    it('returns the access code of a private lobby to its creator', async () => {
        const res = await alice.post('/api/lobbies', { name: 'Secret', isPrivate: true }).expect(201);

        expect(res.body.accessCode).toMatch(/^[A-Z2-9]{6}$/);
    });

    it.each([
        [{}],
        [{ name: '   ' }],
        [{ name: 'x'.repeat(51) }],
        [{ name: { $ne: null } }],
    ])('rejects invalid lobby input %j', async (body) => {
        await alice.post('/api/lobbies', body).expect(400);
    });
});

describe('listing lobbies', () => {
    it('lists public lobbies but not private ones', async () => {
        await alice.post('/api/lobbies', { name: 'Public' }).expect(201);
        await alice.post('/api/lobbies', { name: 'Secret', isPrivate: true }).expect(201);

        const names = (await mallory.get('/api/lobbies').expect(200)).body.map(l => l.name);

        expect(names).toEqual(['Public']);
    });

    it('hides private lobbies and access codes from other users in the history', async () => {
        await alice.post('/api/lobbies', { name: 'Secret', isPrivate: true }).expect(201);
        await alice.post('/api/lobbies', { name: 'Public' }).expect(201);

        const history = (await mallory.get('/api/lobbies/history').expect(200)).body;

        expect(history.map(l => l.name)).toEqual(['Public']);
        for (const lobby of history) {
            expect(lobby).not.toHaveProperty('accessCode');
            expect(lobby).not.toHaveProperty('players');
        }
    });

    it('shows private lobbies to their creator in the history', async () => {
        await alice.post('/api/lobbies', { name: 'Secret', isPrivate: true }).expect(201);

        const history = (await alice.get('/api/lobbies/history').expect(200)).body;

        expect(history.map(l => l.name)).toEqual(['Secret']);
    });

    it('keeps a private lobby in the history of a player who left', async () => {
        const { lobby } = await createLobbyWith(alice, [], { name: 'Secret', isPrivate: true });
        await bob.post('/api/lobbies/join-by-code', { accessCode: lobby.accessCode }).expect(200);

        await bob.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        expect((await bob.get('/api/lobbies/history').expect(200)).body.map(l => l.name)).toEqual(['Secret']);
        expect((await mallory.get('/api/lobbies/history').expect(200)).body).toEqual([]);
    });

    it('still shows private lobbies from before participants were tracked to their creator', async () => {
        const { lobby } = await createLobbyWith(alice, [], { name: 'Secret', isPrivate: true });
        await Lobby.updateOne({ _id: lobby.id }, { $unset: { participants: 1 } });

        expect((await alice.get('/api/lobbies/history').expect(200)).body.map(l => l.name)).toEqual(['Secret']);
    });
});

describe('joining lobbies', () => {
    it('adds the player to the lobby game', async () => {
        const { gameId } = await createLobbyWith(alice, [bob]);

        const game = (await alice.get(`/api/games/${gameId}`)).body;
        expect(game.players.map(p => p.userId)).toEqual([alice.user.id, bob.user.id]);
    });

    it('is idempotent', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob]);

        await bob.post(`/api/lobbies/${lobby.id}/join`).expect(200);

        expect((await alice.get(`/api/games/${gameId}`)).body.players).toHaveLength(2);
    });

    it('keeps every player when several join at the same time', async () => {
        const { lobby, gameId } = await createLobbyWith(alice);
        const joiners = await Promise.all(['P1', 'P2', 'P3', 'P4', 'P5'].map(loginAs));

        await Promise.all(joiners.map(c => c.post(`/api/lobbies/${lobby.id}/join`).expect(200)));

        const listed = (await alice.get('/api/lobbies')).body.find(l => l.id === lobby.id);
        expect(listed.playerCount).toBe(6);
        expect((await alice.get(`/api/games/${gameId}`)).body.players).toHaveLength(6);
    });

    it('keeps the remaining players when several leave at the same time', async () => {
        const joiners = await Promise.all(['P1', 'P2', 'P3', 'P4'].map(loginAs));
        const { lobby, gameId } = await createLobbyWith(alice, joiners);

        await Promise.all(joiners.slice(0, 3).map(c => c.post(`/api/lobbies/${lobby.id}/leave`).expect(204)));

        const listed = (await alice.get('/api/lobbies')).body.find(l => l.id === lobby.id);
        expect(listed.playerCount).toBe(2);
        expect((await alice.get(`/api/games/${gameId}`)).body.players.map(p => p.name).sort()).toEqual(['Alice', 'P4']);
    });

    it('joins private lobbies by access code (case-insensitive)', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [], { isPrivate: true });

        await bob.post('/api/lobbies/join-by-code', { accessCode: lobby.accessCode.toLowerCase() }).expect(200);

        expect((await alice.get(`/api/games/${gameId}`)).body.players).toHaveLength(2);
    });

    it('returns 404 for an unknown access code and 400 for a malformed lobby id', async () => {
        await bob.post('/api/lobbies/join-by-code', { accessCode: 'ZZZZZZ' }).expect(404);
        await bob.post('/api/lobbies/not-an-id/join').expect(400);
    });
});

describe('leaving lobbies', () => {
    it('removes a player without points from the game', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob]);

        await bob.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        const game = (await alice.get(`/api/games/${gameId}`)).body;
        expect(game.players.map(p => p.userId)).toEqual([alice.user.id]);
    });

    // Regression: issue #2 "Quit game removes player"
    it('keeps a player with points in the game so they can rejoin', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob]);
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);
        await bob.post(`/api/games/${gameId}/submitScore`, { score: 20 }).expect(200);
        await alice.post(`/api/games/${gameId}/nextRound`).expect(200);

        await bob.post(`/api/lobbies/${lobby.id}/leave`).expect(204);
        await bob.post(`/api/lobbies/${lobby.id}/join`).expect(200);

        const game = (await alice.get(`/api/games/${gameId}`)).body;
        const bobInGame = game.players.filter(p => p.userId === bob.user.id);
        expect(bobInGame).toHaveLength(1);
        expect(bobInGame[0].totalScore).toBe(20);
    });

    // A game played on one phone (the admin plus temporary players) must not vanish when the admin leaves
    it('archives instead of deleting when the last player leaves a game with scores', async () => {
        const { lobby, gameId } = await createLobbyWith(alice);
        const grandma = (await alice.post(`/api/games/${gameId}/addPlayer`, { playerName: 'Grandma' }).expect(200))
            .body.players.find(p => p.name === 'Grandma');
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);
        await alice.post(`/api/games/${gameId}/submitScoreForPlayer`, { playerId: grandma.userId, score: 20 }).expect(200);
        await alice.post(`/api/games/${gameId}/nextRound`).expect(200);

        await alice.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        const history = (await alice.get('/api/lobbies/history').expect(200)).body;
        expect(history).toEqual([expect.objectContaining({ id: lobby.id, archived: true })]);
        const game = (await alice.get(`/api/games/${gameId}`).expect(200)).body;
        expect(game.players.find(p => p.name === 'Grandma').totalScore).toBe(20);
    });

    it('counts a score submitted in the first round as played', async () => {
        const { lobby } = await createLobbyWith(alice);
        await alice.post(`/api/games/${lobby.gameId}/submitScore`, { score: 10 }).expect(200);

        await alice.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        expect((await alice.get('/api/lobbies/history').expect(200)).body).toHaveLength(1);
    });

    it('reports the real players still in the lobby in the game state', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob]);
        await alice.post(`/api/games/${gameId}/addPlayer`, { playerName: 'Grandma' }).expect(200);

        await bob.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        expect((await alice.get(`/api/games/${gameId}`).expect(200)).body.lobbyPlayerIds).toEqual([alice.user.id]);
    });

    it('deletes the lobby when the last player leaves', async () => {
        const { lobby } = await createLobbyWith(alice);

        await alice.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        await alice.post(`/api/lobbies/${lobby.id}/join`).expect(404);
    });
});

describe('deleting and archiving lobbies', () => {
    it('lets a player delete the lobby', async () => {
        const { lobby } = await createLobbyWith(alice, [bob]);

        await bob.delete(`/api/lobbies/${lobby.id}`).expect(204);

        expect((await alice.get('/api/lobbies')).body).toEqual([]);
    });

    it('forbids outsiders from deleting or archiving', async () => {
        const { lobby } = await createLobbyWith(alice, [bob]);

        await mallory.delete(`/api/lobbies/${lobby.id}`).expect(403);
        await mallory.post(`/api/lobbies/${lobby.id}/archive`).expect(403);

        expect((await alice.get('/api/lobbies')).body).toHaveLength(1);
    });

    it('hides archived lobbies from the list but keeps them in the history', async () => {
        const { lobby } = await createLobbyWith(alice);

        await alice.post(`/api/lobbies/${lobby.id}/archive`).expect(204);

        expect((await alice.get('/api/lobbies')).body).toEqual([]);
        const history = (await alice.get('/api/lobbies/history')).body;
        expect(history).toEqual([expect.objectContaining({ id: lobby.id, archived: true })]);
    });
});

describe('owner handover', () => {
    let sendEvent;
    const ownerChanges = () => sendEvent.mock.calls.filter(([, e]) => e.type === 'OWNER_CHANGED');

    beforeEach(() => {
        sendEvent = vi.spyOn(EventService, 'sendEvent');
    });

    afterEach(() => {
        sendEvent.mockRestore();
    });

    it('hands admin to the next player when the owner leaves', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob, mallory]);

        await alice.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        expect((await bob.get(`/api/games/${gameId}`).expect(200)).body.ownerId).toBe(bob.user.id);
        expect(ownerChanges()).toEqual([[gameId, expect.objectContaining({ ownerId: bob.user.id, ownerName: 'Bob' })]]);
    });

    it('skips players the admin removed from the game', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob, mallory]);
        await alice.post(`/api/games/${gameId}/removePlayer`, { playerId: bob.user.id }).expect(200);

        await alice.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        expect((await mallory.get(`/api/games/${gameId}`).expect(200)).body.ownerId).toBe(mallory.user.id);
    });

    // Review finding: the fallback owner may not be in the game, and must still be able to act as admin
    it('lets a new admin who was removed from the game use admin actions', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob]);
        const ghost = (await alice.post(`/api/games/${gameId}/addPlayer`, { playerName: 'Ghost' }).expect(200))
            .body.players.find(p => p.name === 'Ghost');
        await alice.post(`/api/games/${gameId}/removePlayer`, { playerId: bob.user.id }).expect(200);

        await alice.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        await bob.post(`/api/games/${gameId}/submitScoreForPlayer`, { playerId: ghost.userId, score: 10 }).expect(200);
    });

    // Review finding: the derived owner of an old lobby must not change when the creator rejoins
    it('keeps the derived admin of an old lobby when its creator rejoins', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob]);
        await alice.post(`/api/lobbies/${lobby.id}/leave`).expect(204);
        await Lobby.updateOne({ _id: lobby.id }, { $unset: { ownerId: 1 } });
        await bob.get(`/api/games/${gameId}`).expect(200);

        await alice.post(`/api/lobbies/${lobby.id}/join`).expect(200);

        expect((await bob.get(`/api/games/${gameId}`).expect(200)).body.ownerId).toBe(bob.user.id);
    });

    it('keeps the owner when someone else leaves', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob]);

        await bob.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        expect((await alice.get(`/api/games/${gameId}`).expect(200)).body.ownerId).toBe(alice.user.id);
        expect(ownerChanges()).toEqual([]);
    });

    it('makes the first player admin of an old lobby whose creator already left', async () => {
        const { lobby, gameId } = await createLobbyWith(alice, [bob]);
        await alice.post(`/api/lobbies/${lobby.id}/leave`).expect(204);
        await Lobby.updateOne({ _id: lobby.id }, { $unset: { ownerId: 1 } });

        expect((await bob.get(`/api/games/${gameId}`).expect(200)).body.ownerId).toBe(bob.user.id);
        await bob.post(`/api/games/${gameId}/addPlayer`, { playerName: 'Ghost' }).expect(200);
    });
});
