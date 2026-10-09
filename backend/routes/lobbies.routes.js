const express = require('express');
const Default = require('../controllers/default.controller');
const { requireAuth, validateObjectId } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth());
router.param('lobbyId', validateObjectId);

router.get('/', Default.listLobbiesGET);
router.post('/', Default.createLobbyPOST);
router.post('/:lobbyId/join', Default.joinLobbyPOST);
router.delete('/:lobbyId', Default.deleteLobbyDELETE);
router.post('/:lobbyId/archive', Default.archiveLobbyPOST);
router.post('/:lobbyId/leave', Default.leaveLobbyPOST);
router.get('/history', Default.listAllLobbiesGET);
router.get('/code/:accessCode', Default.getLobbyByCodeGET);
router.post('/join-by-code', Default.joinLobbyByCodePOST);

module.exports = router;
