'use strict';

const utils = require('../utils/writer.js');
const Default = require('../service/DefaultService');

function getSessionId(req) {
    return req.cookies?.sessionId || req.headers['x-session-id'];
}

module.exports = {
    createLobbyPOST(req, res) {
        Default.createLobbyPOST(req.body)
            .then(r => utils.writeJson(res, r, 201))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    deleteLobbyDELETE(req, res) {
        Default.deleteLobbyDELETE(req.body, req.params.lobbyId)
            .then(() => res.sendStatus(204))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    archiveLobbyPOST(req, res) {
        Default.archiveLobbyPOST(req.body, req.params.lobbyId)
            .then(() => res.sendStatus(204))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    forceNextRoundPOST(req, res) {
        Default.forceNextRoundPOST(req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    getCurrentUserGET(req, res) {
        Default.getCurrentUserGET(getSessionId(req))
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    getGameStateGET(req, res) {
        Default.getGameStateGET(req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    joinLobbyPOST(req, res) {
        Default.joinLobbyPOST(req.body, req.params.lobbyId)
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    listLobbiesGET(req, res) {
        Default.listLobbiesGET()
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    loginUserPOST(req, res) {
        Default.loginUserPOST(req.body)
            .then(r => {
                res.cookie('sessionId', r.sessionId, {
                    httpOnly: true,
                    maxAge: 24 * 60 * 60 * 1000,
                    sameSite: 'lax'
                });
                utils.writeJson(res, r);
            })
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    logoutUserPOST(req, res) {
        Default.logoutUserPOST(getSessionId(req))
            .then(() => {
                res.clearCookie('sessionId');
                res.sendStatus(204);
            })
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    nextRoundPOST(req, res) {
        Default.nextRoundPOST(req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    reorderPlayersPOST(req, res) {
        Default.reorderPlayersPOST(req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    resetRoundPOST(req, res) {
        Default.resetRoundPOST(req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    submitScorePOST(req, res) {
        Default.submitScorePOST(req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => utils.writeJson(res, e, e.status || 500));
    },

    subscribeToGameEventsGET(req, res) {
        Default.subscribeToGameEventsGET(req, res);
    }
};