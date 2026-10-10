import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { app, loginAs, createLobbyWith, requireApp } from './helpers.mjs';

const Lobby = requireApp('../models/Lobby');

let alice, bob, mallory, gameId;

const game = async () => (await alice.get(`/api/games/${gameId}`).expect(200)).body;
const player = async (client) => (await game()).players.find(p => p.userId === client.user.id);

async function playRound(scores) {
    for (const [client, score] of scores) {
        await client.post(`/api/games/${gameId}/submitScore`, { score }).expect(200);
    }
    return (await alice.post(`/api/games/${gameId}/nextRound`).expect(200)).body;
}

beforeEach(async () => {
    alice = await loginAs('Alice');
    bob = await loginAs('Bob');
    mallory = await loginAs('Mallory');
    ({ gameId } = await createLobbyWith(alice, [bob]));
});

describe('access control', () => {
    it.each([
        ['submitScore', { score: 10 }],
        ['nextRound', {}],
        ['resetRound', {}],
        ['reorderPlayers', { fromIndex: 0, toIndex: 1 }],
        ['submitWinCondition', { winCondition: 500 }],
        ['updateHistoryScore', { roundIndex: 0, newScore: 10 }],
        ['addPlayer', { playerName: 'Ghost' }],
        ['removePlayer', { playerId: 'x' }],
        ['submitScoreForPlayer', { playerId: 'x', score: 10 }],
    ])('forbids non-players from %s', async (action, body) => {
        await mallory.post(`/api/games/${gameId}/${action}`, body).expect(403);
    });

    it('forbids non-players from forcing the next round', async () => {
        await mallory.post(`/admin/games/${gameId}/forceNextRound`).expect(403);
    });

    it('forbids outsiders from reading a private game', async () => {
        const { gameId: privateGameId } = await createLobbyWith(alice, [], { isPrivate: true });

        await mallory.get(`/api/games/${privateGameId}`).expect(403);
        await mallory.get(`/api/games/${privateGameId}/events?sessionId=${mallory.sessionId}`).expect(403);
    });

    it('lets anyone read a public game', async () => {
        await mallory.get(`/api/games/${gameId}`).expect(200);
    });

    it('lets a former participant read a private game', async () => {
        const { lobby, gameId: privateGameId } = await createLobbyWith(alice, [], { isPrivate: true });
        await bob.post('/api/lobbies/join-by-code', { accessCode: lobby.accessCode }).expect(200);

        await bob.post(`/api/lobbies/${lobby.id}/leave`).expect(204);

        await bob.get(`/api/games/${privateGameId}`).expect(200);
    });

    it('returns 400 for a malformed game id and 404 for an unknown one', async () => {
        await alice.get('/api/games/not-an-id').expect(400);
        await alice.get('/api/games/000000000000000000000000').expect(404);
    });
});

describe('submitting scores', () => {
    it('records the score for the session user, ignoring playerId in the body', async () => {
        const res = await alice.post(`/api/games/${gameId}/submitScore`, { score: 20, playerId: bob.user.id }).expect(200);

        expect(res.body.player.userId).toBe(alice.user.id);
        expect((await player(bob)).hasSubmitted).toBe(false);
    });

    it.each([7, 2.5, '10', null, 1e9])('rejects invalid score %j', async (score) => {
        await alice.post(`/api/games/${gameId}/submitScore`, { score }).expect(400);
    });

    it('accepts negative scores divisible by 5', async () => {
        await alice.post(`/api/games/${gameId}/submitScore`, { score: -25 }).expect(200);
    });

    it('rejects a second submission in the same round', async () => {
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);

        await alice.post(`/api/games/${gameId}/submitScore`, { score: 20 }).expect(400);
    });
});

