import React, { useState } from "react";
import { UserModel } from "@/core/models/UserModel";

export type Player = {
    id: number;
    name: string;
    userId?: string; // Link to actual user
    isCurrentUser: boolean; // Flag to identify the current user
    totalScore: number;
    currentRoundScore: number | null;
    hasSubmitted: boolean;
};

export type GameState = {
    players: Player[];
    currentDealer: number;
    roundNumber: number;
    showReorderMode: boolean;
    tempScores: { [playerId: number]: string };
    allPlayersSubmitted: boolean;
    submittedCount: number;
    currentUserId: string;
};

export type GameSearchParams = {
    lobbyId?: number;
    lobbyName?: string;
    playerCount?: number;
};

export class GameViewModel {
    private readonly setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    private gameState: GameState;

    constructor(
        gameState: GameState,
        setGameState: React.Dispatch<React.SetStateAction<GameState>>
    ) {
        this.gameState = gameState;
        this.setGameState = setGameState;
    }

    // Initialize game with lobby data and current user
    static initializeGame(searchParams: GameSearchParams): GameState {
        const userModel = UserModel.getInstance();
        const currentUser = userModel.getCurrentUser();

        if (!currentUser) {
            throw new Error("No user logged in");
        }

        const playerCount = searchParams.playerCount || 4;
        const players: Player[] = [];

        // First player is always the current user
        players.push({
            id: 1,
            name: currentUser.username,
            userId: currentUser.id,
            isCurrentUser: true,
            totalScore: 0,
            currentRoundScore: null,
            hasSubmitted: false
        });

        // Add other players (AI/placeholder players for now)
        for (let i = 2; i <= playerCount; i++) {
            players.push({
                id: i,
                name: `Player ${i}`,
                userId: undefined,
                isCurrentUser: false,
                totalScore: 0,
                currentRoundScore: null,
                hasSubmitted: false
            });
        }

        const allPlayersSubmitted = players.every(player => player.hasSubmitted);
        const submittedCount = players.filter(player => player.hasSubmitted).length;

        return {
            players,
            currentDealer: 0,
            roundNumber: 1,
            showReorderMode: false,
            tempScores: {},
            allPlayersSubmitted,
            submittedCount,
            currentUserId: currentUser.id
        };
    }

    // Check if current user can edit this player's score
    canEditPlayerScore = (playerId: number): boolean => {
        const player = this.gameState.players.find(p => p.id === playerId);
        return player?.isCurrentUser || false;
    };

    // Handle score input changes (only for current user)
    handleScoreInput = (playerId: number, value: string) => {
        if (!this.canEditPlayerScore(playerId)) {
            return; // Ignore input for other players
        }

        this.setGameState(prev => ({
            ...prev,
            tempScores: {
                ...prev.tempScores,
                [playerId]: value
            }
        }));
    };

    // Submit score for a player (only current user can submit their own)
    handleSubmitScore = (playerId: number) => {
        if (!this.canEditPlayerScore(playerId)) {
            return; // Can't submit for other players
        }

        const scoreValue = parseInt(this.gameState.tempScores[playerId] || '0');
        if (isNaN(scoreValue)) return;

        this.setGameState(prev => {
            const newPlayers = prev.players.map(player =>
                player.id === playerId
                    ? {
                        ...player,
                        currentRoundScore: scoreValue,
                        hasSubmitted: true
                    }
                    : player
            );

            const newTempScores = { ...prev.tempScores };
            delete newTempScores[playerId];

            const allPlayersSubmitted = newPlayers.every(player => player.hasSubmitted);
            const submittedCount = newPlayers.filter(player => player.hasSubmitted).length;

            return {
                ...prev,
                players: newPlayers,
                tempScores: newTempScores,
                allPlayersSubmitted,
                submittedCount
            };
        });
    };

