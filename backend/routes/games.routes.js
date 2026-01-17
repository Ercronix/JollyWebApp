const express = require('express');
const Default = require('../controllers/default.controller');
const router = express.Router();

router.get('/:gameId', Default.getGameStateGET);
router.post('/:gameId/submitScore', Default.submitScorePOST);
router.post('/:gameId/nextRound', Default.nextRoundPOST);
router.post('/:gameId/reorderPlayers', Default.reorderPlayersPOST);
router.post('/:gameId/resetRound', Default.resetRoundPOST);
router.post('/:gameId/submitWinCondition', Default.submitWinConditionPOST);
router.post('/:gameId/updateHistoryScore', Default.updateHistoryScorePOST);

// SSE
router.options('/:gameId/events', (req, res) => res.sendStatus(204));
router.get('/:gameId/events', Default.subscribeToGameEventsGET);

module.exports = router;
