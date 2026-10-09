const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Liveness/readiness probe for Docker healthchecks and uptime monitoring (no auth)
router.get('/health', (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
        status: connected ? 'ok' : 'error',
        database: connected ? 'connected' : 'disconnected'
    });
});

router.use('/users', require('./users.routes'));
router.use('/api/lobbies', require('./lobbies.routes'));
router.use('/api/games', require('./games.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
