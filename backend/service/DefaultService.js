'use strict';
const EventService = require('./EventService');
const LobbiesService = require('./LobbiesService');
const UsersService = require('./UsersService');
const GamesService = require('./GamesService');

/**
 * Login user (hybrid mode)
 */
module.exports.loginUserPOST = async function (body) {
    try {
        const { username, password } = body;

        if (!username) {
            throw { status: 400, message: 'Username is required' };
        }

        const result = await UsersService.loginUser(username, password);
        return result;
    } catch (error) {
        throw { status: error.status || 500, message: error.message };
    }
};

/**
 * Register user with password protection
 */
module.exports.registerUserPOST = async function (body) {
    try {
        const { username, password } = body;

        if (!username) {
            throw { status: 400, message: 'Username is required' };
        }

        if (!password) {
            throw { status: 400, message: 'Password is required for registration' };
        }

        const result = await UsersService.registerUser(username, password);
        return result;
    } catch (error) {
        throw { status: error.status || 500, message: error.message };
    }
};

/**
 * Delete a lobby
 */
module.exports.deleteLobbyDELETE = async function(body, lobbyId) {
    try {
        const { userId } = body;

        const user = await UsersService.getUserById(userId);
        if (!user) {
            throw { status: 401, message: 'User not found' };
        }

        await LobbiesService.deleteLobby(lobbyId, userId);
    } catch (error) {
        throw { status: error.message.includes('not found') ? 404 : 403, message: error.message };
    }
}

/**
 * Archive a lobby
 */
module.exports.archiveLobbyPOST = async function(body, lobbyId) {
    try {
        await LobbiesService.archiveLobby(lobbyId);
    } catch(error) {
        console.error('[ArchiveLobby] Error:', error);
        throw { status: error.status || 500, message: error.message };
    }
}

/**
 * Leave a lobby
 */
module.exports.leaveLobbyPOST = async function(body, lobbyId) {
    try {
        const { userId } = body;

        if (!userId) {
            throw { status: 400, message: 'User ID is required' };
        }

        const user = await UsersService.getUserById(userId);
        if (!user) {
            throw { status: 401, message: 'User not found' };
        }

        await LobbiesService.leaveLobby(lobbyId, userId);
    } catch (error) {
        console.error('[LeaveLobby] Error:', error);
        throw { status: error.status || 500, message: error.message };
    }
}

/**
 * Create a lobby (now with privacy option)
 */
module.exports.createLobbyPOST = async function(body) {
    try {
        const { name, userId, isPrivate } = body;

        if (!name) {
            throw { status: 400, message: 'Lobby name is required' };
        }

        if (!userId) {
            throw { status: 400, message: 'User ID is required' };
        }

        const user = await UsersService.getUserById(userId);
        if (!user) {
            console.error(`[CreateLobby] User not found with ID: ${userId}`);
            throw { status: 401, message: 'User not found' };
        }

        return await LobbiesService.createLobby(name, userId, user.username, isPrivate || false);
    } catch (error) {
        console.error('[CreateLobby] Error:', error);
        throw { status: error.status || 500, message: error.message };
    }
}

/**
 * Join lobby by access code
 */
module.exports.joinLobbyByCodePOST = async function(body) {
    try {
        const { accessCode, userId } = body;

        if (!accessCode) {
            throw { status: 400, message: 'Access code is required' };
        }

        if (!userId) {
            throw { status: 400, message: 'User ID is required' };
        }

        const user = await UsersService.getUserById(userId);
        if (!user) {
            throw { status: 401, message: 'User not found' };
        }

        return await LobbiesService.joinLobbyByCode(accessCode, userId, user.username);
    } catch (error) {
        throw { status: error.status || 400, message: error.message };
    }
}

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
}

/**
 * Force next round (Admin)
 */
module.exports.forceNextRoundPOST = async function(gameId) {
    try {
        return await GamesService.nextRound(gameId, true);
    } catch (error) {
        throw { status: 400, message: error.message };
    }
}

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
        throw { status: error.status || 500, message: error.message };
    }
};

/**
 * Get game state
 */
module.exports.getGameStateGET = async function (gameId) {
    try {
        const game = await GamesService.getGameById(gameId);
        if (!game) {
            throw { status: 404, message: 'Game not found' };
        }
        return GamesService.getGameResponse(game);
    } catch (error) {
        throw { status: error.status || 500, message: error.message };
    }
};

/**
 * Join a lobby
 */
