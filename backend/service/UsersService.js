const User = require('../models/User');
const crypto = require('crypto');

// In-memory session store (replace with Redis in production)
const sessions = new Map();

/**
 * Generate a random 4-digit discriminator
 */
function generateDiscriminator() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Find an available discriminator for a username
 */
async function findAvailableDiscriminator(username) {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
        const discriminator = generateDiscriminator();
        const fullTag = `${username}#${discriminator}`;

        const exists = await User.findOne({ fullTag });
        if (!exists) {
            return discriminator;
        }

        attempts++;
    }

    throw new Error('Could not generate unique discriminator');
}

/**
 * Login user with hybrid authentication
 * Supports three modes:
 * 1. username + password (for password-protected accounts)
 * 2. fullTag (e.g., "Tim#4523") without password
 * 3. username only (creates new account with random discriminator)
 */
module.exports.loginUser = async function(username, password = null) {
    try {
        // Case 1: Check if input contains # (fullTag format)
        if (username.includes('#')) {
            const fullTag = username;
            const user = await User.findOne({ fullTag });

            if (!user) {
                throw { status: 404, message: 'Account not found with this tag' };
            }

            if (user.password) {
                throw { status: 403, message: 'This account is password-protected. Please use username + password to login.' };
            }

            // Login successful
            const sessionId = crypto.randomBytes(32).toString('hex');
            sessions.set(sessionId, user._id.toString());

            return {
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    fullTag: user.fullTag,
                    createdAt: user.createdAt
                },
                sessionId
            };
        }

        // Case 2: Password provided - try to login to password-protected account
        if (password) {
            const user = await User.findOne({ username, password: { $ne: null } });

            if (!user) {
                throw { status: 401, message: 'Invalid username or password' };
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw { status: 401, message: 'Invalid username or password' };
            }

            // Login successful
            const sessionId = crypto.randomBytes(32).toString('hex');
            sessions.set(sessionId, user._id.toString());

            return {
                user: {
                    id: user._id.toString(),
                    username: user.username,
                    fullTag: user.fullTag,
                    createdAt: user.createdAt
                },
                sessionId
            };
        }

        // Case 3: No password - create new account with random discriminator
        const discriminator = await findAvailableDiscriminator(username);
        const fullTag = `${username}#${discriminator}`;

        const newUser = new User({
            username,
            discriminator,
            fullTag,
            password: null
        });

        await newUser.save();

        const sessionId = crypto.randomBytes(32).toString('hex');
        sessions.set(sessionId, newUser._id.toString());

        return {
            user: {
                id: newUser._id.toString(),
                username: newUser.username,
                fullTag: newUser.fullTag,
                createdAt: newUser.createdAt
            },
            sessionId,
            isNewAccount: true
        };

    } catch (error) {
        console.error('[UsersService] Login error:', error);
        throw error;
    }
};

/**
 * Register a new user with password protection
 */
module.exports.registerUser = async function(username, password) {
    try {
        // Check if username is already password-protected
        const existingProtected = await User.findOne({
            username,
            password: { $ne: null }
        });

        if (existingProtected) {
            throw { status: 409, message: 'This username is already protected. Please choose a different name or login with your password.' };
        }

        const discriminator = await findAvailableDiscriminator(username);
        const fullTag = `${username}#${discriminator}`;

        const newUser = new User({
            username,
            discriminator,
            fullTag,
            password
        });

        await newUser.save();

        const sessionId = crypto.randomBytes(32).toString('hex');
        sessions.set(sessionId, newUser._id.toString());

        return {
            user: {
                id: newUser._id.toString(),
                username: newUser.username,
                fullTag: newUser.fullTag,
                createdAt: newUser.createdAt
            },
            sessionId
        };

    } catch (error) {
        console.error('[UsersService] Registration error:', error);
        throw error;
    }
};

/**
 * Get user by session ID
 */
module.exports.getUserBySession = async function(sessionId) {
    if (!sessionId) return null;

    const userId = sessions.get(sessionId);
    if (!userId) return null;

    const user = await User.findById(userId);
    if (!user) {
        sessions.delete(sessionId);
        return null;
    }

    return {
        id: user._id.toString(),
        username: user.username,
        fullTag: user.fullTag,
        createdAt: user.createdAt
    };
};

/**
 * Get user by ID
 */
module.exports.getUserById = async function(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    return {
        id: user._id.toString(),
        username: user.username,
        fullTag: user.fullTag,
        createdAt: user.createdAt
    };
};

/**
 * Logout user
 */
module.exports.logoutUser = async function(sessionId) {
    if (sessionId) {
        sessions.delete(sessionId);
    }
};