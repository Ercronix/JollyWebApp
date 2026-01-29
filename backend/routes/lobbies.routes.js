const express = require('express');
const Default = require('../controllers/default.controller');
const router = express.Router();

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