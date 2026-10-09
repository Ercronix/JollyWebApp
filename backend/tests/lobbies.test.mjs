import { describe, it, expect, beforeEach } from 'vitest';
import { loginAs, createLobbyWith } from './helpers.mjs';

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
