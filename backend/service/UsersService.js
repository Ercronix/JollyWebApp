'use strict';

const { v4: uuidv4 } = require('uuid');

class UsersService {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
    }

    createUser(username) {
        const user = {
            id: uuidv4(),
            username,
            createdAt: new Date().toISOString()
        };
        this.users.set(user.id, user);
        return user;
    }

    getUserById(userId) {
        return this.users.get(userId);
    }

    getUserByUsername(username) {
        return Array.from(this.users.values()).find(u => u.username === username);
    }

    loginUser(username) {
        let user = this.getUserByUsername(username);
        if (!user) {
            user = this.createUser(username);
        }
        const sessionId = uuidv4();
        this.sessions.set(sessionId, user.id);
        return { user, sessionId };
    }

    getUserBySession(sessionId) {
        const userId = this.sessions.get(sessionId);
        return userId ? this.users.get(userId) : null;
    }

    logoutUser(sessionId) {
        this.sessions.delete(sessionId);
    }
}

module.exports = new UsersService();