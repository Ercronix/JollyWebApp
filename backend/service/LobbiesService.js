'use strict';

const { v4: uuidv4 } = require('uuid');
const GamesService = require('./GamesService');

class LobbiesService {
    constructor() {
        this.lobbies = new Map(); // lobbyId -> Lobby
    }

    createLobby(name, userId, username) {
        const lobby = {
            id: uuidv4(),
            name,
            playerCount: 0,
            players: [], // Array of { userId, name }
            createdBy: userId, // Track who created the lobby
            createdAt: new Date().toISOString(),
            gameId: null
        };


        // Automatically add creator to lobby (if userId provided)
        if (userId && username) {
            lobby.players.push({ userId, name: username });
            lobby.playerCount = 1;

            const game = GamesService.createGame(lobby.id, lobby.players);
            lobby.gameId = game.id;
        }
        this.lobbies.set(lobby.id, lobby);
        return lobby;
    }

    listLobbies() {
        return Array.from(this.lobbies.values()).map(lobby => ({
            id: lobby.id,
            name: lobby.name,
            playerCount: lobby.playerCount,
            createdAt: lobby.createdAt,
            gameId: lobby.gameId
        }));
    }

    joinLobby(lobbyId, userId, username) {
        console.log('test');
        console.log(lobbyId, userId, username);
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            throw new Error('Lobby not found');
        }

        // Check if user already in lobby
        const existingPlayer = lobby.players.find(p => p.userId === userId);
        if (existingPlayer) {
            return { lobby: this.getLobbyResponse(lobby), playerId: userId };
        }

        // Add player to lobby
        lobby.players.push({ userId, name: username });
        lobby.playerCount = lobby.players.length;

        // If this is the first player or game doesn't exist, create game
        if (!lobby.gameId || lobby.playerCount === 1) {
            const game = GamesService.createGame(lobby.id, lobby.players);
            lobby.gameId = game.id;
        } else {
            // Add player to existing game
            GamesService.addPlayerToGame(lobby.gameId, userId, username);
        }

        return { lobby: this.getLobbyResponse(lobby), playerId: userId };
    }

    deleteLobby(lobbyId, userId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            throw new Error('Lobby not found');
        }

        // Optional: Add permission check - only creator can delete
        // Uncomment if you want to restrict deletion to lobby creator
        // if (lobby.createdBy !== userId) {
        //     throw new Error('Only the lobby creator can delete this lobby');
        // }

        // Delete associated game if it exists
        if (lobby.gameId) {
            GamesService.deleteGame(lobby.gameId);
        }

        // Delete the lobby
        this.lobbies.delete(lobbyId);
    }

    getLobbyResponse(lobby) {
        return {
            id: lobby.id,
            name: lobby.name,
            playerCount: lobby.playerCount,
            createdAt: lobby.createdAt,
            gameId: lobby.gameId
        };
    }
}

module.exports = new LobbiesService();