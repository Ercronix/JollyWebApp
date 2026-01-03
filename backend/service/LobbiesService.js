'use strict';

const Lobby = require('../models/Lobby');
const GamesService = require('./GamesService');

class LobbiesService {
    async createLobby(name, userId, username) {
        const lobby = new Lobby({
            name,
            playerCount: 0,
            players: [],
            createdBy: userId,
            archived: false
        });

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
            .filter(lobby => !lobby.archived)
            .map(lobby => ({
                id: lobby._id,
                name: lobby.name,
                playerCount: lobby.playerCount,
                createdAt: lobby.createdAt,
                gameId: lobby.gameId,
                archived: lobby.archived
            }));
    }

    async joinLobby(lobbyId, userId, username) {
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
    }

    // ADD THIS METHOD - it's the missing one
    async leaveLobby(lobbyId, userId) {
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
    }

    async deleteLobby(lobbyId, userId) {
        const lobby = await Lobby.findById(lobbyId);
        if (!lobby) {
            throw new Error('Lobby not found');
        }

        if (lobby.gameId) {
            await GamesService.deleteGame(lobby.gameId);
        }

        await Lobby.findByIdAndDelete(lobbyId);
    }

    async archiveLobby(lobbyId) {
        const lobby = await Lobby.findById(lobbyId);
        if (!lobby) {
            throw new Error('Lobby not found');
        }
        lobby.archived = true;
        await lobby.save();
        await this.listLobbies();
    }

    getLobbyResponse(lobby) {
        return {
            id: lobby._id,
            name: lobby.name,
            playerCount: lobby.playerCount,
            createdAt: lobby.createdAt,
            gameId: lobby.gameId
        };
    }
}

module.exports = new LobbiesService();