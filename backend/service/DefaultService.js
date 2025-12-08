'use strict';
const EventService = require('../service/EventService');
const LobbiesService = require('../service/LobbiesService');
const UsersService = require('../service/UsersService');
const GamesService = require('../service/GamesService');

/**
 * Create a lobby
 *
 * body CreateLobbyRequest
 * returns Lobby
 **/
module.exports.createLobbyPOST = function(body) {
    return new Promise(function(resolve, reject) {
        try {
            const { name, userId } = body;

            if (!name) {
                return reject({ status: 400, message: 'Lobby name is required' });
            }

            const user = UsersService.getUserById(userId);
            if (!user) {
                return reject({ status: 401, message: 'User not found' });
            }

            const lobby = LobbiesService.createLobby(name, userId, user.username);
            resolve(lobby);
        } catch (error) {
            reject({ status: 500, message: error.message });
        }
    });
}


/**
 * Delete a lobby
 *
 * body DeleteLobbyRequest
 * lobbyId uuid
 * returns void
 **/
module.exports.deleteLobbyDELETE = function(body, lobbyId) {
    return new Promise(function(resolve, reject) {
        try {
            const { userId } = body;

            const user = UsersService.getUserById(userId);
            if (!user) {
                return reject({ status: 401, message: 'User not found' });
            }

            LobbiesService.deleteLobby(lobbyId, userId);
            resolve();
        } catch (error) {
            reject({ status: error.message.includes('not found') ? 404 : 403, message: error.message });
        }
    });
}


/**
 * Force next round (Admin)
 *
 * gameId Integer
 * returns NextRoundResponse
 **/
module.exports.forceNextRoundPOST = function(gameId) {
    return new Promise(function(resolve, reject) {
        try {
            const result = GamesService.nextRound(gameId, true);
            resolve(result);
        } catch (error) {
            reject({ status: 400, message: error.message });
        }
    });
}


/**
 * Get current logged-in user
 *
 * returns User
 **/
module.exports.getCurrentUserGET = function (sessionId) {
    return new Promise(function (resolve, reject) {
        try {
            const user = UsersService.getUserBySession(sessionId);
            if (!user) {
                return reject({ status: 401, message: 'Not authenticated' });
            }
            resolve(user);
        } catch (error) {
            reject({ status: 500, message: error.message });
        }
    });
};


/**
 * Get game state
 *
 * gameId Integer
 * returns Game
 **/
module.exports.getGameStateGET = function (gameId) {
    return new Promise(function (resolve, reject) {
        try {
            const game = GamesService.getGameById(gameId);
            if (!game) {
                return reject({ status: 404, message: 'Game not found' });
            }
            resolve(GamesService.getGameResponse(game));
        } catch (error) {
            reject({ status: 500, message: error.message });
        }
    });
};


/**
 * Join a lobby
 *
 * body JoinLobbyRequest
 * lobbyId uuid
 * returns inline_response_200
 **/
module.exports.joinLobbyPOST = function (body, lobbyId) {
    return new Promise(function (resolve, reject) {
        try {
            const { userId } = body;

            const user = UsersService.getUserById(userId);
            if (!user) {
                return reject({ status: 401, message: 'User not found' });
            }
            const result = LobbiesService.joinLobby(lobbyId, userId, user.username);
            resolve(result);
        } catch (error) {
            reject({ status: 400, message: error.message });
        }
    });
};


/**
 * List all lobbies
 *
 * returns LobbyListResponse
 **/
module.exports.listLobbiesGET = function () {
    return new Promise(function (resolve, reject) {
        try {
            const lobbies = LobbiesService.listLobbies();
            resolve(lobbies);
        } catch (error) {
            reject({ status: 500, message: error.message });
        }
    });
};


/**
 * Login user
 *
 * body LoginRequest
 * returns User
 **/
module.exports.loginUserPOST = function (body) {
    return new Promise(function (resolve, reject) {
        try {
            const { username } = body;

            if (!username) {
                return reject({ status: 400, message: 'Username is required' });
            }

            const { user, sessionId } = UsersService.loginUser(username);
            resolve({ user, sessionId });
        } catch (error) {
            reject({ status: 500, message: error.message });
        }
    });
};


/**
 * Logout user
 *
 * no response value expected for this operation
 **/
module.exports.logoutUserPOST = function (sessionId) {
    return new Promise(function (resolve, reject) {
        try {
            UsersService.logoutUser(sessionId);
            resolve();
        } catch (error) {
            reject({ status: 500, message: error.message });
        }
    });
};


/**
 * Advance to next round
 *
 * gameId Integer
 * returns NextRoundResponse
 **/
module.exports.nextRoundPOST = function (gameId) {
    return new Promise(function (resolve, reject) {
        try {
            const result = GamesService.nextRound(gameId, false);
            resolve(result);
        } catch (error) {
            reject({ status: 400, message: error.message });
        }
    });
};


/**
 * Reorder players
 *
 * body ReorderPlayersRequest
 * gameId Integer
 * returns Game
 **/
module.exports.reorderPlayersPOST = function (body, gameId) {
    return new Promise(function (resolve, reject) {
        try {
            const { fromIndex, toIndex, userId } = body;

            const user = UsersService.getUserById(userId);
            if (!user) {
                return reject({ status: 401, message: 'User not found' });
            }

            const game = GamesService.reorderPlayers(gameId, fromIndex, toIndex);
            resolve(GamesService.getGameResponse(game));
        } catch (error) {
            reject({ status: 400, message: error.message });
        }
    });
};


/**
 * Reset current round
 *
 * body ResetRoundRequest  (optional)
 * gameId Integer
 * returns inline_response_200_2
 **/
module.exports.resetRoundPOST = function (body, gameId) {
    return new Promise(function (resolve, reject) {
        try {
            const { userId } = body || {};

            if (userId) {
                const user = UsersService.getUserById(userId);
                if (!user) {
                    return reject({ status: 401, message: 'User not found' });
                }
            }

            const result = GamesService.resetRound(gameId);
            resolve(result);
        } catch (error) {
            reject({ status: 400, message: error.message });
        }
    });
};


/**
 * Submit player score
 *
 * body SubmitScoreRequest
 * gameId Integer
 * returns inline_response_200_1
 **/
module.exports.submitScorePOST = function (body, gameId) {
    return new Promise(function (resolve, reject) {
        try {
            const { playerId, score } = body;

            if (typeof score !== 'number') {
                return reject({ status: 400, message: 'Score must be a number' });
            }

            const result = GamesService.submitScore(gameId, playerId, score);
            resolve(result);
        } catch (error) {
            reject({ status: 400, message: error.message });
        }
    });
};


/**
 * Subscribe to game events (SSE)
 *
 * gameId Integer
 * returns String
 **/

module.exports.subscribeToGameEventsGET = function subscribeToGameEventsGET(req, res) {
    const gameId = req.params.gameId;

    // Verify game exists
    const GamesService = require('../service/GamesService');
    const game = GamesService.getGameById(gameId);

    if (!game) {
        return res.status(404).json({ message: 'Game not found' });
    }

    // Add client to event service
    EventService.addClient(gameId, res);

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        } catch (error) {
            clearInterval(heartbeatInterval);
        }
    }, 30000); // Every 30 seconds

    // Clean up on close
    res.on('close', () => {
        clearInterval(heartbeatInterval);
    });
};