'use strict';

const utils = require('../utils/writer.js');
const Default = require('../service/DefaultService');

function getSessionId(req) {
    return req.cookies?.sessionId || req.headers['x-session-id'];
}

module.exports.createLobbyPOST = function createLobbyPOST (req, res, next) {
    const body = req.body;
    Default.createLobbyPOST(body)
        .then(function (response) {
            utils.writeJson(res, response, 201);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.forceNextRoundPOST = function forceNextRoundPOST (req, res, next) {
    const gameId = req.params.gameId;
    Default.forceNextRoundPOST(gameId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.getCurrentUserGET = function getCurrentUserGET (req, res, next) {
    const sessionId = getSessionId(req);
    Default.getCurrentUserGET(sessionId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.getGameStateGET = function getGameStateGET (req, res, next) {
    const gameId = req.params.gameId;
    Default.getGameStateGET(gameId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.joinLobbyPOST = function joinLobbyPOST (req, res, next) {
    const body = req.body;
    const lobbyId = req.params.lobbyId;

    Default.joinLobbyPOST(body, lobbyId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.listLobbiesGET = function listLobbiesGET (req, res, next) {
    Default.listLobbiesGET()
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.loginUserPOST = function loginUserPOST (req, res, next) {
    const body = req.body;
    Default.loginUserPOST(body)
        .then(function (response) {
            // Set session cookie
            res.cookie('sessionId', response.sessionId, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'lax'
            });

            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.logoutUserPOST = function logoutUserPOST (req, res, next) {
    const sessionId = getSessionId(req);
    Default.logoutUserPOST(sessionId)
        .then(function () {
            res.clearCookie('sessionId');
            res.status(204).send();
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.nextRoundPOST = function nextRoundPOST (req, res, next) {
    const gameId = req.params.gameId;
    Default.nextRoundPOST(gameId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.reorderPlayersPOST = function reorderPlayersPOST (req, res, next) {
    const body = req.body;
    const gameId = req.params.gameId;
    Default.reorderPlayersPOST(body, gameId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.resetRoundPOST = function resetRoundPOST (req, res, next) {
    const body = req.body;
    const gameId = req.params.gameId;
    Default.resetRoundPOST(body, gameId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.submitScorePOST = function submitScorePOST (req, res, next) {
    const body = req.body;
    const gameId = req.params.gameId;
    Default.submitScorePOST(body, gameId)
        .then(function (response) {
            utils.writeJson(res, response);
        })
        .catch(function (error) {
            utils.writeJson(res, error, error.status || 500);
        });
};

module.exports.subscribeToGameEventsGET = function subscribeToGameEventsGET (req, res, next) {
    const gameId = req.params.gameId;
    // Call the service function directly with req, res, next
    Default.subscribeToGameEventsGET(req, res, next);
};