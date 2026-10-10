import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireApp } from './helpers.mjs';

const { createAuthLimiter } = requireApp('../middleware/rateLimit');

function appWith(limiter) {
    const app = express();
    app.post('/login', limiter, (req, res) => res.sendStatus(req.query.ok ? 200 : 401));
    return app;
}

describe('auth rate limit', () => {
    it('blocks an IP after too many failed attempts', async () => {
        const app = appWith(createAuthLimiter({ max: 3, windowMs: 60_000 }));

        for (let i = 0; i < 3; i++) {
            await request(app).post('/login').expect(401);
        }

        const res = await request(app).post('/login?ok=1').expect(429);
        expect(res.body.message).toBe('Too many attempts. Please wait a minute and try again.');
    });

    // A group logging in from the same Wi-Fi must not lock itself out
    it('does not count successful attempts', async () => {
        const app = appWith(createAuthLimiter({ max: 3, windowMs: 60_000 }));

        for (let i = 0; i < 10; i++) {
            await request(app).post('/login?ok=1').expect(200);
        }
    });
});