    // Advance to next round
    handleNextRound = () => {
        this.setGameState(prev => {
            const newPlayers = prev.players.map(player => ({
                ...player,
                totalScore: player.totalScore + (player.currentRoundScore || 0),
                currentRoundScore: null,
                hasSubmitted: false
            }));

            const newCurrentDealer = (prev.currentDealer + 1) % prev.players.length;

            return {
                ...prev,
                players: newPlayers,
                currentDealer: newCurrentDealer,
                roundNumber: prev.roundNumber + 1,
                tempScores: {},
                allPlayersSubmitted: false,
                submittedCount: 0
            };
        });
    };

    // Reset current round
    handleResetRound = () => {
        this.setGameState(prev => {
            const newPlayers = prev.players.map(player => ({
                ...player,
                currentRoundScore: null,
                hasSubmitted: false
            }));

            return {
                ...prev,
                players: newPlayers,
                tempScores: {},
                allPlayersSubmitted: false,
                submittedCount: 0
            };
        });
    };

    // Toggle reorder mode
    toggleReorderMode = () => {
        this.setGameState(prev => ({
            ...prev,
            showReorderMode: !prev.showReorderMode
        }));
    };

    // Reorder players with dealer position adjustment
    handleReorderPlayers = (fromIndex: number, toIndex: number) => {
        this.setGameState(prev => {
            const newPlayers = [...prev.players];
            const [movedPlayer] = newPlayers.splice(fromIndex, 1);
            newPlayers.splice(toIndex, 0, movedPlayer);

            // Adjust dealer index after reordering
            let newCurrentDealer = prev.currentDealer;
            if (fromIndex === prev.currentDealer) {
                newCurrentDealer = toIndex;
            } else if (fromIndex < prev.currentDealer && toIndex >= prev.currentDealer) {
                newCurrentDealer = prev.currentDealer - 1;
            } else if (fromIndex > prev.currentDealer && toIndex <= prev.currentDealer) {
                newCurrentDealer = prev.currentDealer + 1;
            }

            return {
                ...prev,
                players: newPlayers,
                currentDealer: newCurrentDealer
            };
        });
    };

    // Handle drag and drop
    handleDragStart = (e: React.DragEvent, playerIndex: number) => {
        e.dataTransfer.setData('text/plain', playerIndex.toString());
    };

    handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));

        if (fromIndex !== targetIndex) {
            this.handleReorderPlayers(fromIndex, targetIndex);
        }
    };

    // Get game statistics
    getGameStats = () => {
        return {
            currentRound: this.gameState.roundNumber,
            submittedProgress: `${this.gameState.submittedCount}/${this.gameState.players.length}`,
            currentDealerName: this.gameState.players[this.gameState.currentDealer]?.name,
            highestTotalScore: Math.max(...this.gameState.players.map(p => p.totalScore))
        };
    };

    // Get current dealer info
    getCurrentDealer = () => {
        return this.gameState.players[this.gameState.currentDealer];
    };

    // Check if player can submit score (considering user permissions)
    canSubmitScore = (playerId: number) => {
        if (!this.canEditPlayerScore(playerId)) {
            return false;
        }
        const tempScore = this.gameState.tempScores[playerId];
        return tempScore && tempScore.trim() !== '';
    };

    // Get current user's player
    getCurrentUserPlayer = () => {
        return this.gameState.players.find(player => player.isCurrentUser);
    };

    // Check if current user has submitted their score
    hasCurrentUserSubmitted = () => {
        const currentUserPlayer = this.getCurrentUserPlayer();
        return currentUserPlayer?.hasSubmitted || false;
    };
}

// Custom hook for Game ViewModel
export function useGameViewModel(searchParams: GameSearchParams) {
    const [gameState, setGameState] = useState<GameState>(() => {
        try {
            return GameViewModel.initializeGame(searchParams);
        } catch (error) {
            // If no user is logged in, redirect would be handled by the route component
            throw error;
        }
    });

    const viewModel = new GameViewModel(gameState, setGameState);

    return {
        gameState,
        viewModel
    };
}