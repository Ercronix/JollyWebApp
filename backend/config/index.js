module.exports = {
    env: process.env.NODE_ENV || 'development',

    mongodb: {
        uri: process.env.MONGODB_URI
    },

    session: {
        secret: process.env.SESSION_SECRET,
        durationHours: 24,
        get durationMs() {
            return this.durationHours * 60 * 60 * 1000;
        }
    },

    game: {
        pointsGoal: 1000,
        maxPlayers: 8
    },

    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
    }
};