module.exports.joinLobbyPOST = async function (body, lobbyId) {
    try {
        const { userId } = body;

        const user = await UsersService.getUserById(userId);
        if (!user) {
            throw { status: 401, message: 'User not found' };
        }
        return await LobbiesService.joinLobby(lobbyId, userId, user.username);
    } catch (error) {
        throw { status: 400, message: error.message };
    }
};

/**
 * List unarchived lobbies
 */
module.exports.listLobbiesGET = async function () {
    try {
        return await LobbiesService.listLobbies();
    } catch (error) {
        throw { status: 500, message: error.message };
    }
};

/**
 * List all lobbies
 */
module.exports.listAllLobbiesGET = async function () {
    try {
        return await LobbiesService.listAllLobbies();
    } catch (error) {
        throw { status: 500, message: error.message };
    }
};

/**
 * Logout user
 */
module.exports.logoutUserPOST = async function (sessionId) {
    try {
        await UsersService.logoutUser(sessionId);
    } catch (error) {
        throw { status: 500, message: error.message };
    }
};

/**
 * Advance to next round
 */
module.exports.nextRoundPOST = async function (gameId) {
    try {
        return await GamesService.nextRound(gameId, false);
    } catch (error) {
        throw { status: 400, message: error.message };
    }
};

/**
 * Reorder players
 */
module.exports.reorderPlayersPOST = async function (body, gameId) {
    try {
        const { fromIndex, toIndex, userId } = body;

        const user = await UsersService.getUserById(userId);
        if (!user) {
            throw { status: 401, message: 'User not found' };
        }

        const game = await GamesService.reorderPlayers(gameId, fromIndex, toIndex);
        return GamesService.getGameResponse(game);
    } catch (error) {
        throw { status: 400, message: error.message };
    }
};

/**
 * Reset current round
 */
module.exports.resetRoundPOST = async function (body, gameId) {
    try {
        const { userId } = body || {};

        if (userId) {
            const user = await UsersService.getUserById(userId);
            if (!user) {
                throw { status: 401, message: 'User not found' };
            }
        }

        return await GamesService.resetRound(gameId);
    } catch (error) {
        throw { status: 400, message: error.message };
    }
};

/**
 * Submit player score
 */
module.exports.submitScorePOST = async function (body, gameId) {
    try {
        const { playerId, score } = body;

        if (typeof score !== 'number') {
            throw { status: 400, message: 'Score must be a number' };
        }

        return await GamesService.submitScore(gameId, playerId, score);
    } catch (error) {
        throw { status: 400, message: error.message };
    }
};

module.exports.submitWinConditionPOST = async function (body, gameId) {
    try {
        const { winCondition } = body;

        if (typeof winCondition !== 'number') {
            throw { status: 400, message: 'Score must be a number' };
        }

        return await GamesService.submitWinCondition(gameId, winCondition);
    } catch (error) {
        throw { status: 400, message: error.message };
    }
}

/**
 * Update a player's historical score
 */
module.exports.updateHistoryScorePOST = async function(body, gameId) {
    try {
        const { playerId, roundIndex, newScore } = body;

        if (!playerId) {
            throw { status: 400, message: 'Player ID is required' };
        }

        if (typeof roundIndex !== 'number' || roundIndex < 0) {
            throw { status: 400, message: 'Valid round index is required' };
        }

        if (typeof newScore !== 'number') {
            throw { status: 400, message: 'Score must be a number' };
        }

        if (newScore % 5 !== 0) {
            throw { status: 400, message: 'Score must be divisible by 5' };
        }

        const user = await UsersService.getUserById(playerId);
        if (!user) {
            throw { status: 401, message: 'User not found' };
        }

        const game = await GamesService.updateHistoryScore(gameId, playerId, roundIndex, newScore);
        return GamesService.getGameResponse(game);
    } catch (error) {
        throw { status: error.status || 400, message: error.message };
    }
};

/**
 * Subscribe to game events (SSE)
 */
module.exports.subscribeToGameEventsGET = function subscribeToGameEventsGET(req, res) {
    const gameId = req.params.gameId;

    GamesService.getGameById(gameId)
        .then(game => {
            if (!game) {
                return res.status(404).json({ message: 'Game not found' });
            }

            EventService.addClient(gameId, res);

            res.on('close', () => {
                console.log(`[SSE] Connection closed for game ${gameId}`);
            });
        })
        .catch(error => {
            console.error('[SSE] Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        });
};