const express = require('express');
const router = express.Router();

router.use('/users', require('./users.routes'));
router.use('/api/lobbies', require('./lobbies.routes'));
router.use('/api/games', require('./games.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
