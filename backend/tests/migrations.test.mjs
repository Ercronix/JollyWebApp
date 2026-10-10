import { describe, it, expect } from 'vitest';
import { requireApp } from './helpers.mjs';

const User = requireApp('../models/User');
const { dropLegacyIndexes } = requireApp('../config/migrations');

describe('dropLegacyIndexes', () => {
    // The unique index on protected usernames stopped two accounts sharing a name
    it('drops the old unique index on protected usernames, and tolerates it being gone', async () => {
        await User.collection.createIndex(
            { username: 1 },
            { name: 'username_1', unique: true, partialFilterExpression: { password: { $type: 'string' } } }
        );

        await dropLegacyIndexes();
        await dropLegacyIndexes();

        const names = (await User.collection.indexes()).map(i => i.name);
        expect(names).not.toContain('username_1');
    });
});
