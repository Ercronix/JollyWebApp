const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const config = require('../config');
const crypto = require('crypto');
const OperationQueue = require('../utils/operationQueue');

const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 4;
const PASSWORD_MAX_LENGTH = 72; // bcrypt ignores everything beyond 72 bytes

// Names are shared, and name + password identifies an account, so each pair must be unique.
// Setting a password is serialized per name, so two concurrent requests can't create the same pair.
const passwordQueue = new OperationQueue('UsersService');
const DUPLICATE_PASSWORD = { status: 409, message: 'Please choose a different password.' };

/**
 * The password-protected account with this name and password, if any
 */
async function findByNameAndPassword(username, password) {
    const candidates = await User.find({ username, password: mongoose.trusted({ $ne: null }) });
    for (const user of candidates) {
        if (await user.comparePassword(password)) return user;
    }
    return null;
}

/**
 * Sessions are stored hashed, so a database leak does not expose usable session tokens
 */
function hashSessionId(sessionId) {
    return crypto.createHash('sha256').update(sessionId).digest('hex');
}

async function createSession(userId) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    await Session.create({
        sessionId: hashSessionId(sessionId),
        userId,
        expiresAt: new Date(Date.now() + config.session.durationMs)
    });
    return sessionId;
}

function toUserResponse(user) {
    return {
        id: user._id.toString(),
        username: user.username,
        fullTag: user.fullTag,
        hasPassword: !!user.password,
        createdAt: user.createdAt
    };
}

/**
 * Validates a username for login or account creation
 */
function validateUsername(username, { allowTag = false } = {}) {
    if (typeof username !== 'string') {
        throw { status: 400, message: 'Username is required' };
    }

    const trimmed = username.trim();
    // A full tag ("Name#1234") may be up to 5 characters longer than a plain name
    const isTag = allowTag && trimmed.includes('#');
    if (trimmed.length < 1 || trimmed.length > USERNAME_MAX_LENGTH + (isTag ? 5 : 0)) {
        throw { status: 400, message: `Username must be between 1 and ${USERNAME_MAX_LENGTH} characters` };
    }

    if (!allowTag && trimmed.includes('#')) {
        throw { status: 400, message: 'Username must not contain "#"' };
    }

    return trimmed;
}

function validatePassword(password) {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
        throw { status: 400, message: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters` };
    }
    return password;
}

/**
 * Generate a random 4-digit discriminator
 */
function generateDiscriminator() {
    return String(crypto.randomInt(1000, 10000));
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
 * 2. fullTag (e.g., "Tim#4523"), plus the password if the account has one
 * 3. username only (creates new account with random discriminator)
 */
module.exports.loginUser = async function(rawUsername, password = null) {
    try {
        const username = validateUsername(rawUsername, { allowTag: true });

        // Case 1: Check if input contains # (fullTag format)
        if (username.includes('#')) {
            const user = await User.findOne({ fullTag: username });

            if (!user) {
                throw { status: 404, message: 'Account not found with this tag' };
            }

            if (user.password) {
                if (!password) {
                    throw { status: 403, message: 'This account is password-protected. Please use username + password to login.' };
                }
                if (typeof password !== 'string' || !(await user.comparePassword(password))) {
                    throw { status: 401, message: 'Invalid username or password' };
                }
            }

            return { user: toUserResponse(user), sessionId: await createSession(user._id) };
        }

        // Case 2: Password provided - try to login to password-protected account
        if (password) {
            if (typeof password !== 'string') {
                throw { status: 400, message: 'Invalid username or password' };
            }

            const user = await findByNameAndPassword(username, password);

            if (!user) {
                throw { status: 401, message: 'Invalid username or password' };
            }

            return { user: toUserResponse(user), sessionId: await createSession(user._id) };
        }

        // Case 3: No password - create new account with random discriminator
        const discriminator = await findAvailableDiscriminator(username);

        const newUser = new User({
            username,
            discriminator,
            fullTag: `${username}#${discriminator}`,
            password: null
        });

        await newUser.save();

        return {
            user: toUserResponse(newUser),
            sessionId: await createSession(newUser._id),
            isNewAccount: true
        };

    } catch (error) {
        console.error('[UsersService] Login error:', error.message);
        throw error;
    }
};

/**
 * Register a new user with password protection
 */
module.exports.registerUser = async function(rawUsername, rawPassword) {
    try {
        const username = validateUsername(rawUsername);
        const password = validatePassword(rawPassword);

        const newUser = await passwordQueue.run(username, async () => {
            if (await findByNameAndPassword(username, password)) {
                throw DUPLICATE_PASSWORD;
            }

            const discriminator = await findAvailableDiscriminator(username);
            const user = new User({
                username,
                discriminator,
                fullTag: `${username}#${discriminator}`,
                password
            });
            await user.save();
            return user;
        });

        return { user: toUserResponse(newUser), sessionId: await createSession(newUser._id) };

    } catch (error) {
        console.error('[UsersService] Registration error:', error.message);
        throw error;
    }
};

/**
 * Adds a password to a passwordless account, keeping its tag (and so its games)
 */
module.exports.secureAccount = async function(userId, rawPassword, currentSessionId) {
    const password = validatePassword(rawPassword);

    const user = await User.findById(userId);
    if (!user) {
        throw { status: 404, message: 'Account not found' };
    }
    if (user.password) {
        throw { status: 409, message: 'This account already has a password' };
    }

    await passwordQueue.run(user.username, async () => {
        if (await findByNameAndPassword(user.username, password)) {
            throw DUPLICATE_PASSWORD;
        }
        user.password = password;
        await user.save();
    });

    // Anyone who got in with the (passwordless) tag loses access now
    await Session.deleteMany({
        userId: user._id,
        sessionId: mongoose.trusted({ $ne: hashSessionId(String(currentSessionId)) })
    });

    return toUserResponse(user);
};

/**
 * Get user by session ID
 */
module.exports.getUserBySession = async function(sessionId) {
    if (typeof sessionId !== 'string' || !sessionId) return null;

    // The TTL index removes expired sessions only periodically, so check expiry explicitly
    const session = await Session.findOne({
        sessionId: hashSessionId(sessionId),
        expiresAt: mongoose.trusted({ $gt: new Date() })
    });
    if (!session) return null;

    const user = await User.findById(session.userId);
    if (!user) {
        await Session.deleteOne({ _id: session._id });
        return null;
    }

    return toUserResponse(user);
};

/**
 * Get user by ID
 */
module.exports.getUserById = async function(userId) {
    const user = await User.findById(userId);
    return user ? toUserResponse(user) : null;
};

/**
 * Logout user
 */
module.exports.logoutUser = async function(sessionId) {
    if (typeof sessionId === 'string' && sessionId) {
        await Session.deleteOne({ sessionId: hashSessionId(sessionId) });
    }
};
