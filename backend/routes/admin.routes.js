const express = require('express');
const Default = require('../controllers/default.controller');
const { requireAuth, validateObjectId } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth());
router.param('gameId', validateObjectId);

router.post('/games/:gameId/forceNextRound', Default.forceNextRoundPOST);

module.exports = router;
