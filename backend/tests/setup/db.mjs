import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { inject, beforeAll, afterAll, beforeEach } from 'vitest';

// Each test file gets its own database, so files can run in parallel
beforeAll(async () => {
    const uri = new URL(inject('mongoUri'));
    uri.pathname = `/jolly-test-${crypto.randomUUID()}`;
    await mongoose.connect(uri.toString());
    await mongoose.connection.syncIndexes();
});

beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map(c => c.deleteMany({})));
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});
