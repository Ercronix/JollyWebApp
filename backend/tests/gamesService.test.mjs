import { describe, it, expect } from 'vitest';
import { requireApp } from './helpers.mjs';

const GamesService = requireApp('../service/GamesService');

const deferred = () => {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
};

describe('queueOperation', () => {
    it('runs operations for the same game one after another', async () => {
        const order = [];
        const gate = deferred();

        const first = GamesService.queueOperation('queue-a', async () => {
            await gate.promise;
            order.push('first');
        });
        const second = GamesService.queueOperation('queue-a', async () => order.push('second'));

        gate.resolve();
        await Promise.all([first, second]);
        expect(order).toEqual(['first', 'second']);
    });

    // Regression: issue #13 - a rejected operation used to poison the queue for the game
    it('passes errors to the caller and keeps the queue usable', async () => {
        await expect(GamesService.queueOperation('queue-b', async () => {
            throw new Error('boom');
        })).rejects.toThrow('boom');

        await expect(GamesService.queueOperation('queue-b', async () => 'ok')).resolves.toBe('ok');
    });
});

describe('isPlayer', () => {
    const game = {
        players: [
            { userId: 'aaa', isTemporary: false },
            { userId: 'tmp', isTemporary: true },
        ],
    };

    it('accepts real players and rejects temporary players and outsiders', () => {
        expect(GamesService.isPlayer(game, 'aaa')).toBe(true);
        expect(GamesService.isPlayer(game, 'tmp')).toBe(false);
        expect(GamesService.isPlayer(game, 'zzz')).toBe(false);
    });
});
