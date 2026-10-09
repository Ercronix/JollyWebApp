import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.mjs'],
        globalSetup: ['tests/setup/globalSetup.js'],
        setupFiles: ['tests/setup/db.mjs'],
        env: { NODE_ENV: 'test' },
        // The in-memory MongoDB binary is downloaded on the first run
        hookTimeout: 120000,
    },
});
