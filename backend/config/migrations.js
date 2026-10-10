'use strict';

const User = require('../models/User');

// MongoDB error codes for "index not found" and "collection doesn't exist"
const INDEX_NOT_FOUND = 27;
const NAMESPACE_NOT_FOUND = 26;

/**
 * Indexes that were removed from the schemas. Mongoose creates indexes but never drops them.
 */
async function dropLegacyIndexes() {
    try {
        // Unique index on protected usernames: names are shared now, name + password must be unique
        await User.collection.dropIndex('username_1');
        console.log('[Migrations] Dropped legacy index users.username_1');
    } catch (error) {
        if (error.code !== INDEX_NOT_FOUND && error.code !== NAMESPACE_NOT_FOUND) throw error;
    }
}

module.exports = { dropLegacyIndexes };
