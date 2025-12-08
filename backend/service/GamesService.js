'use strict';

const { v4: uuidv4 } = require('uuid');
const EventService = require('./EventService');

class GamesService {
    constructor() {
        this.games = new Map(); // gameId -> Game
        this.POINTS_GOAL = 1000; // Game ends when a player reaches this score
    }

    createGame(lobbyId, players) {
        const game = {
            id: uuidv4(),
            lobbyId,
            players: players.map(p => ({
                name: p.name,
                userId: p.userId,
                totalScore: 0,
                currentRoundScore: 0,
                hasSubmitted: false,
                createdAt: new Date().toISOString()
            })),
            currentDealer: players[0]?.userId || null,
            currentRound: 1,
            createdAt: new Date().toISOString(),
            isFinished: false,
            winner: null
        };
        this.games.set(game.id, game);
        return game;
    }

    getGameById(gameId) {
        return this.games.get(gameId);
    }

    addPlayerToGame(gameId, userId, username) {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        // Check if player already exists
        const existingPlayer = game.players.find(p => p.userId === userId);
        if (existingPlayer) {
            return game;
        }

        game.players.push({
            name: username,
            userId,
            totalScore: 0,
            currentRoundScore: 0,
            hasSubmitted: false,
            createdAt: new Date().toISOString()
        });

        // Send event to all clients
        EventService.sendEvent(gameId, {
            type: 'PLAYER_JOINED',
            game: this.getGameResponse(game),
            player: {
                userId,
                name: username,
                score: 0
            }
        });

        return game;
    }

    submitScore(gameId, playerId, score) {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        if (game.isFinished) {
            throw new Error('Game has already ended');
        }

        const player = game.players.find(p => p.userId === playerId);
        if (!player) {
            throw new Error('Player not found in game');
        }

        if (player.hasSubmitted) {
            throw new Error('Player has already submitted score for this round');
        }

        player.currentRoundScore = score;
        player.hasSubmitted = true;

        // Check if all players have submitted
        const allPlayersSubmitted = this.allPlayersSubmitted(game);

        // Send event to all clients
        EventService.sendEvent(gameId, {
            type: 'SCORE_SUBMITTED',
            game: this.getGameResponse(game),
            player: {
                userId: player.userId,
                name: player.name,
                score: score
            },
            allPlayersSubmitted
        });

        return { game, player };
    }

    allPlayersSubmitted(game) {
        return game.players.every(p => p.hasSubmitted);
    }

    nextRound(gameId, force = false) {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        if (game.isFinished) {
            return { game, message: 'Game has already ended' };
        }

        if (!force && !this.allPlayersSubmitted(game)) {
            throw new Error('Not all players have submitted their scores');
        }

        // Add current round scores to total scores
        game.players.forEach(player => {
            player.totalScore += player.currentRoundScore;
        });

        // Check if any player has won
        const winner = game.players.find(p => p.totalScore >= this.POINTS_GOAL);
        if (winner) {
            game.isFinished = true;
            game.winner = winner.userId;

            // Reset for display purposes
            game.players.forEach(player => {
                player.currentRoundScore = 0;
                player.hasSubmitted = false;
            });

            EventService.sendEvent(gameId, {
                type: 'GAME_ENDED',
                game: this.getGameResponse(game),
                winner: {
                    userId: winner.userId,
                    name: winner.name,
                    totalScore: winner.totalScore
                }
            });

            return {
                game,
                message: `Game ended! ${winner.name} wins with ${winner.totalScore} points!`
            };
        }

        // Move to next round
        game.currentRound++;

        // Reset round scores and submissions
        game.players.forEach(player => {
            player.currentRoundScore = 0;
            player.hasSubmitted = false;
        });

        // Move dealer to next player
        const currentDealerIndex = game.players.findIndex(p => p.userId === game.currentDealer);
        const nextDealerIndex = (currentDealerIndex + 1) % game.players.length;
        game.currentDealer = game.players[nextDealerIndex].userId;

        // Send event to all clients
        EventService.sendEvent(gameId, {
            type: 'ROUND_STARTED',
            game: this.getGameResponse(game)
        });

        return { game, message: `Round ${game.currentRound} started` };
    }

    reorderPlayers(gameId, fromIndex, toIndex) {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        if (fromIndex < 0 || fromIndex >= game.players.length ||
            toIndex < 0 || toIndex >= game.players.length) {
            throw new Error('Invalid player indices');
        }

        const [movedPlayer] = game.players.splice(fromIndex, 1);
        game.players.splice(toIndex, 0, movedPlayer);

        // Send event to all clients
        EventService.sendEvent(gameId, {
            type: 'PLAYERS_REORDERED',
            game: this.getGameResponse(game)
        });

        return game;
    }

    resetRound(gameId) {
        const game = this.games.get(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        if (game.isFinished) {
            throw new Error('Cannot reset round - game has ended');
        }

        // Reset current round scores and submissions
        game.players.forEach(player => {
            player.currentRoundScore = 0;
            player.hasSubmitted = false;
        });

        // Send event to all clients
        EventService.sendEvent(gameId, {
            type: 'ROUND_RESET',
            game: this.getGameResponse(game)
        });

        return { game, message: 'Round has been reset' };
    }

    getGameResponse(game) {
        return {
            id: game.id,
            players: game.players,
            currentDealer: game.currentDealer,
            currentRound: game.currentRound,
            createdAt: game.createdAt,
            isFinished: game.isFinished,
            winner: game.winner
        };
    }
}

module.exports = new GamesService();