describe('rounds', () => {
    it('adds the round scores to the totals and history, and rotates the dealer', async () => {
        const before = await game();

        const res = await playRound([[alice, 10], [bob, 25]]);

        expect(res.game.currentRound).toBe(2);
        expect(await player(alice)).toMatchObject({ totalScore: 10, pointsHistory: [10], hasSubmitted: false });
        expect(await player(bob)).toMatchObject({ totalScore: 25, pointsHistory: [25], hasSubmitted: false });
        expect(before.currentDealer).toBe(alice.user.id);
        expect(res.game.currentDealer).toBe(bob.user.id);
    });

    it('refuses to advance before everyone submitted', async () => {
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);

        await alice.post(`/api/games/${gameId}/nextRound`).expect(400);
    });

    // Regression: issue #13 "Failed to submit points on random occasions" -
    // one failed operation used to lock the game for everyone until a restart
    it('keeps working after a failed operation', async () => {
        await alice.post(`/api/games/${gameId}/nextRound`).expect(400);

        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);
        await bob.post(`/api/games/${gameId}/submitScore`, { score: 15 }).expect(200);
        await alice.post(`/api/games/${gameId}/nextRound`).expect(200);
    });

    // Every client with auto-advance enabled requests the next round at the same time
    it('advances exactly one round when several clients request it concurrently', async () => {
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);
        await bob.post(`/api/games/${gameId}/submitScore`, { score: 15 }).expect(200);

        const results = await Promise.all([
            alice.post(`/api/games/${gameId}/nextRound`),
            bob.post(`/api/games/${gameId}/nextRound`),
            alice.post(`/api/games/${gameId}/nextRound`),
        ]);

        expect(results.map(r => r.status).sort()).toEqual([200, 400, 400]);
        expect((await game()).currentRound).toBe(2);
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 5 }).expect(200);
    });

    // Review finding: an admin who stops responding (without leaving) must not block the game
    it('lets any player force the next round, counting missing scores as 0', async () => {
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);

        await bob.post(`/admin/games/${gameId}/forceNextRound`).expect(200);

        expect(await player(bob)).toMatchObject({ totalScore: 0, pointsHistory: [0] });
    });

    it('resets the submissions of the current round', async () => {
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(200);

        await bob.post(`/api/games/${gameId}/resetRound`).expect(200);

        expect(await player(alice)).toMatchObject({ hasSubmitted: false, currentRoundScore: 0 });
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 20 }).expect(200);
    });
});

describe('ending the game', () => {
    it('ends the game when a player reaches the win condition', async () => {
        await alice.post(`/api/games/${gameId}/submitWinCondition`, { winCondition: 100 }).expect(200);

        const res = await playRound([[alice, 100], [bob, 50]]);

        expect(res.game).toMatchObject({ isFinished: true, winner: alice.user.id });
        await alice.post(`/api/games/${gameId}/submitScore`, { score: 10 }).expect(400);
    });

    it.each([99, 10001, 150.5])('rejects win condition %j', async (winCondition) => {
        await alice.post(`/api/games/${gameId}/submitWinCondition`, { winCondition }).expect(400);
    });
});

describe('editing history', () => {
    it('updates the requesting player\'s own round score and total', async () => {
        await playRound([[alice, 10], [bob, 20]]);

        await alice.post(`/api/games/${gameId}/updateHistoryScore`, { roundIndex: 0, newScore: 30, playerId: bob.user.id }).expect(200);

        expect(await player(alice)).toMatchObject({ totalScore: 30, pointsHistory: [30] });
        expect(await player(bob)).toMatchObject({ totalScore: 20, pointsHistory: [20] });
    });

    it('rejects rounds that have not been played', async () => {
        await alice.post(`/api/games/${gameId}/updateHistoryScore`, { roundIndex: 0, newScore: 30 }).expect(400);
    });
});

