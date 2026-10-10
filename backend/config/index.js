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

    // Failed login/register/secure attempts per IP; tests log in far more often than people do
    authRateLimit: {
        max: process.env.NODE_ENV === 'test' ? 10000 : 10,
        windowMs: 60 * 1000
    },

    // Number of reverse proxies in front of the backend, so rate limits see the client's IP
    trustProxy: process.env.TRUST_PROXY,

    game: {
        pointsGoal: 1000,
        maxPlayers: 8
    },

    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true
    }
};