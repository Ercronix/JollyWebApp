'use strict';

const Game = require('../models/Game');
const EventService = require('./EventService');
const config = require('../config');

class GamesService {
    constructor() {
        this.operationQueues = new Map();
        this.POINTS_GOAL = config.game.pointsGoal;
    }

    queueOperation(gameId, operation) {
        if (!this.operationQueues.has(gameId)) {
            this.operationQueues.set(gameId, Promise.resolve());
        }

        const currentQueue = this.operationQueues.get(gameId);
        const newQueue = currentQueue
            .then(() => operation())
            .catch(err => {
                console.error(`[GamesService] Operation error for game ${gameId}:`, err);
                throw err;
            });

        this.operationQueues.set(gameId, newQueue);
        return newQueue;
    }

    async createGame(lobbyId, players) {
        const game = new Game({
            lobbyId,
            players: players.map(p => ({
                name: p.name,
                userId: p.userId,
                totalScore: 0,
                currentRoundScore: 0,
                hasSubmitted: false,
                pointsHistory: [] // Initialize empty points history
            })),
            currentDealer: players[0]?.userId || null,
            currentRound: 1,
            isFinished: false,
            winner: null
        });

        await game.save();
        console.log(`[GamesService] Game created: ${game._id}`);
        return game;
    }

    async getGameById(gameId) {
        return Game.findById(gameId);
    }

    async deleteGame(gameId) {
        await Game.findByIdAndDelete(gameId);
        this.operationQueues.delete(gameId);
        console.log(`[GamesService] Game ${gameId} deleted`);
    }

