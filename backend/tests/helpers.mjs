import { createRequire } from 'node:module';
import request from 'supertest';

// Load app code through Node's require (not Vitest's module loader), so every
// module, including the mongoose models, is only instantiated once
export const requireApp = createRequire(import.meta.url);
const app = requireApp('../app');

/**
 * Logs in (creating a passwordless account) and returns an api client bound to that session
 */
export async function loginAs(username) {
    const res = await request(app).post('/users/login').send({ username }).expect(200);
    return asUser(res.body.sessionId, res.body.user);
}

export function asUser(sessionId, user) {
    const withSession = (req) => req.set('x-session-id', sessionId);
    return {
        user,
        sessionId,
        get: (path) => withSession(request(app).get(path)),
        post: (path, body) => withSession(request(app).post(path)).send(body ?? {}),
        delete: (path) => withSession(request(app).delete(path)),
    };
}

/**
 * Creates a lobby owned by `owner`, has every other client join it, and returns { lobby, gameId }
 */
export async function createLobbyWith(owner, others = [], body = {}) {
    const lobby = (await owner.post('/api/lobbies', { name: 'Test lobby', ...body }).expect(201)).body;
    for (const client of others) {
        await client.post(`/api/lobbies/${lobby.id}/join`).expect(200);
    }
    return { lobby, gameId: lobby.gameId };
}

export { app, request };
