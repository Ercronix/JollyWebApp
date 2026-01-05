const express = require('express');
const Default = require('../controllers/default.controller');
const router = express.Router();

router.post('/games/:gameId/forceNextRound', Default.forceNextRoundPOST);

module.exports = router;
