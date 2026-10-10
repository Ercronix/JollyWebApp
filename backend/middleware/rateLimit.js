'use strict';

const { rateLimit } = require('express-rate-limit');

/**
 * Limits failed login/register/secure attempts per IP, against password guessing.
 * Successful requests don't count, so a group joining from one Wi-Fi isn't blocked.
 */
function createAuthLimiter({ max, windowMs }) {
    return rateLimit({
        windowMs,
        limit: max,
        skipSuccessfulRequests: true,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { message: 'Too many attempts. Please wait a minute and try again.' },
    });
}

module.exports = { createAuthLimiter };
