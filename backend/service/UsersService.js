'use strict';

const User = require('../models/User');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class UsersService {
    constructor() {
        this.SESSION_DURATION = config.session.durationMs;
    }

    async createUser(username) {
        const user = new User({ username });
        await user.save();
        return this.formatUser(user);
    }

    async getUserById(userId) {
        const user = await User.findById(userId);
        return user ? this.formatUser(user) : null;
    }

    async getUserByUsername(username) {
        const user = await User.findOne({ username });
        return user ? this.formatUser(user) : null;
    }

    async loginUser(username) {
        let user = await this.getUserByUsername(username);
        if (!user) {
            user = await this.createUser(username);
        }

        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

        const session = new Session({
            sessionId,
            userId: user.id, // MongoDB ObjectId
            expiresAt
        });

        await session.save();

        return { user, sessionId };
    }

    async getUserBySession(sessionId) {
        const session = await Session.findOne({
            sessionId,
            expiresAt: { $gt: new Date() }
        }).populate('userId');

        if (!session) {
            return null;
        }

        // Refresh session (sliding expiration)
        session.expiresAt = new Date(Date.now() + this.SESSION_DURATION);
        await session.save();

        return this.formatUser(session.userId);
    }

    async logoutUser(sessionId) {
        await Session.deleteOne({ sessionId });
    }

    async cleanupExpiredSessions() {
        const result = await Session.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        console.log(`[UsersService] Cleaned up ${result.deletedCount} expired sessions`);
    }

    // Format user for consistent API responses
    formatUser(user) {
        if (!user) return null;
        return {
            id: user._id.toString(), // Convert ObjectId to string
            username: user.username,
            createdAt: user.createdAt
        };
    }
}

module.exports = new UsersService();