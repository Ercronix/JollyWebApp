const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    { ignores: ['node_modules/', 'backups/'] },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: globals.node,
        },
    },
    {
        files: ['**/*.mjs'],
        languageOptions: {
            sourceType: 'module',
            globals: globals.node,
        },
    },
    {
        rules: {
            // Express error handlers must declare all four parameters
            'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_|^next$' }],
        },
    },
];
