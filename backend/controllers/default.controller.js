'use strict';

const utils = require('../utils/writer.js');
const config = require('../config');
const Default = require('../service/DefaultService');
const { getSessionId } = require('../middleware/auth');

// clearCookie only clears the cookie when given the same options it was set with
const sessionCookieOptions = {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
};

function sendError(res, e) {
    const status = e?.status || 500;
    if (status >= 500) {
        console.error('[Controller] Error:', e);
    }
    // Don't leak internal error details to clients
    const message = status >= 500 ? 'Internal Server Error' : e.message;
    utils.writeJson(res, { message }, status);
}

function sendSession(res, r) {
    res.cookie('sessionId', r.sessionId, { ...sessionCookieOptions, maxAge: config.session.durationMs });
    utils.writeJson(res, r);
}

module.exports = {
    loginUserPOST(req, res) {
        Default.loginUserPOST(req.body)
            .then(r => sendSession(res, r))
            .catch(e => sendError(res, e));
    },

    registerUserPOST(req, res) {
        Default.registerUserPOST(req.body)
            .then(r => sendSession(res, r))
            .catch(e => sendError(res, e));
    },

    secureAccountPOST(req, res) {
        Default.secureAccountPOST(req.user, req.body)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    createLobbyPOST(req, res) {
        Default.createLobbyPOST(req.user, req.body)
            .then(r => utils.writeJson(res, r, 201))
            .catch(e => sendError(res, e));
    },

    deleteLobbyDELETE(req, res) {
        Default.deleteLobbyDELETE(req.user, req.params.lobbyId)
            .then(() => res.sendStatus(204))
            .catch(e => sendError(res, e));
    },

    archiveLobbyPOST(req, res) {
        Default.archiveLobbyPOST(req.user, req.params.lobbyId)
            .then(() => res.sendStatus(204))
            .catch(e => sendError(res, e));
    },

    leaveLobbyPOST(req, res) {
        Default.leaveLobbyPOST(req.user, req.params.lobbyId)
            .then(() => res.sendStatus(204))
            .catch(e => sendError(res, e));
    },

    forceNextRoundPOST(req, res) {
        Default.forceNextRoundPOST(req.user, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    getCurrentUserGET(req, res) {
        Default.getCurrentUserGET(getSessionId(req))
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    getGameStateGET(req, res) {
        Default.getGameStateGET(req.user, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    joinLobbyPOST(req, res) {
        Default.joinLobbyPOST(req.user, req.params.lobbyId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    listLobbiesGET(req, res) {
        Default.listLobbiesGET()
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    listAllLobbiesGET(req, res) {
        Default.listAllLobbiesGET(req.user)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    logoutUserPOST(req, res) {
        Default.logoutUserPOST(getSessionId(req))
            .then(() => {
                res.clearCookie('sessionId', sessionCookieOptions);
                res.sendStatus(204);
            })
            .catch(e => sendError(res, e));
    },

    nextRoundPOST(req, res) {
        Default.nextRoundPOST(req.user, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    reorderPlayersPOST(req, res) {
        Default.reorderPlayersPOST(req.user, req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    resetRoundPOST(req, res) {
        Default.resetRoundPOST(req.user, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    submitWinConditionPOST(req, res) {
        Default.submitWinConditionPOST(req.user, req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    submitScorePOST(req, res) {
        Default.submitScorePOST(req.user, req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    subscribeToGameEventsGET(req, res) {
        Default.subscribeToGameEventsGET(req, res);
    },

    updateHistoryScorePOST(req, res) {
        Default.updateHistoryScorePOST(req.user, req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    joinLobbyByCodePOST(req, res) {
        Default.joinLobbyByCodePOST(req.user, req.body)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    getLobbyByCodeGET(req, res) {
        Default.getLobbyByCodeGET(req.params.accessCode)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    addPlayerToGamePOST(req, res) {
        Default.addPlayerToGamePOST(req.user, req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    removePlayerFromGamePOST(req, res) {
        Default.removePlayerFromGamePOST(req.user, req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },

    submitScoreForPlayerPOST(req, res) {
        Default.submitScoreForPlayerPOST(req.user, req.body, req.params.gameId)
            .then(r => utils.writeJson(res, r))
            .catch(e => sendError(res, e));
    },
};
