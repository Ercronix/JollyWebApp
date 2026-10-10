import { describe, it, expect } from 'vitest';
import { request, app, loginAs, asUser, requireApp } from './helpers.mjs';

const Session = requireApp('../models/Session');

describe('login', () => {
    it('creates a passwordless account with a discriminator tag', async () => {
        const res = await request(app).post('/users/login').send({ username: 'Alice' }).expect(200);

        expect(res.body.user.fullTag).toMatch(/^Alice#\d{4}$/);
        expect(res.body.isNewAccount).toBe(true);
        expect(res.body.sessionId).toMatch(/^[0-9a-f]{64}$/);
    });

    it('sets an httpOnly session cookie', async () => {
        const res = await request(app).post('/users/login').send({ username: 'Alice' }).expect(200);

        const cookie = res.headers['set-cookie'].join(';');
        expect(cookie).toContain('sessionId=');
        expect(cookie).toContain('HttpOnly');
    });

    it('logs back into a passwordless account by its full tag', async () => {
        const first = await loginAs('Alice');

        const res = await request(app).post('/users/login').send({ username: first.user.fullTag }).expect(200);

        expect(res.body.user.id).toBe(first.user.id);
        expect(res.body.isNewAccount).toBeUndefined();
    });

    it('refuses tag login for password-protected accounts', async () => {
        const reg = await request(app).post('/users/register').send({ username: 'Carol', password: 'secret1' }).expect(200);

        await request(app).post('/users/login').send({ username: reg.body.user.fullTag }).expect(403);
    });

    it('rejects non-string usernames (NoSQL injection)', async () => {
        await request(app).post('/users/login').send({ username: { $ne: null } }).expect(400);
        await request(app).post('/users/login').send({ username: 'Carol', password: { $ne: null } }).expect(400);
    });

    it('rejects overly long usernames', async () => {
        await request(app).post('/users/login').send({ username: 'x'.repeat(31) }).expect(400);
    });
});

describe('register', () => {
    it('allows password login after registering', async () => {
        await request(app).post('/users/register').send({ username: 'Carol', password: 'secret1' }).expect(200);

        await request(app).post('/users/login').send({ username: 'Carol', password: 'secret1' }).expect(200);
        await request(app).post('/users/login').send({ username: 'Carol', password: 'wrong' }).expect(401);
    });

    it('rejects a second password-protected account with the same name', async () => {
        await request(app).post('/users/register').send({ username: 'Carol', password: 'secret1' }).expect(200);

        await request(app).post('/users/register').send({ username: 'Carol', password: 'other1' }).expect(409);
    });

    it('rejects names containing "#" and too short passwords', async () => {
        await request(app).post('/users/register').send({ username: 'a#1', password: 'secret1' }).expect(400);
        await request(app).post('/users/register').send({ username: 'Dave', password: 'abc' }).expect(400);
    });
});

describe('sessions', () => {
    it('resolves the current user from the session', async () => {
        const alice = await loginAs('Alice');

        const res = await alice.get('/users/me').expect(200);

        expect(res.body.id).toBe(alice.user.id);
    });

    it('accepts the session cookie as well as the header', async () => {
        const login = await request(app).post('/users/login').send({ username: 'Alice' });

        await request(app).get('/api/lobbies').set('Cookie', login.headers['set-cookie']).expect(200);
    });

    it('stores sessions hashed in the database, not as the raw token', async () => {
        const alice = await loginAs('Alice');

        const stored = await Session.find();
        expect(stored).toHaveLength(1);
        expect(stored[0].sessionId).not.toBe(alice.sessionId);
    });

    it('rejects expired sessions', async () => {
        const alice = await loginAs('Alice');
        await Session.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });

        await alice.get('/api/lobbies').expect(401);
    });

    it('invalidates the session on logout', async () => {
        const alice = await loginAs('Alice');

        await alice.post('/users/logout').expect(204);

        await alice.get('/api/lobbies').expect(401);
    });

    it.each([
        ['GET', '/api/lobbies'],
        ['GET', '/api/lobbies/history'],
        ['POST', '/api/lobbies'],
        ['GET', '/api/games/000000000000000000000000'],
        ['POST', '/api/games/000000000000000000000000/submitScore'],
        ['POST', '/admin/games/000000000000000000000000/forceNextRound'],
    ])('requires a session for %s %s', async (method, path) => {
        await request(app)[method.toLowerCase()](path).expect(401);
        await asUser('not-a-real-session', null)[method.toLowerCase()](path).expect(401);
    });
});

describe('securing an account', () => {
    it('adds a password while keeping the tag', async () => {
        const bob = await loginAs('Bob');

        const res = await bob.post('/users/secure', { password: 'secret1' }).expect(200);

        expect(res.body).toMatchObject({ id: bob.user.id, fullTag: bob.user.fullTag, hasPassword: true });
        const login = await request(app).post('/users/login').send({ username: 'Bob', password: 'secret1' }).expect(200);
        expect(login.body.user.id).toBe(bob.user.id);
        await request(app).post('/users/login').send({ username: bob.user.fullTag }).expect(403);
    });

    it('refuses an account that already has a password', async () => {
        const bob = await loginAs('Bob');
        await bob.post('/users/secure', { password: 'secret1' }).expect(200);

        await bob.post('/users/secure', { password: 'secret2' }).expect(409);
    });

    it('refuses a username another account already protected', async () => {
        await request(app).post('/users/register').send({ username: 'Bob', password: 'pw1234' }).expect(200);
        const bob = await loginAs('Bob');

        await bob.post('/users/secure', { password: 'secret1' }).expect(409);
    });

    it('rejects a short password', async () => {
        const bob = await loginAs('Bob');

        await bob.post('/users/secure', { password: 'abc' }).expect(400);
    });

    it('requires a session', async () => {
        await request(app).post('/users/secure').send({ password: 'secret1' }).expect(401);
    });

    it('reports whether the account has a password', async () => {
        const bob = await loginAs('Bob');
        expect(bob.user.hasPassword).toBe(false);

        const me = await bob.get('/users/me').expect(200);

        expect(me.body.hasPassword).toBe(false);
    });
});
