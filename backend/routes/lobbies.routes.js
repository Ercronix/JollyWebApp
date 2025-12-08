const express = require('express');
const Default = require('../controllers/default.controller');
const router = express.Router();

router.get('/', Default.listLobbiesGET);
router.post('/', Default.createLobbyPOST);
router.post('/:lobbyId/join', Default.joinLobbyPOST);
router.delete('/:lobbyId', Default.deleteLobbyDELETE);

module.exports = router;