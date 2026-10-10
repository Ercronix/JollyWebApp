'use strict';

const crypto = require('crypto');
const Lobby = require('../models/Lobby');
const GamesService = require('./GamesService');
const OperationQueue = require('../utils/operationQueue');

class LobbiesService {
    constructor() {
        // Serializes changes per lobby, so concurrent joins/leaves don't overwrite each other
        this.queue = new OperationQueue('LobbiesService');
    }

    async createLobby(name, userId, username, isPrivate = false) {
        const lobby = new Lobby({
            name,
            playerCount: 0,
            players: [],
            createdBy: userId,
            archived: false,
            isPrivate: isPrivate
        });

        if (isPrivate) {
            lobby.accessCode = await this.generateAccessCode();
        }

        if (userId && username) {
            lobby.players.push({ userId, name: username });
            lobby.playerCount = 1;
        }

        await lobby.save();

        if (userId && username) {
            const game = await GamesService.createGame(lobby._id, lobby.players);
            lobby.gameId = game._id;
            await lobby.save();
        }

        return lobby;
    }

    async listLobbies() {
        const lobbies = await Lobby.find(undefined, undefined, undefined);

        return lobbies
            .filter(lobby => !lobby.archived && !lobby.isPrivate)
            .map(lobby => ({
                id: lobby._id,
                name: lobby.name,
                playerCount: lobby.playerCount,
                createdAt: lobby.createdAt,
                gameId: lobby.gameId,
                archived: lobby.archived,
                isPrivate: lobby.isPrivate
            }));
    }

    /**
     * All lobbies for the history page. Private lobbies are only listed for their creator and players.
     */
    async listAllLobbies(userId) {
        const lobbies = await Lobby.find(undefined, undefined, undefined);

        return lobbies
            .filter(lobby => !lobby.isPrivate || this.canManageLobby(lobby, userId))
            .map(lobby => ({ ...this.getLobbyResponse(lobby), archived: !!lobby.archived }));
    }

    canManageLobby(lobby, userId) {
        return lobby.createdBy?.toString() === userId.toString()
            || lobby.players.some(p => p.userId?.toString() === userId.toString());
    }

    async joinLobby(lobbyId, userId, username) {
        return this.queue.run(lobbyId, async () => {
            const lobby = await Lobby.findById(lobbyId);
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            const existingPlayer = lobby.players.find(p => p.userId.toString() === userId.toString());
            if (existingPlayer) {
                return { lobby: this.getLobbyResponse(lobby), playerId: userId };
            }

            lobby.players.push({ userId, name: username });
            lobby.playerCount = lobby.players.length;

            if (!lobby.gameId || lobby.playerCount === 1) {
                const game = await GamesService.createGame(lobby._id, lobby.players);
                lobby.gameId = game._id;
            } else {
                await GamesService.addPlayerToGame(lobby.gameId, userId, username);
            }

            await lobby.save();

            return { lobby: this.getLobbyResponse(lobby), playerId: userId };
        });
    }

    async leaveLobby(lobbyId, userId) {
        return this.queue.run(lobbyId, async () => {
            console.log(`[LobbiesService] Attempting to leave lobby ${lobbyId} for user ${userId}`);

            const lobby = await Lobby.findById(lobbyId);
            if (!lobby) {
                console.error(`[LobbiesService] Lobby not found: ${lobbyId}`);
                throw new Error('Lobby not found');
            }

            const playerIndex = lobby.players.findIndex(p => p.userId.toString() === userId.toString());
            if (playerIndex === -1) {
                console.log(`[LobbiesService] Player ${userId} not in lobby ${lobbyId}`);
                return; // Player not in lobby
            }

            // Remove player from lobby
            lobby.players.splice(playerIndex, 1);
            lobby.playerCount = lobby.players.length;
            console.log(`[LobbiesService] Player removed. New player count: ${lobby.playerCount}`);

            // Remove player from game if game exists
            if (lobby.gameId) {
                console.log(`[LobbiesService] Removing player from game ${lobby.gameId}`);
                await GamesService.removePlayerFromGame(lobby.gameId, userId);
            }

            // If lobby is empty, delete it
            if (lobby.playerCount === 0) {
                console.log(`[LobbiesService] Lobby ${lobbyId} is empty, deleting...`);
                if (lobby.gameId) {
                    await GamesService.deleteGame(lobby.gameId);
                }
                await Lobby.findByIdAndDelete(lobbyId);
                console.log(`[LobbiesService] Lobby ${lobbyId} deleted`);
            } else {
                await lobby.save();
                console.log(`[LobbiesService] Lobby ${lobbyId} updated`);
            }
        });
    }

    async deleteLobby(lobbyId, userId) {
        return this.queue.run(lobbyId, async () => {
            const lobby = await Lobby.findById(lobbyId);
            if (!lobby) {
                throw new Error('Lobby not found');
            }

            if (!this.canManageLobby(lobby, userId)) {
                throw { status: 403, message: 'Only the lobby creator or its players can delete this lobby' };
            }

            if (lobby.gameId) {
                await GamesService.deleteGame(lobby.gameId);
            }

            await Lobby.findByIdAndDelete(lobbyId);
        });
    }

    async archiveLobby(lobbyId, userId) {
        return this.queue.run(lobbyId, async () => {
            const lobby = await Lobby.findById(lobbyId);
            if (!lobby) {
                throw { status: 404, message: 'Lobby not found' };
            }

            if (!this.canManageLobby(lobby, userId)) {
                throw { status: 403, message: 'Only the lobby creator or its players can archive this lobby' };
            }

            lobby.archived = true;
            await lobby.save();
        });
    }

    getLobbyResponse(lobby) {
        return {
            id: lobby._id,
            name: lobby.name,
            playerCount: lobby.playerCount,
            createdAt: lobby.createdAt,
            gameId: lobby.gameId,
            isPrivate: lobby.isPrivate,
        };
    }

    /**
     * Get lobby by access code
     */
    async getLobbyByCode(accessCode) {
        if (typeof accessCode !== 'string') {
            throw new Error('Lobby not found with this code');
        }

        const lobby = await Lobby.findOne({
            accessCode: accessCode.toUpperCase(),
            archived: false
        });

        if (!lobby) {
            throw new Error('Lobby not found with this code');
        }

        return lobby;
    }

    /**
     * Join lobby by access code
     */
    async joinLobbyByCode(accessCode, userId, username) {
        const lobby = await this.getLobbyByCode(accessCode);

        // Use existing join logic
        return this.joinLobby(lobby._id.toString(), userId, username);
    }

    /**
     * Generate a unique 6-character access code
     */
    async generateAccessCode() {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar chars
        let attempts = 0;
        const maxAttempts = 100;

        while (attempts < maxAttempts) {
            let code = '';
            for (let i = 0; i < 6; i++) {
                code += characters.charAt(crypto.randomInt(characters.length));
            }

            // Check if code already exists
            const exists = await Lobby.findOne({ accessCode: code });
            if (!exists) {
                return code;
            }

            attempts++;
        }

        throw new Error('Could not generate unique access code');
    }
}

module.exports = new LobbiesService();