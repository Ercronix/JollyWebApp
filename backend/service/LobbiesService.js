'use strict';

const Lobby = require('../models/Lobby');
const GamesService = require('./GamesService');

class LobbiesService {
    async createLobby(name, userId, username) {
        const lobby = new Lobby({
            name,
            playerCount: 0,
            players: [],
            createdBy: userId
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
        const lobbies = await Lobby.find();
        return lobbies.map(lobby => ({
            id: lobby._id,
            name: lobby.name,
            playerCount: lobby.playerCount,
            createdAt: lobby.createdAt,
            gameId: lobby.gameId
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