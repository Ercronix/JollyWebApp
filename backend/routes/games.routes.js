const express = require('express');
const Default = require('../controllers/default.controller');
const { requireAuth, validateObjectId } = require('../middleware/auth');
const router = express.Router();

router.param('gameId', validateObjectId);

// SSE: EventSource cannot send custom headers, so it may authenticate via ?sessionId=
router.options('/:gameId/events', (req, res) => res.sendStatus(204));
router.get('/:gameId/events', requireAuth({ allowQueryToken: true }), Default.subscribeToGameEventsGET);

router.use(requireAuth());

router.get('/:gameId', Default.getGameStateGET);
router.post('/:gameId/submitScore', Default.submitScorePOST);
router.post('/:gameId/nextRound', Default.nextRoundPOST);
router.post('/:gameId/reorderPlayers', Default.reorderPlayersPOST);
router.post('/:gameId/resetRound', Default.resetRoundPOST);
router.post('/:gameId/submitWinCondition', Default.submitWinConditionPOST);
router.post('/:gameId/updateHistoryScore', Default.updateHistoryScorePOST);
router.post('/:gameId/addPlayer', Default.addPlayerToGamePOST);
router.post('/:gameId/removePlayer', Default.removePlayerFromGamePOST);
router.post('/:gameId/submitScoreForPlayer', Default.submitScoreForPlayerPOST);

module.exports = router;