describe('player management', () => {
    it('adds temporary players that the admin can submit scores for', async () => {
        const res = await alice.post(`/api/games/${gameId}/addPlayer`, { playerName: 'Grandma' }).expect(200);
        const temp = res.body.players.find(p => p.name === 'Grandma');

        expect(temp.isTemporary).toBe(true);
        await alice.post(`/api/games/${gameId}/submitScoreForPlayer`, { playerId: temp.userId, score: 15 }).expect(200);
    });

    it('gives late-joining players a zero-filled history so they can submit', async () => {
        await playRound([[alice, 10], [bob, 20]]);
        const res = await alice.post(`/api/games/${gameId}/addPlayer`, { playerName: 'Late' }).expect(200);
        const late = res.body.players.find(p => p.name === 'Late');

        expect(late.pointsHistory).toEqual([0]);
        await alice.post(`/api/games/${gameId}/submitScoreForPlayer`, { playerId: late.userId, score: 5 }).expect(200);
    });

    it('rejects duplicate player names', async () => {
        await alice.post(`/api/games/${gameId}/addPlayer`, { playerName: 'alice' }).expect(400);
    });

    it('removes players and hands the dealer role on', async () => {
        await alice.post(`/api/games/${gameId}/reorderPlayers`, { fromIndex: 1, toIndex: 0 }).expect(200);

        await alice.post(`/api/games/${gameId}/removePlayer`, { playerId: bob.user.id }).expect(200);

        const after = (await alice.get(`/api/games/${gameId}`)).body;
        expect(after.players.map(p => p.userId)).toEqual([alice.user.id]);
        expect(after.currentDealer).toBe(alice.user.id);
    });

    it('reorders players and makes the first one dealer', async () => {
        const res = await alice.post(`/api/games/${gameId}/reorderPlayers`, { fromIndex: 1, toIndex: 0 }).expect(200);

        expect(res.body.players.map(p => p.userId)).toEqual([bob.user.id, alice.user.id]);
        expect(res.body.currentDealer).toBe(bob.user.id);
        await alice.post(`/api/games/${gameId}/reorderPlayers`, { fromIndex: 0, toIndex: 5 }).expect(400);
    });
});

describe('live events', () => {
    let server, baseUrl;

    beforeAll(async () => {
        server = app.listen(0);
        await new Promise(resolve => server.once('listening', resolve));
        baseUrl = `http://127.0.0.1:${server.address().port}`;
    });

    afterAll(() => new Promise(resolve => server.close(resolve)));

    // Opens the stream, reads the first event and closes the connection
    async function firstEvent(path, headers = {}) {
        const controller = new AbortController();
        const res = await fetch(baseUrl + path, { headers, signal: controller.signal });
        if (res.status !== 200) {
            return { status: res.status };
        }
        const reader = res.body.getReader();
        const { value } = await reader.read();
        controller.abort();
        return { status: res.status, type: res.headers.get('content-type'), data: new TextDecoder().decode(value) };
    }

    it('streams events to authenticated clients', async () => {
        const res = await firstEvent(`/api/games/${gameId}/events`, { 'x-session-id': alice.sessionId });

        expect(res.status).toBe(200);
        expect(res.type).toContain('text/event-stream');
        expect(res.data).toContain('"type":"CONNECTED"');
    });

    it('accepts the session as a query parameter (EventSource cannot send headers)', async () => {
        const res = await firstEvent(`/api/games/${gameId}/events?sessionId=${alice.sessionId}`);

        expect(res.status).toBe(200);
    });

    it('rejects unauthenticated clients', async () => {
        expect((await firstEvent(`/api/games/${gameId}/events`)).status).toBe(401);
    });
});

describe('lobby admin', () => {
    it('reports the owner in the game state', async () => {
        expect((await game()).ownerId).toBe(alice.user.id);
    });

    it.each([
        ['/api/games/:id/addPlayer', { playerName: 'Ghost' }],
        ['/api/games/:id/removePlayer', () => ({ playerId: alice.user.id })],
        ['/api/games/:id/submitScoreForPlayer', () => ({ playerId: alice.user.id, score: 10 })],
    ])('forbids other players from %s', async (path, body) => {
        const res = await bob.post(path.replace(':id', gameId), typeof body === 'function' ? body() : body).expect(403);

        expect(res.body.message).toBe('Only the lobby admin can do this');
    });

    it('does not let the admin remove themselves', async () => {
        const res = await alice.post(`/api/games/${gameId}/removePlayer`, { playerId: alice.user.id }).expect(400);

        expect(res.body.message).toBe('Use Leave to leave the lobby');
    });

    it('treats the creator of a lobby from before owners were tracked as admin', async () => {
        await Lobby.updateOne({ gameId }, { $unset: { ownerId: 1 } });

        await alice.post(`/api/games/${gameId}/addPlayer`, { playerName: 'Ghost' }).expect(200);
        expect((await game()).ownerId).toBe(alice.user.id);
    });
});
