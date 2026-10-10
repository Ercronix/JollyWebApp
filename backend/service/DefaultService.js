'use strict';
const EventService = require('./EventService');
const LobbiesService = require('./LobbiesService');
const UsersService = require('./UsersService');
const GamesService = require('./GamesService');

const MAX_SCORE = 100000;

/**
 * Normalizes thrown values into { status, message } for the controller
 */
function httpError(error, fallbackStatus) {
    return { status: error.status || fallbackStatus, message: error.message };
}

function validateScore(score, label = 'Score') {
    if (!Number.isInteger(score) || Math.abs(score) > MAX_SCORE) {
        throw { status: 400, message: `${label} must be a whole number` };
    }
    if (score % 5 !== 0) {
        throw { status: 400, message: `${label} must be divisible by 5` };
    }
}

/**
 * Loads a game and ensures the requesting user is one of its (non-temporary) players
 */
async function getGameForPlayer(gameId, user) {
    const game = await GamesService.getGameById(gameId);
    if (!game) {
        throw { status: 404, message: 'Game not found' };
    }
    if (!GamesService.isPlayer(game, user.id)) {
        throw { status: 403, message: 'You are not a player in this game' };
    }
    return game;
}

/**
 * Loads a game and its lobby, and ensures the requesting user may see it
 */
async function getGameForViewer(gameId, user) {
    const game = await GamesService.getGameById(gameId);
    const lobby = game && await LobbiesService.getLobbyByGameId(game._id);
    if (!game || !lobby) {
        throw { status: 404, message: 'Game not found' };
    }
    if (!LobbiesService.canViewLobby(lobby, user.id)) {
        throw { status: 403, message: 'This game is private' };
    }
    return { game, lobby };
}

/**
 * Login user (hybrid mode)
 */