    async addPlayerToGame(gameId, userId, username) {
        return this.queueOperation(gameId, async () => {
            const game = await Game.findById(gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            const existingPlayer = game.players.find(p => p.userId.toString() === userId.toString());
            if (existingPlayer) {
                return game;
            }
            let pointsHistory = [];
            if (game.currentRound >= 0) {
                pointsHistory = Array(game.currentRound - 1).fill(0);
            }

            game.players.push({
                name: username,
                userId,
                totalScore: 0,
                currentRoundScore: 0,
                hasSubmitted: false,
                pointsHistory: pointsHistory // Initialize empty points history for new players
            });

            await game.save();

            EventService.sendEvent(gameId.toString(), {
                type: 'PLAYER_JOINED',
                game: this.getGameResponse(game),
                player: { userId, name: username, score: 0 }
            });

            console.log(`[GamesService] Player ${username} added to game ${gameId}`);
            return game;
        });
    }

    // ADD THIS METHOD - it's the missing one
    async removePlayerFromGame(gameId, userId) {
        return this.queueOperation(gameId, async () => {
            console.log(`[GamesService] Removing player ${userId} from game ${gameId}`);

            const game = await Game.findById(gameId);
            if (!game) {
                console.error(`[GamesService] Game not found: ${gameId}`);
                throw new Error('Game not found');
            }

            const playerIndex = game.players.findIndex(p => p.userId.toString() === userId.toString());
            if (playerIndex === -1) {
                console.log(`[GamesService] Player ${userId} not in game ${gameId}`);
                return game; // Player not in game
            }

            // Remove player
            game.players.splice(playerIndex, 1);
            console.log(`[GamesService] Player removed. Remaining players: ${game.players.length}`);

            // Update dealer if necessary
            if (game.players.length > 0 && game.currentDealer.toString() === userId.toString()) {
                game.currentDealer = game.players[0].userId;
                console.log(`[GamesService] Dealer updated to ${game.players[0].name}`);
            }

            await game.save();

            EventService.sendEvent(gameId.toString(), {
                type: 'PLAYER_LEFT',
                game: this.getGameResponse(game),
                userId
            });

            console.log(`[GamesService] Player ${userId} successfully removed from game ${gameId}`);
            return game;
        });
    }

    async submitScore(gameId, playerId, score) {
        return this.queueOperation(gameId, async () => {
            const game = await Game.findById(gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            if (game.isFinished) {
                throw new Error('Game has already ended');
            }

            const player = game.players.find(p => p.userId.toString() === playerId.toString());
            if (!player) {
                throw new Error('Player not found in game');
            }

            if (player.hasSubmitted) {
                throw new Error('Player has already submitted score for this round');
            }

            player.currentRoundScore = score;
            player.hasSubmitted = true;

            await game.save();

            const allPlayersSubmitted = this.allPlayersSubmitted(game);

            EventService.sendEvent(gameId.toString(), {
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
        });
    }

    allPlayersSubmitted(game) {
        return game.players.every(p => p.hasSubmitted);
    }

    async nextRound(gameId, force = false) {
        return this.queueOperation(gameId, async () => {
            const game = await Game.findById(gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            if (game.isFinished) {
                return { game, message: 'Game has already ended' };
            }

            if (!force && !this.allPlayersSubmitted(game)) {
                throw new Error('Not all players have submitted their scores');
            }

            // Add current round scores to points history and update total scores
            game.players.forEach(player => {
                // Add to points history
                if (!player.pointsHistory) {
                    player.pointsHistory = [];
                }
                player.pointsHistory.push(player.currentRoundScore);

                // Update total score
                player.totalScore += player.currentRoundScore;
            });

            const winner = game.players.find(p => p.totalScore >= this.POINTS_GOAL);
            if (winner) {
                game.isFinished = true;
                game.winner = winner.userId;

                game.players.forEach(player => {
                    player.currentRoundScore = 0;
                    player.hasSubmitted = false;
                });

                await game.save();

                EventService.sendEvent(gameId.toString(), {
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

            game.currentRound++;
            game.players.forEach(player => {
                player.currentRoundScore = 0;
                player.hasSubmitted = false;
            });

            const currentDealerIndex = game.players.findIndex(p => p.userId.toString() === game.currentDealer.toString());
            const nextDealerIndex = (currentDealerIndex + 1) % game.players.length;
            game.currentDealer = game.players[nextDealerIndex].userId;

            await game.save();

            EventService.sendEvent(gameId.toString(), {
                type: 'ROUND_STARTED',
                game: this.getGameResponse(game)
            });

            return { game, message: `Round ${game.currentRound} started` };
        });
    }

    async reorderPlayers(gameId, fromIndex, toIndex) {
        return this.queueOperation(gameId, async () => {
            const game = await Game.findById(gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            if (
                fromIndex < 0 || fromIndex >= game.players.length ||
                toIndex < 0 || toIndex >= game.players.length
            ) {
                throw new Error('Invalid player indices');
            }

            // Move the player
            const [movedPlayer] = game.players.splice(fromIndex, 1);
            game.players.splice(toIndex, 0, movedPlayer);

            // Ensure first player in list becomes the dealer
            if (game.players.length > 0) {
                game.currentDealer = game.players[0].userId;
            }

            await game.save();

            EventService.sendEvent(gameId.toString(), {
                type: 'PLAYERS_REORDERED',
                game: this.getGameResponse(game)
            });

            return game;
        });
    }

    async resetRound(gameId) {
        return this.queueOperation(gameId, async () => {
            const game = await Game.findById(gameId);
            if (!game) {
                throw new Error('Game not found');
            }

            if (game.isFinished) {
                throw new Error('Cannot reset round - game has ended');
            }

            game.players.forEach(player => {
                player.currentRoundScore = 0;
                player.hasSubmitted = false;
            });

            await game.save();

            EventService.sendEvent(gameId.toString(), {
                type: 'ROUND_RESET',
                game: this.getGameResponse(game)
            });

            return { game, message: 'Round has been reset' };
        });
    }

    getGameResponse(game) {
        return {
            id: game._id,
            players: game.players.map(p => ({
                name: p.name,
                userId: p.userId,
                totalScore: p.totalScore,
                currentRoundScore: p.currentRoundScore,
                hasSubmitted: p.hasSubmitted,
                pointsHistory: p.pointsHistory || []
            })),
            currentDealer: game.currentDealer,
            currentRound: game.currentRound,
            createdAt: game.createdAt,
            isFinished: game.isFinished,
            winner: game.winner
        };
    }

    shutdown() {
        const allQueues = Array.from(this.operationQueues.values());
        return Promise.allSettled(allQueues);
    }
}

module.exports = new GamesService();
