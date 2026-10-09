import { describe, it, expect, afterEach } from 'vitest';
import { request, app, requireApp } from './helpers.mjs';

const mongoose = requireApp('mongoose');

describe('GET /health', () => {
    afterEach(() => {
        // vi.spyOn can't patch the getter on mongoose's own instance, so restore by hand
        delete mongoose.connection.readyState;
    });

    it('reports ok without authentication when the database is connected', async () => {
        const res = await request(app).get('/health').expect(200);

        expect(res.body).toEqual({ status: 'ok', database: 'connected' });
    });

    it('returns 503 when the database is not connected', async () => {
        Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });

        const res = await request(app).get('/health').expect(503);

        expect(res.body).toEqual({ status: 'error', database: 'disconnected' });
    });
});