module.exports.loginUserPOST = async function (body) {
    try {
        const { username, password } = body || {};

        if (!username) {
            throw { status: 400, message: 'Username is required' };
        }

        return await UsersService.loginUser(username, password);
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Register user with password protection
 */
module.exports.registerUserPOST = async function (body) {
    try {
        const { username, password } = body || {};

        if (!username) {
            throw { status: 400, message: 'Username is required' };
        }

        if (!password) {
            throw { status: 400, message: 'Password is required for registration' };
        }

        return await UsersService.registerUser(username, password);
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Add a password to the current (passwordless) account
 */
module.exports.secureAccountPOST = async function (user, body) {
    try {
        return await UsersService.secureAccount(user.id, body?.password);
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Delete a lobby
 */
module.exports.deleteLobbyDELETE = async function(user, lobbyId) {
    try {
        await LobbiesService.deleteLobby(lobbyId, user.id);
    } catch (error) {
        throw httpError(error, error.message?.includes('not found') ? 404 : 500);
    }
};

/**
 * Archive a lobby
 */
module.exports.archiveLobbyPOST = async function(user, lobbyId) {
    try {
        await LobbiesService.archiveLobby(lobbyId, user.id);
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Leave a lobby
 */
module.exports.leaveLobbyPOST = async function(user, lobbyId) {
    try {
        await LobbiesService.leaveLobby(lobbyId, user.id);
    } catch (error) {
        throw httpError(error, error.message?.includes('not found') ? 404 : 500);
    }
};

/**
 * Create a lobby (now with privacy option)
 */
module.exports.createLobbyPOST = async function(user, body) {
    try {
        const { name, isPrivate } = body || {};

        if (typeof name !== 'string' || !name.trim()) {
            throw { status: 400, message: 'Lobby name is required' };
        }

        const trimmedName = name.trim();
        if (trimmedName.length > 50) {
            throw { status: 400, message: 'Lobby name must be at most 50 characters' };
        }

        const lobby = await LobbiesService.createLobby(trimmedName, user.id, user.username, isPrivate === true);

        // The creator needs the access code to share a private lobby
        return { ...LobbiesService.getLobbyResponse(lobby), accessCode: lobby.accessCode };
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Join lobby by access code
 */
module.exports.joinLobbyByCodePOST = async function(user, body) {
    try {
        const { accessCode } = body || {};

        if (typeof accessCode !== 'string' || !accessCode) {
            throw { status: 400, message: 'Access code is required' };
        }

        return await LobbiesService.joinLobbyByCode(accessCode, user.id, user.username);
    } catch (error) {
        throw httpError(error, error.message?.includes('not found') ? 404 : 400);
    }
};

/**
 * Get lobby by access code (for preview before joining)
 */
module.exports.getLobbyByCodeGET = async function(accessCode) {
    try {
        const lobby = await LobbiesService.getLobbyByCode(accessCode);
        return LobbiesService.getLobbyResponse(lobby);
    } catch (error) {
        throw { status: 404, message: error.message };
    }
};

/**
 * Force next round, even if not every player has submitted
 */
module.exports.forceNextRoundPOST = async function(user, gameId) {
    try {
        await getGameForPlayer(gameId, user);
        return await GamesService.nextRound(gameId, true);
    } catch (error) {
        throw httpError(error, 400);
    }
};

/**
 * Get current logged-in user
 */
module.exports.getCurrentUserGET = async function (sessionId) {
    try {
        const user = await UsersService.getUserBySession(sessionId);
        if (!user) {
            throw { status: 401, message: 'Not authenticated' };
        }
        return user;
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Get game state
 */
module.exports.getGameStateGET = async function (user, gameId) {
    try {
        const { game } = await getGameForViewer(gameId, user);
        return GamesService.getGameResponse(game);
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Join a lobby
 */
module.exports.joinLobbyPOST = async function (user, lobbyId) {
    try {
        return await LobbiesService.joinLobby(lobbyId, user.id, user.username);
    } catch (error) {
        throw httpError(error, error.message?.includes('not found') ? 404 : 400);
    }
};

/**
 * List unarchived lobbies
 */
module.exports.listLobbiesGET = async function () {
    try {
        return await LobbiesService.listLobbies();
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * List all lobbies visible to the user
 */
module.exports.listAllLobbiesGET = async function (user) {
    try {
        return await LobbiesService.listAllLobbies(user.id);
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Logout user
 */
module.exports.logoutUserPOST = async function (sessionId) {
    try {
        await UsersService.logoutUser(sessionId);
    } catch (error) {
        throw httpError(error, 500);
    }
};

/**
 * Advance to next round
 */
module.exports.nextRoundPOST = async function (user, gameId) {
    try {
        await getGameForPlayer(gameId, user);
        return await GamesService.nextRound(gameId, false);
    } catch (error) {
        throw httpError(error, 400);
    }
};

/**
 * Reorder players
 */
module.exports.reorderPlayersPOST = async function (user, body, gameId) {
    try {
        const { fromIndex, toIndex } = body || {};

        if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) {
            throw { status: 400, message: 'Invalid player indices' };
        }

        await getGameForPlayer(gameId, user);
        const game = await GamesService.reorderPlayers(gameId, fromIndex, toIndex);
        return GamesService.getGameResponse(game);
    } catch (error) {
        throw httpError(error, 400);
    }
};

/**
 * Reset current round
 */
module.exports.resetRoundPOST = async function (user, gameId) {
    try {
        await getGameForPlayer(gameId, user);
        return await GamesService.resetRound(gameId);
    } catch (error) {
        throw httpError(error, 400);
    }
};

/**
 * Submit the requesting user's own score
 */
module.exports.submitScorePOST = async function (user, body, gameId) {
    try {
        const { score } = body || {};
        validateScore(score);

        await getGameForPlayer(gameId, user);
        return await GamesService.submitScore(gameId, user.id, score);
    } catch (error) {
        throw httpError(error, 400);
    }
};

module.exports.submitWinConditionPOST = async function (user, body, gameId) {
    try {
        const { winCondition } = body || {};

        if (!Number.isInteger(winCondition)) {
            throw { status: 400, message: 'Win condition must be a whole number' };
        }

        await getGameForPlayer(gameId, user);
        return await GamesService.submitWinCondition(gameId, winCondition);
    } catch (error) {
        throw httpError(error, 400);
    }
};

/**
 * Update one of the requesting user's historical scores
 */
module.exports.updateHistoryScorePOST = async function(user, body, gameId) {
    try {
        const { roundIndex, newScore } = body || {};

        if (!Number.isInteger(roundIndex) || roundIndex < 0) {
            throw { status: 400, message: 'Valid round index is required' };
        }

        validateScore(newScore);

        await getGameForPlayer(gameId, user);
        const game = await GamesService.updateHistoryScore(gameId, user.id, roundIndex, newScore);
        return GamesService.getGameResponse(game);
    } catch (error) {
        throw httpError(error, 400);
    }
};

module.exports.addPlayerToGamePOST = async function(user, body, gameId) {
    try {
        const { playerName } = body || {};

        if (!playerName || typeof playerName !== 'string') {
            throw { status: 400, message: 'Player name is required' };
        }

        const trimmedName = playerName.trim();
        if (trimmedName.length < 1 || trimmedName.length > 50) {
            throw { status: 400, message: 'Player name must be between 1 and 50 characters' };
        }

        await getGameForPlayer(gameId, user);
        const game = await GamesService.addTemporaryPlayer(gameId, trimmedName);
        return GamesService.getGameResponse(game);
    } catch (error) {
        console.error('[AddPlayerToGame] Error:', error.message);
        throw httpError(error, 400);
    }
};

module.exports.removePlayerFromGamePOST = async function(user, body, gameId) {
    try {
        const { playerId } = body || {};

        if (typeof playerId !== 'string' || !playerId) {
            throw { status: 400, message: 'Player ID is required' };
        }

        await getGameForPlayer(gameId, user);
        const game = await GamesService.removePlayer(gameId, playerId);
        return GamesService.getGameResponse(game);
    } catch (error) {
        console.error('[RemovePlayerFromGame] Error:', error.message);
        throw httpError(error, 400);
    }
};

/**
 * Submit a score on behalf of another player (temporary players, admin mode)
 */
module.exports.submitScoreForPlayerPOST = async function(user, body, gameId) {
    try {
        const { playerId, score } = body || {};

        if (typeof playerId !== 'string' || !playerId) {
            throw { status: 400, message: 'Player ID is required' };
        }

        validateScore(score);

        await getGameForPlayer(gameId, user);
        return await GamesService.submitScoreForPlayer(gameId, playerId, score);
    } catch (error) {
        console.error('[SubmitScoreForPlayer] Error:', error.message);
        throw httpError(error, 400);
    }
};

/**
 * Subscribe to game events (SSE)
 */
module.exports.subscribeToGameEventsGET = function subscribeToGameEventsGET(req, res) {
    const gameId = req.params.gameId;

    getGameForViewer(gameId, req.user)
        .then(() => {
            EventService.addClient(gameId, res);
        })
        .catch(error => {
            if (error.status) {
                return res.status(error.status).json({ message: error.message });
            }
            console.error('[SSE] Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        });
};
