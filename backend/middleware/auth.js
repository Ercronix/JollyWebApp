'use strict';

const mongoose = require('mongoose');
const UsersService = require('../service/UsersService');

function getSessionId(req) {
    return req.cookies?.sessionId || req.headers['x-session-id'];
}

/**
 * Resolves the session to req.user, or responds 401.
 * allowQueryToken lets EventSource connections (which cannot send headers) authenticate via ?sessionId=.
 */
function requireAuth({ allowQueryToken = false } = {}) {
    return async (req, res, next) => {
        try {
            let sessionId = getSessionId(req);
            if (!sessionId && allowQueryToken) {
                sessionId = req.query.sessionId;
            }

            const user = await UsersService.getUserBySession(sessionId);
            if (!user) {
                return res.status(401).json({ message: 'Not authenticated' });
            }

            req.user = user;
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * router.param handler that rejects malformed MongoDB ids with 400 instead of a cast error.
 */
function validateObjectId(req, res, next, value, name) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({ message: `Invalid ${name}` });
    }
    next();
}

module.exports = { getSessionId, requireAuth, validateObjectId };
